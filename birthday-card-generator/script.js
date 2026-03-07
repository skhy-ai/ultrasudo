/**
 * Birthday Card Generator — Canvas-based card rendering
 * Draws a custom birthday card with gradient backgrounds,
 * text, decorations (balloons, confetti, cake, stars), and exports as PNG.
 */

const TEMPLATES = {
    'gradient-sunset':  { start: '#f093fb', end: '#f5576c' },
    'gradient-ocean':   { start: '#4facfe', end: '#00f2fe' },
    'gradient-forest':  { start: '#43e97b', end: '#38f9d7' },
    'gradient-galaxy':  { start: '#a18cd1', end: '#fbc2eb' },
    'gradient-fire':    { start: '#f7971e', end: '#ffd200' },
    'gradient-night':   { start: '#0f172a', end: '#1e3a5f' }
};

let selectedTemplate = 'gradient-sunset';

document.addEventListener('DOMContentLoaded', () => {
    // Template selection
    document.querySelectorAll('.template-swatch').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.template-swatch').forEach(s => s.classList.remove('selected'));
            el.classList.add('selected');
            selectedTemplate = el.dataset.template;
        });
    });

    document.getElementById('btn-generate').addEventListener('click', generateCard);
    document.getElementById('btn-download').addEventListener('click', downloadCard);
    document.getElementById('btn-copy-img').addEventListener('click', copyCard);

    // Generate initial preview
    generateCard();
});

function generateCard() {
    const canvas = document.getElementById('card-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const name = document.getElementById('recipient-name').value.trim() || 'Friend';
    const message = document.getElementById('card-message').value.trim() || 'Wishing you a wonderful birthday!';
    const sender = document.getElementById('sender-name').value.trim();
    const font = document.getElementById('font-select').value;

    const hasBalloons = document.getElementById('deco-balloons').checked;
    const hasConfetti = document.getElementById('deco-confetti').checked;
    const hasCake = document.getElementById('deco-cake').checked;
    const hasStars = document.getElementById('deco-stars').checked;

    const tmpl = TEMPLATES[selectedTemplate] || TEMPLATES['gradient-sunset'];
    const isNight = selectedTemplate === 'gradient-night';
    const textColor = isNight ? '#f8fafc' : '#ffffff';

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, tmpl.start);
    grad.addColorStop(1, tmpl.end);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    roundRect(ctx, 12, 12, w - 24, h - 24, 16);
    ctx.stroke();

    // Decorations (drawn before text so they're in background)
    if (hasConfetti) drawConfetti(ctx, w, h);
    if (hasBalloons) drawBalloons(ctx, w, h);
    if (hasStars) drawStars(ctx, w, h);
    if (hasCake) drawCake(ctx, w, h);

    // "Happy Birthday" header
    ctx.font = `bold 38px ${font}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillText('🎉 Happy Birthday! 🎉', w / 2, 80);

    // Recipient name
    ctx.font = `bold 46px ${font}`;
    ctx.fillText(name, w / 2, 150);

    // Message (word-wrapped)
    ctx.font = `20px ${font}`;
    ctx.shadowBlur = 4;
    const lines = wrapText(message, 50);
    let y = 200;
    lines.forEach(line => {
        ctx.fillText(line, w / 2, y);
        y += 30;
    });

    // Sender
    if (sender) {
        ctx.font = `italic 18px ${font}`;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`— ${sender}`, w / 2, h - 40);
    }

    ctx.shadowBlur = 0;

    // Show actions
    document.getElementById('preview-actions').style.display = 'flex';
}

function drawConfetti(ctx, w, h) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6392', '#cc5de8'];
    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = colors[i % colors.length];
        const x = Math.random() * w;
        const y = Math.random() * (h * 0.85);
        const size = 3 + Math.random() * 6;
        ctx.globalAlpha = 0.5 + Math.random() * 0.4;
        if (Math.random() > 0.5) {
            ctx.fillRect(x, y, size, size * 0.5);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function drawBalloons(ctx, w, h) {
    const colors = ['#ff6b6b', '#4facfe', '#ffd93d', '#6bcb77', '#cc5de8'];
    const positions = [
        { x: 60, y: 300 }, { x: 130, y: 280 },
        { x: w - 60, y: 310 }, { x: w - 130, y: 270 },
        { x: w / 2, y: 330 }
    ];
    positions.forEach((pos, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        // String
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y + 28);
        ctx.lineTo(pos.x + (Math.random() - 0.5) * 10, pos.y + 60);
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

function drawCake(ctx, w, h) {
    const cx = w / 2;
    const cy = h - 100;

    ctx.globalAlpha = 0.7;
    // Cake body
    ctx.fillStyle = '#8B4513';
    roundRect(ctx, cx - 40, cy - 20, 80, 40, 6);
    ctx.fill();
    // Frosting
    ctx.fillStyle = '#FFB6C1';
    roundRect(ctx, cx - 42, cy - 25, 84, 12, 4);
    ctx.fill();
    // Candle
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(cx - 3, cy - 45, 6, 22);
    // Flame
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 50, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawStars(ctx, w, h) {
    ctx.fillStyle = '#ffd93d';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * w;
        const y = Math.random() * (h * 0.6);
        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
        drawStar(ctx, x, y, 3 + Math.random() * 5);
    }
    ctx.globalAlpha = 1;
}

function drawStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    words.forEach(word => {
        if ((line + ' ' + word).trim().length > maxChars) {
            lines.push(line.trim());
            line = word;
        } else {
            line += ' ' + word;
        }
    });
    if (line.trim()) lines.push(line.trim());
    return lines;
}

function downloadCard() {
    const canvas = document.getElementById('card-canvas');
    const link = document.createElement('a');
    link.download = 'birthday-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function copyCard() {
    const canvas = document.getElementById('card-canvas');
    try {
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        const btn = document.getElementById('btn-copy-img');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard'; }, 2000);
    } catch (e) {
        alert('Copy not supported in this environment.');
    }
}
