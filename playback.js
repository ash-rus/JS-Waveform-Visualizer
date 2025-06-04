import { drawSegment } from './waveformRenderer.js';

let audioContext, sourceNode, audioBuffer;
let isPlaying = false;
let playStartTime = 0;
let offset = 0;

let playheadPosition = 0;

export function initPlayback(buffer) {
    audioBuffer = buffer;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

export function playFrom(startSec) {
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

export function setPlayheadPosition(seconds) {
    playheadPosition = seconds;
}

export function getPlayheadPosition() {
    return playheadPosition;
}

let animationFrame;

let playheadUpdateCallback = null;

export function onPlayheadUpdate(callback) {
    playheadUpdateCallback = callback;
}

function requestPlayheadUpdate() {
    if (!isPlaying) return;

    const elapsed = audioContext.currentTime - playStartTime;
    const currentPos = offset + elapsed; // in seconds

    // Convert to sample index for 10 samples/sec
    const playheadSample = Math.floor(currentPos * 10);

    // Call UI callback if set
    if (playheadUpdateCallback) {
        playheadUpdateCallback(playheadSample);
    }

    animationFrame = requestAnimationFrame(requestPlayheadUpdate);
}

export function getIsPlaying() {
    return isPlaying;
}
