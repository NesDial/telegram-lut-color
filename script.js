const LUTS = [
  {name: "Аниме", path: "luts/lut1.png"},
  {name: "Черный", path: "luts/lut2.png"},
  {name: "Мягкие тени", path: "luts/lut3.png"},
  {name: "Яркий", path: "luts/lut4.png"},
  {name: "Авто", path: "luts/lut5.png"},
];

const MAX_PREVIEW = 200; // px по длинной стороне

const photoInput = document.getElementById("photoInput");
const previewContainer = document.getElementById("previewContainer");
const finalContainer = document.getElementById("finalContainer");
const statusDiv = document.getElementById("status");

let originalImage = null; // для финального применения LUT

photoInput.addEventListener("change", async (e) => {
    if (!e.target.files[0]) return;
    statusDiv.textContent = "📸 Фото в работе, секундочку...";
    previewContainer.innerHTML = "";
    finalContainer.innerHTML = "";
    
    const file = e.target.files[0];
    const img = await loadImage(file);
    originalImage = img;

    const preview = resizeImage(img, MAX_PREVIEW);
    generateLUTPreviews(preview);
});

function loadImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
    });
}

function resizeImage(img, maxSide) {
    const canvas = document.createElement("canvas");
    let scale = maxSide / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function generateLUTPreviews(previewCanvas) {
    statusDiv.textContent = "🎨 Создаем коллаж с LUT...";
    LUTS.forEach(async (lut) => {
        const processed = await applyLUT(previewCanvas, lut.path);
        const container = document.createElement("div");
        container.style.display = "inline-block";
        container.appendChild(processed);
        
        const label = document.createElement("span");
        label.textContent = lut.name;
        label.className = "lut-label";
        container.appendChild(label);

        processed.style.cursor = "pointer";
        processed.onclick = () => applyFinalLUT(lut.path, lut.name);

        previewContainer.appendChild(container);
    });
    statusDiv.textContent = "✅ Коллаж готов, выберите LUT.";
}

// Простое наложение LUT
async function applyLUT(canvas, lutPath) {
    const lutImg = await loadImageFile(lutPath);
    const lutCanvas = document.createElement("canvas");
    lutCanvas.width = canvas.width;
    lutCanvas.height = canvas.height;
    const ctx = lutCanvas.getContext("2d");

    // Простейшее смешивание: 50% исходное + 50% LUT (для превью)
    ctx.drawImage(canvas, 0, 0);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(lutImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    return lutCanvas;
}

function loadImageFile(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = path;
    });
}

// Финальное применение LUT на исходное фото
async function applyFinalLUT(lutPath, lutName) {
    statusDiv.textContent = "⏳ Применяем выбранный LUT к исходному фото...";
    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImage, 0, 0);

    const lutImg = await loadImageFile(lutPath);
    ctx.globalAlpha = 0.5; // плавное наложение LUT
    ctx.drawImage(lutImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    finalContainer.innerHTML = "";
    const label = document.createElement("div");
    label.textContent = `✅ Применен LUT: ${lutName}`;
    finalContainer.appendChild(label);
    finalContainer.appendChild(canvas);

    // Автоматическая загрузка результата
    const link = document.createElement("a");
    link.download = `processed_${lutName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.textContent = "⬇ Скачать результат";
    link.style.display = "block";
    link.style.marginTop = "10px";
    finalContainer.appendChild(link);

    statusDiv.textContent = "🎉 LUT применен!";
}
