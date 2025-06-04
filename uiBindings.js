import { drawSegment } from './waveformRenderer.js';
import { playFrom, stopPlayback } from './playback.js';

export function bindUI(audioBuffer) {
    const posInput = document.getElementById('posInput');
    const drawBtn = document.getElementById('drawBtn');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');

    drawBtn.addEventListener('click', () => {
        const pos = parseInt(posInput.value, 10);
        drawSegment(pos);
    });

    playBtn.addEventListener("click", () => {
        const pos = parseInt(posInput.value, 10);
        if (!isNaN(pos)) {
            const startSec = pos / 10;
            console.log(`[main.js] Play button clicked, startSec: ${startSec}`);
            playFrom(startSec);  // <-- pass only startSec, NOT currentBuffer
        } else {
            console.warn("[main.js] Invalid position value");
        }
    });


    stopBtn.addEventListener('click', () => {
        stopPlayback();
    });

    // Add keyboard support as needed
}
