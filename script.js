const photoInput = document.getElementById('photoInput');
const previewContainer = document.getElementById('previewContainer');
const lutSlider = document.getElementById('lutSlider');
const sharpSlider = document.getElementById('sharpSlider');
const applyBtn = document.getElementById('applyBtn');
const modal = document.getElementById('modal');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Загрузка LUT
const LUTS = [
    { name: 'gold200', file: 'luts/gold200.CUBE' },
    { name: 'moody film', file: 'luts/moody_film.CUBE' },
    { name: 'film fade', file: 'luts/film_fade.CUBE' }
];

let originalImage = null;
let previewImages = [];
let selectedIndex = 0;

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            generatePreviews(img);
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

function generatePreviews(img) {
    previewContainer.innerHTML = '';
    previewImages = [];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 200 / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    LUTS.forEach((lut, index) => {
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(canvas, 0, 0);

        // ЗДЕСЬ placeholder: применяем LUT к previewCanvas
        // Для настоящего проекта нужно подключить библиотеку обработки .CUBE
        previewCtx.globalAlpha = lutSlider.value / 100; // сила LUT для превью
        previewCtx.fillStyle = 'rgba(255,255,255,0)'; // placeholder
        previewCtx.fillRect(0,0,previewCanvas.width, previewCanvas.height);

        previewCanvas.dataset.index = index;
        previewCanvas.addEventListener('click', () => {
            selectedIndex = index;
        });

        previewContainer.appendChild(previewCanvas);
        previewImages.push(previewCanvas);
    });
}

applyBtn.addEventListener('click', () => {
    if (!originalImage) return;

    modal.classList.remove('hidden');

    saveBtn.onclick = () => {
        applyLUTAndDownload();
        modal.classList.add('hidden');
    };

    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
    };
});

function applyLUTAndDownload() {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(originalImage.width, 4096);
    canvas.height = Math.min(originalImage.height, 4096 * originalImage.height/originalImage.width);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // placeholder: применяем выбранный LUT
    // placeholder: применяем резкость
    ctx.globalAlpha = lutSlider.value / 100;

    canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `processed_${LUTS[selectedIndex].name}.jpg`;
        link.click();
    }, 'image/jpeg', 1.0);
}
