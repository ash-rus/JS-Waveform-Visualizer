import { drawSegment, drawPlayhead } from './waveformRenderer.js';

let audioContext, sourceNode, audioBuffer;
let isPlaying = false;
let playStartTime = 0;
let offset = 0;
let animationFrame;

export function initPlayback(buffer) {
    audioBuffer = buffer;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

export function playFrom(startSec) {
    console.log("[playback.js] playFrom called with startSec:", startSec);
    if (!isFinite(startSec)) {
        console.error("[playback.js] Invalid startSec:", startSec);
        return;
    }
    
    if (isPlaying) stopPlayback();

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
    sourceNode.start(0, startSec);
    isPlaying = true;
    playStartTime = audioContext.currentTime;
    offset = startSec;

    requestPlayheadUpdate();
}

export function stopPlayback() {
    if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
        sourceNode = null;
    }
    isPlaying = false;
    cancelAnimationFrame(animationFrame);
}

function requestPlayheadUpdate() {
    const elapsed = audioContext.currentTime - playStartTime;
    const currentPos = offset + elapsed;

    console.log("[playback.js] requestPlayheadUpdate currentPos:", currentPos);

    const pixelPos = (currentPos * 10) % 3000; // 10 samples/sec
    drawSegment(Math.floor(currentPos * 10) - 1500); // center playhead
    drawPlayhead(pixelPos * (960 / 3000)); // match canvas width

    animationFrame = requestAnimationFrame(requestPlayheadUpdate);
}
