// script.js

const fileInput = document.getElementById("upload");
const carouselContainer = document.getElementById("carousel");
const intensitySlider = document.getElementById("lutIntensity");
const sharpnessSlider = document.getElementById("sharpnessIntensity");
const applyButton = document.getElementById("applyLUT");
const downloadButton = document.getElementById("downloadResult");

let originalImage = null;
let previewCanvas = document.createElement("canvas");
let previewCtx = previewCanvas.getContext("2d");

let processedImage = null; // итог для скачивания

// Превью-версии LUT
let previewLUTs = [
  { name: "Gold 200", file: "luts/gold_200.CUBE" },
  { name: "Moody Film", file: "luts/moody_film.CUBE" },
  { name: "Film Fade", file: "luts/film_fade.CUBE" }
];

let currentIndex = 0;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      createPreviews();
      showCurrentPreview();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

// Создание уменьшенных превью с LUT
function createPreviews() {
  carouselContainer.innerHTML = "";
  previewLUTs.forEach((lut, idx) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = 200 / Math.max(originalImage.width, originalImage.height);
    canvas.width = originalImage.width * scale;
    canvas.height = originalImage.height * scale;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Накладываем LUT (только как превью, быстрое наложение)
    applyLUTCanvas(ctx, canvas.width, canvas.height, lut.file, intensitySlider.value);

    canvas.classList.add("carousel-item");
    if (idx !== currentIndex) canvas.style.display = "none";
    carouselContainer.appendChild(canvas);
  });
}

// Показ текущего превью
function showCurrentPreview() {
  const items = document.querySelectorAll(".carousel-item");
  items.forEach((c, i) => (c.style.display = i === currentIndex ? "block" : "none"));
}

// Перелистывание карусели
document.getElementById("prev").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + previewLUTs.length) % previewLUTs.length;
  showCurrentPreview();
});

document.getElementById("next").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % previewLUTs.length;
  showCurrentPreview();
});

// Обновление превью при изменении ползунков
[intensitySlider, sharpnessSlider].forEach(slider => {
  slider.addEventListener("input", () => {
    createPreviews();
    showCurrentPreview();
  });
});

// Применение LUT и резкости на исходное изображение
applyButton.addEventListener("click", () => {
  if (!originalImage) return;
  const canvas = document.createElement("canvas");
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(originalImage, 0, 0);

  const lutFile = previewLUTs[currentIndex].file;
  applyLUTCanvas(ctx, canvas.width, canvas.height, lutFile, intensitySlider.value);
  applySharpnessCanvas(ctx, canvas.width, canvas.height, sharpnessSlider.value);

  processedImage = canvas;
  alert("✅ LUT и резкость применены. Теперь можно скачать!");
});

// Скачивание результата
downloadButton.addEventListener("click", () => {
  if (!processedImage) return alert("Сначала примените LUT!");
  const link = document.createElement("a");
  link.href = processedImage.toDataURL("image/jpeg", 1.0);
  link.download = "processed.jpg";
  link.click();
});

// --- Функции обработки ---
function applyLUTCanvas(ctx, width, height, lutFile, intensity = 1.0) {
  // Здесь должна быть функция чтения .CUBE и применения на Canvas
  // Пока для демонстрации – простое цветовое наложение
  const imgData = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = imgData.data[i] * intensity;     // R
    imgData.data[i + 1] = imgData.data[i + 1] * intensity; // G
    imgData.data[i + 2] = imgData.data[i + 2] * intensity; // B
  }
  ctx.putImageData(imgData, 0, 0);
}

function applySharpnessCanvas(ctx, width, height, intensity = 1.0) {
  // Простая резкость через kernel
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const w = width;
  const h = height;
  const copy = new Uint8ClampedArray(data);

  const kernel = [
    [0, -0.25 * intensity, 0],
    [-0.25 * intensity, 1 + intensity, -0.25 * intensity],
    [0, -0.25 * intensity, 0]
  ];

  function getIndex(x, y, c) {
    return 4 * (y * w + x) + c;
  }

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let val = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            val += copy[getIndex(x + kx, y + ky, c)] * kernel[ky + 1][kx + 1];
          }
        }
        data[getIndex(x, y, c)] = Math.min(255, Math.max(0, val));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
