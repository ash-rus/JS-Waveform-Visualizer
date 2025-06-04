import { loadAudio } from './audioLoader.js';
import { initRenderer } from './waveformRenderer.js';
import { initPlayback } from './playback.js';
import { bindUI } from './uiBindings.js';

console.log("[main.js] Script loaded");

window.addEventListener("DOMContentLoaded", async () => {
    console.log("[main.js] DOMContentLoaded");

    try {
        console.log("[main.js] Loading audio...");
        const currentBuffer = await loadAudio('15min.mp3');
        console.log("[main.js] Audio loaded", currentBuffer);

        initRenderer(currentBuffer);
        initPlayback(currentBuffer);

        bindUI(currentBuffer);

    } catch (err) {
        console.error("[main.js] Failed to load audio:", err);
    }
});
