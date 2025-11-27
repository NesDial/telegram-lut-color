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
    await generateLUTPreviews(preview);
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

// Генерация коллажа LUT-превью
async function generateLUTPreviews(previewCanvas) {
    statusDiv.textContent = "🎨 Создаем коллаж с LUT...";
    for (let lut of LUTS) {
        const processed = await applyLUT(previewCanvas, lut.path, true); // точное наложение LUT
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
    }
    statusDiv.textContent = "✅ Коллаж готов, выберите LUT.";
}

// Загружаем изображение LUT
function loadImageFile(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // чтобы можно было получить данные пикселей
        img.onload = () => resolve(img);
        img.src = path;
    });
}

// Применяем LUT к Canvas
async function applyLUT(sourceCanvas, lutPath, isPreview=false) {
    const lutImg = await loadImageFile(lutPath);

    const canvas = document.createElement("canvas");
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Простейшее LUT-отображение: берем LUT как 1:1 текстуру, нормализуем
    const lutCanvas = document.createElement("canvas");
    lutCanvas.width = lutImg.width;
    lutCanvas.height = lutImg.height;
    const lutCtx = lutCanvas.getContext("2d");
    lutCtx.drawImage(lutImg, 0, 0);
    const lutData = lutCtx.getImageData(0, 0, lutCanvas.width, lutCanvas.height).data;

    for (let i = 0; i < data.length; i += 4) {
        // получаем r,g,b пиксель, нормируем к LUT
        let r = data[i] / 255;
        let g = data[i+1] / 255;
        let b = data[i+2] / 255;

        // координаты LUT (предположим, LUT квадрат, размер 512x512)
        const lutSize = lutImg.width; // ширина LUT
        let x = Math.floor(r * (lutSize - 1));
        let y = Math.floor(g * (lutSize - 1));
        let idx = ((y * lutSize + x) * 4) | 0;

        data[i]   = lutData[idx];     // R
        data[i+1] = lutData[idx+1];   // G
        data[i+2] = lutData[idx+2];   // B
        // Alpha оставляем без изменений
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

// Финальное применение LUT на исходное фото
async function applyFinalLUT(lutPath, lutName) {
    statusDiv.textContent = "⏳ Применяем выбранный LUT к исходному фото...";
    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImage, 0, 0);

    const processed = await applyLUT(canvas, lutPath, false);

    finalContainer.innerHTML = "";
    const label = document.createElement("div");
    label.textContent = `✅ Применен LUT: ${lutName}`;
    finalContainer.appendChild(label);
    finalContainer.appendChild(processed);

    // Автозагрузка результата
    const link = document.createElement("a");
    link.download = `processed_${lutName}.png`;
    link.href = processed.toDataURL("image/png");
    link.textContent = "⬇ Скачать результат";
    link.style.display = "block";
    link.style.marginTop = "10px";
    finalContainer.appendChild(link);

    statusDiv.textContent = "🎉 LUT применен!";
}
