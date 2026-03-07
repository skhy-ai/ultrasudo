import React, { useState, useEffect, useRef } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import useLocalStore from '../../../hooks/useLocalStore';
import './BirthdayCard.css';

const TEMPLATES = {
    'gradient-sunset':  { start: '#f093fb', end: '#f5576c' },
    'gradient-ocean':   { start: '#4facfe', end: '#00f2fe' },
    'gradient-forest':  { start: '#43e97b', end: '#38f9d7' },
    'gradient-galaxy':  { start: '#a18cd1', end: '#fbc2eb' },
    'gradient-fire':    { start: '#f7971e', end: '#ffd200' },
    'gradient-night':   { start: '#0f172a', end: '#1e3a5f' }
};

const DEFAULT_DOC = {
    recipient: 'Friend',
    message: 'Wishing you a wonderful birthday!',
    sender: '',
    font: 'Outfit',
    template: 'gradient-sunset',
    decorations: {
        balloons: true,
        confetti: true,
        cake: false,
        stars: false
    }
};

export default function BirthdayCard() {
    const [doc, setDoc] = useLocalStore('birthday_card_data', DEFAULT_DOC);
    const canvasRef = useRef(null);

    const drawCard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        const tmpl = TEMPLATES[doc.template] || TEMPLATES['gradient-sunset'];
        const isNight = doc.template === 'gradient-night';
        const textColor = isNight ? '#f8fafc' : '#ffffff';

        // Background
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, tmpl.start);
        grad.addColorStop(1, tmpl.end);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        drawRoundRect(ctx, 12, 12, w - 24, h - 24, 16);
        ctx.stroke();

        // DECORATIONS
        if (doc.decorations.confetti) drawConfetti(ctx, w, h);
        if (doc.decorations.balloons) drawBalloons(ctx, w, h);
        if (doc.decorations.stars) drawStars(ctx, w, h);
        if (doc.decorations.cake) drawCake(ctx, w, h);

        // Header
        ctx.font = `bold 38px ${doc.font}, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fillText('🎉 Happy Birthday! 🎉', w / 2, 80);

        // Name
        ctx.font = `bold 46px ${doc.font}, sans-serif`;
        ctx.fillText(doc.recipient, w / 2, 150);

        // Message
        ctx.font = `20px ${doc.font}, sans-serif`;
        ctx.shadowBlur = 4;
        const lines = wrapText(doc.message, 50);
        let y = 200;
        lines.forEach(line => {
            ctx.fillText(line, w / 2, y);
            y += 30;
        });

        // Sender
        if (doc.sender) {
            ctx.font = `italic 18px ${doc.font}, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(`— ${doc.sender}`, w / 2, h - 40);
        }

        ctx.shadowBlur = 0;
    };

    useEffect(() => {
        drawCard();
    }, [doc]);

    const downloadCard = () => {
        const link = document.createElement('a');
        link.download = `birthday-card-${doc.recipient}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    return (
        <AppShell title="Birthday Card Generator" icon="fas fa-gift">
            <div className="birthday-app">
                <main className="birthday-main">
                    <div className="canvas-container">
                        <canvas ref={canvasRef} width="600" height="400" id="card-canvas"></canvas>
                        <button className="btn btn-download" onClick={downloadCard}>
                            <i className="fas fa-download"></i> Download PNG
                        </button>
                    </div>
                </main>

                <aside className="birthday-sidebar">
                    <section className="config-section">
                        <h3>Personalize</h3>
                        <div className="input-field">
                            <label>To:</label>
                            <input 
                                type="text" 
                                value={doc.recipient} 
                                onChange={(e) => setDoc({ ...doc, recipient: e.target.value })} 
                            />
                        </div>
                        <div className="input-field">
                            <label>Message:</label>
                            <textarea 
                                value={doc.message} 
                                onChange={(e) => setDoc({ ...doc, message: e.target.value })} 
                            />
                        </div>
                        <div className="input-field">
                            <label>From:</label>
                            <input 
                                type="text" 
                                value={doc.sender} 
                                onChange={(e) => setDoc({ ...doc, sender: e.target.value })} 
                            />
                        </div>
                    </section>

                    <section className="config-section">
                        <h3>Theme</h3>
                        <div className="template-grid">
                            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                <div 
                                    key={key} 
                                    className={`template-swatch ${doc.template === key ? 'selected' : ''}`}
                                    style={{ background: `linear-gradient(135deg, ${tmpl.start}, ${tmpl.end})` }}
                                    onClick={() => setDoc({ ...doc, template: key })}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="config-section">
                        <h3>Decorations</h3>
                        <div className="decorations-grid">
                            {Object.keys(doc.decorations).map((deco) => (
                                <label key={deco} className="deco-item">
                                    <input 
                                        type="checkbox" 
                                        checked={doc.decorations[deco]} 
                                        onChange={(e) => setDoc({ 
                                            ...doc, 
                                            decorations: { ...doc.decorations, [deco]: e.target.checked } 
                                        })} 
                                    />
                                    {deco.charAt(0).toUpperCase() + deco.slice(1)}
                                </label>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </AppShell>
    );
}

// Canvas Helpers (ported from legacy)
function drawRoundRect(ctx, x, y, w, h, r) {
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

function drawConfetti(ctx, w, h) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6392'];
    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = colors[i % colors.length];
        const x = Math.random() * w;
        const y = Math.random() * (h * 0.85);
        const size = 3 + Math.random() * 6;
        ctx.globalAlpha = 0.5 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawBalloons(ctx, w, h) {
    const colors = ['#ff6b6b', '#4facfe', '#ffd93d', '#6bcb77', '#cc5de8'];
    const positions = [{ x: 60, y: 300 }, { x: 130, y: 280 }, { x: w - 60, y: 310 }, { x: w - 130, y: 270 }];
    positions.forEach((pos, i) => {
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.ellipse(pos.x, pos.y, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y + 28); ctx.lineTo(pos.x + (Math.random() - 0.5) * 10, pos.y + 60); ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

function drawStars(ctx, w, h) {
    ctx.fillStyle = '#ffd93d';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * w; const y = Math.random() * (h * 0.6);
        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
        const cx = x, cy = y, r = 3 + Math.random() * 5;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
            const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const sx = cx + r * Math.cos(angle); const sy = cy + r * Math.sin(angle);
            j === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCake(ctx, w, h) {
    const cx = w / 2, cy = h - 100;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#8B4513'; drawRoundRect(ctx, cx - 40, cy - 20, 80, 40, 6); ctx.fill();
    ctx.fillStyle = '#FFB6C1'; drawRoundRect(ctx, cx - 42, cy - 25, 84, 12, 4); ctx.fill();
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.ellipse(cx, cy - 50, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
}

function wrapText(text, maxChars) {
    const words = text.split(' '); const lines = []; let line = '';
    words.forEach(word => {
        if ((line + ' ' + word).trim().length > maxChars) { lines.push(line.trim()); line = word; }
        else { line += ' ' + word; }
    });
    if (line.trim()) lines.push(line.trim());
    return lines;
}
