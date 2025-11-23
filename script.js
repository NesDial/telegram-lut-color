// script.js — минимальная логика: загрузка -> ресайз -> отрисовка на canvas
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

let originalImage = null; // Image object (полезно для позже)
let originalUint8 = null;  // raw pixel data (если понадобится)

fileInput.addEventListener('change', (e) => {
  processBtn.disabled = !e.target.files || e.target.files.length === 0;
  status.textContent = e.target.files && e.target.files.length ? `${e.target.files.length} файл(ов) готов(ы)` : 'Загрузите изображение';
});

processBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  status.textContent = 'Загружаю и обрабатываю...';
  processBtn.disabled = true;

  try {
    const dataURL = await readFileAsDataURL(file);
    const img = await createImage(dataURL);

    // resize: по длинной стороне 200 px
    const maxSide = 200;
    let { width:w, height:h } = img;
    const scale = maxSide / Math.max(w, h);
    const newW = Math.max(1, Math.round(w * scale));
    const newH = Math.max(1, Math.round(h * scale));

    canvas.width = newW;
    canvas.height = newH;
    ctx.clearRect(0,0,newW,newH);
    ctx.drawImage(img, 0, 0, newW, newH);

    // сохраняем оригинал для дальнейших шагов
    originalImage = img;

    // сохраняем пиксели (Uint8Array) если потребуется
    const imageData = ctx.getImageData(0,0,newW,newH);
    originalUint8 = imageData.data; // потом пригодится для LUT

    status.textContent = `Готово — превью ${newW}×${newH} (по длинной стороне ${maxSide}px)`;
  } catch(err){
    console.error(err);
    status.textContent = 'Ошибка при обработке файла';
  } finally {
    processBtn.disabled = false;
  }
});

// утилиты
function readFileAsDataURL(file){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Ошибка чтения файла'));
    r.readAsDataURL(file);
  });
}

function createImage(dataURL){
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = (e) => rej(new Error('Не удалось загрузить изображение'));
    img.src = dataURL;
  });
}

