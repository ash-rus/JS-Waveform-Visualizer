import { loadAudio } from './audioLoader.js';
import { initRenderer, drawSegment } from './waveformRenderer.js';
import { initPlayback } from './playback.js';
import { bindUI } from './uiBindings.js';

console.log("[main.js] Script loaded");

window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[main.js] Loading audio...");
    const currentBuffer = await loadAudio('15min.mp3');
    console.log("[main.js] Audio loaded", currentBuffer);

    // Initialize waveform renderer with audio data
    initRenderer(currentBuffer);

    // Draw initial waveform segment at pos 0 (or adjust as needed)
    drawSegment(0);

    // Initialize playback with the loaded audio buffer
    initPlayback(currentBuffer);

    // Bind UI controls (play, stop, draw) with audioBuffer context
    bindUI(currentBuffer);

  } catch (err) {
    console.error("[main.js] Failed to load audio:", err);
  }
});
