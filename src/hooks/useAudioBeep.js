import { useCallback } from 'react';

/**
 * useAudioBeep hook — provides a simple WebAudio API beep sound.
 * Useful for timer notifications and alerts across multiple apps.
 */
export default function useAudioBeep() {
    const beep = useCallback((frequency = 880, duration = 0.25) => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);

            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration + 0.05);
        } catch (e) {
            console.warn('Audio beep failed:', e);
        }
    }, []);

    return { beep };
}
