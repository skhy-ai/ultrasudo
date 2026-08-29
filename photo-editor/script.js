document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('photo-canvas');
    const ctx = canvas.getContext('2d');

    const fileInput = document.getElementById('file-input');
    const emptyState = document.getElementById('empty-state');

    // Controls
    const sliders = {
        brightness: document.getElementById('brightness'),
        contrast: document.getElementById('contrast'),
        saturate: document.getElementById('saturate'),
        blur: document.getElementById('blur'),
        hue: document.getElementById('hue'),
        grayscale: document.getElementById('grayscale')
    };

    const valDisplays = {
        brightness: document.getElementById('val-brightness'),
        contrast: document.getElementById('val-contrast'),
        saturate: document.getElementById('val-saturate'),
        blur: document.getElementById('val-blur'),
        hue: document.getElementById('val-hue'),
        grayscale: document.getElementById('val-grayscale')
    };

    let originalImage = null;
    let rotateDeg = 0;
    let flipH = 1;
    let flipV = 1;

    // Presets definitions
    const presets = {
        normal: { brightness: 100, contrast: 100, saturate: 100, blur: 0, hue: 0, grayscale: 0 },
        vintage: { brightness: 110, contrast: 90, saturate: 70, blur: 0, hue: 30, grayscale: 20 },
        noir: { brightness: 105, contrast: 130, saturate: 0, blur: 0, hue: 0, grayscale: 100 },
        cyber: { brightness: 115, contrast: 120, saturate: 150, blur: 0, hue: 190, grayscale: 0 },
        warm: { brightness: 105, contrast: 100, saturate: 120, blur: 0, hue: 15, grayscale: 0 },
        cool: { brightness: 100, contrast: 110, saturate: 110, blur: 0, hue: 180, grayscale: 0 }
    };

    // Upload & Drag Drop
    document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            loadImageFile(e.target.files[0]);
        }
    });

    const viewport = document.querySelector('.canvas-viewport');
    viewport.addEventListener('dragover', (e) => e.preventDefault());
    viewport.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            loadImageFile(e.dataTransfer.files[0]);
        }
    });

    // Sample Image Generator
    document.getElementById('btn-sample').addEventListener('click', () => {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 1200;
        sampleCanvas.height = 800;
        const sCtx = sampleCanvas.getContext('2d');

        // Draw nice abstract gradient pattern
        const grad = sCtx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#7C3AED');
        grad.addColorStop(0.5, '#3B82F6');
        grad.addColorStop(1, '#06B6D4');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 1200, 800);

        sCtx.fillStyle = 'rgba(255,255,255,0.15)';
        sCtx.beginPath(); sCtx.arc(300, 400, 200, 0, Math.PI * 2); sCtx.fill();
        sCtx.beginPath(); sCtx.arc(900, 300, 250, 0, Math.PI * 2); sCtx.fill();

        sCtx.fillStyle = '#FFFFFF';
        sCtx.font = '700 64px Inter, sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText('UltraSudo Media Studio', 600, 420);

        const img = new Image();
        img.onload = () => {
            originalImage = img;
            emptyState.style.display = 'none';
            resetAdjustments();
            render();
        };
        img.src = sampleCanvas.toDataURL();
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const p = presets[btn.dataset.preset];
            if (p) {
                Object.keys(p).forEach(key => {
                    sliders[key].value = p[key];
                });
                render();
            }
        });
    });

    // Slider inputs
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', () => {
            render();
        });
    });

    // Transforms
    document.getElementById('btn-rotate-left').addEventListener('click', () => { rotateDeg = (rotateDeg - 90) % 360; render(); });
    document.getElementById('btn-rotate-right').addEventListener('click', () => { rotateDeg = (rotateDeg + 90) % 360; render(); });
    document.getElementById('btn-flip-h').addEventListener('click', () => { flipH *= -1; render(); });
    document.getElementById('btn-flip-v').addEventListener('click', () => { flipV *= -1; render(); });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        resetAdjustments();
        render();
    });

    // Download
    document.getElementById('btn-download').addEventListener('click', () => {
        if (!originalImage) return;
        const link = document.createElement('a');
        link.download = 'edited-photo-ultrasudo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    function loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                emptyState.style.display = 'none';
                resetAdjustments();
                render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function resetAdjustments() {
        rotateDeg = 0;
        flipH = 1;
        flipV = 1;
        Object.keys(presets.normal).forEach(key => {
            sliders[key].value = presets.normal[key];
        });
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.preset-btn[data-preset="normal"]')?.classList.add('active');
    }

    function render() {
        if (!originalImage) return;

        // Update display text
        valDisplays.brightness.textContent = `${sliders.brightness.value}%`;
        valDisplays.contrast.textContent = `${sliders.contrast.value}%`;
        valDisplays.saturate.textContent = `${sliders.saturate.value}%`;
        valDisplays.blur.textContent = `${sliders.blur.value}px`;
        valDisplays.hue.textContent = `${sliders.hue.value}°`;
        valDisplays.grayscale.textContent = `${sliders.grayscale.value}%`;

        // Canvas dimensions considering rotation
        const isRotated90 = Math.abs(rotateDeg) === 90 || Math.abs(rotateDeg) === 270;
        canvas.width = isRotated90 ? originalImage.height : originalImage.width;
        canvas.height = isRotated90 ? originalImage.width : originalImage.height;

        ctx.save();

        // Apply Filters
        const filterStr = `
            brightness(${sliders.brightness.value}%)
            contrast(${sliders.contrast.value}%)
            saturate(${sliders.saturate.value}%)
            blur(${sliders.blur.value}px)
            hue-rotate(${sliders.hue.value}deg)
            grayscale(${sliders.grayscale.value}%)
        `;
        ctx.filter = filterStr;

        // Translate and Rotate
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotateDeg * Math.PI) / 180);
        ctx.scale(flipH, flipV);

        ctx.drawImage(
            originalImage,
            -originalImage.width / 2,
            -originalImage.height / 2
        );

        ctx.restore();
    }
});
