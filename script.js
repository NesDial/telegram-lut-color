const lutFiles = [
    { name: "Gold 200", file: "luts/gold200.cube" },
    { name: "Moody Film", file: "luts/moody_film.cube" },
    { name: "Film Fade", file: "luts/film_fade.cube" }
];

let luts = {};
let originalImage;
let previewImage;

const upload = document.getElementById("upload");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");

async function loadLUT(file) {
    const text = await fetch(file).then(r => r.text());
    const lines = text.split("\n").filter(l => !l.startsWith("#"));
    const table = [];

    for (let line of lines) {
        const p = line.trim().split(" ");
        if (p.length === 3) table.push([+p[0]*255, +p[1]*255, +p[2]*255]);
    }
    return table;
}

async function initLUTs() {
    for (let lut of lutFiles) {
        luts[lut.name] = await loadLUT(lut.file);
    }
}
initLUTs();

upload.addEventListener("change", handleFile);

async function handleFile(e) {
    const file = e.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        originalImage = img;
        createPreview(img);
    };
}

function resizeImage(img, maxSide = 4096) {
    const ratio = img.width / img.height;
    let w = img.width;
    let h = img.height;

    if (Math.max(w, h) > maxSide) {
        if (w > h) { w = maxSide; h = maxSide / ratio; }
        else { h = maxSide; w = maxSide * ratio; }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return canvas;
}

function createPreview(img) {
    previewImage = resizeImage(img, 900);
    previewCanvas.width = previewImage.width;
    previewCanvas.height = previewImage.height;
    renderPreview();
}

function mix(a, b, t) { return a + (b - a) * t; }

function applySharpen(data, width, height, amount) {
    if (amount <= 0) return data;
    const copy = new Uint8ClampedArray(data);
    const strength = amount / 100 * 1.2;

    for (let i = 4; i < data.length - 4; i += 4) {
        data[i] = mix(copy[i], copy[i] + (copy[i] - copy[i - 4]), strength);
        data[i+1] = mix(copy[i+1], copy[i+1] + (copy[i+1] - copy[i+1 - 4]), strength);
        data[i+2] = mix(copy[i+2], copy[i+2] + (copy[i+2] - copy[i+2 - 4]), strength);
    }
    return data;
}

function renderPreview() {
    if (!previewImage) return;

    const activeLUT = Object.keys(luts)[0]; // пока берем первый — позже сделаю свайп
    const lut = luts[activeLUT];

    ctx.drawImage(previewImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
    const data = imgData.data;

    const strength = document.getElementById("lutStrength").value / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const idx = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const lutPix = lut[idx];

        data[i]   = mix(r, lutPix[0], strength);
        data[i+1] = mix(g, lutPix[1], strength);
        data[i+2] = mix(b, lutPix[2], strength);
    }

    const sharp = document.getElementById("sharpness").value;
    applySharpen(data, previewCanvas.width, previewCanvas.height, sharp);

    ctx.putImageData(imgData, 0, 0);
}

document.getElementById("lutStrength").addEventListener("input", renderPreview);
document.getElementById("sharpness").addEventListener("input", () => {
    document.getElementById("sharpVal").innerText = document.getElementById("sharpness").value + "%";
    renderPreview();
});

document.getElementById("downloadFull").addEventListener("click", async () => {
    const fullCanvas = resizeImage(originalImage, 4096);
    const c = fullCanvas.getContext("2d");

    c.drawImage(originalImage, 0, 0, fullCanvas.width, fullCanvas.height);
    const imgData = c.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
    const data = imgData.data;

    const lut = luts[Object.keys(luts)[0]];
    const strength = document.getElementById("lutStrength").value / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const idx = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const lutPix = lut[idx];

        data[i]   = mix(r, lutPix[0], strength);
        data[i+1] = mix(g, lutPix[1], strength);
        data[i+2] = mix(b, lutPix[2], strength);
    }

    const sharp = document.getElementById("sharpness").value;
    applySharpen(data, fullCanvas.width, fullCanvas.height, sharp);

    c.putImageData(imgData, 0, 0);

    const link = document.createElement("a");
    link.download = "edited.jpg"; 
    link.href = fullCanvas.toDataURL("image/jpeg", 1.0);
    link.click();
});
