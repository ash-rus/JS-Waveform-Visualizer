import { drawSegment } from './waveformRenderer.js';
import { playFrom, stopPlayback, setPlayheadPosition, onPlayheadUpdate, getIsPlaying } from './playback.js';

let isDragging = false;
let dragStartX = null;
let currentDragX = null;
let dragThreshold = 5; // pixels
let didDrag = false;


export function bindUI(audioBuffer) {
    const posInput = document.getElementById('posInput');
    const drawBtn = document.getElementById('drawBtn');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const canvas = document.querySelector('canvas');

    let playheadPosition = 0; // in seconds
    let currentViewportPos = parseInt(posInput.value, 10) || 0;

    let isDragging = false;
    let dragStartX = null;
    let selectionStartSample = null;
    let selectionEndSample = null;

    const visibleSamples = 3000;
    const dpr = window.devicePixelRatio || 1;

    drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), null, null);

    onPlayheadUpdate((playheadSample) => {
        drawSegment(currentViewportPos, playheadSample, selectionStartSample, selectionEndSample);
        playheadPosition = playheadSample / 10;
    });

    drawBtn.addEventListener('click', () => {
        const pos = parseInt(posInput.value, 10);
        if (!isNaN(pos)) {
            currentViewportPos = pos;
            drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), selectionStartSample, selectionEndSample);
        }
    });

    playBtn.addEventListener('click', () => {
        setPlayheadPosition(playheadPosition);
        playFrom(playheadPosition);
    });

    stopBtn.addEventListener('click', () => {
        stopPlayback();
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        const maxPos = 100000;
        const step = 10;
        let pos = parseInt(posInput.value, 10) || 0;

        if (e.key === 'ArrowLeft') {
            const delta = pos - currentViewportPos;

            if (isDragging && selectionStartSample !== null && selectionEndSample !== null) {
                selectionStartSample += delta;
                selectionEndSample += delta;
            }

            pos = Math.max(0, pos - step);
            posInput.value = pos;
            currentViewportPos = pos;
            drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), selectionStartSample, selectionEndSample);
            e.preventDefault();
        } else if (e.key === 'ArrowRight') {
            const delta = pos - currentViewportPos;

            if (isDragging && selectionStartSample !== null && selectionEndSample !== null) {
                selectionStartSample += delta;
                selectionEndSample += delta;
            }

            pos = Math.min(maxPos, pos + step);
            posInput.value = pos;
            currentViewportPos = pos;
            drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), selectionStartSample, selectionEndSample);
            e.preventDefault();
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        didDrag = false;
        const rect = canvas.getBoundingClientRect();
        dragStartX = e.clientX - rect.left;
        currentDragX = dragStartX;
    });

    window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
        const cssWidth = canvas.width / (window.devicePixelRatio || 1);
        const mouseX = e.clientX - rect.left;

        const distance = Math.abs(mouseX - dragStartX);
        if (distance > dragThreshold) didDrag = true;

        currentDragX = Math.max(0, Math.min(mouseX, cssWidth));

        const clampedStartX = Math.max(0, Math.min(dragStartX, cssWidth));
        const relStart = Math.min(clampedStartX, currentDragX) / cssWidth;
        const relEnd = Math.max(clampedStartX, currentDragX) / cssWidth;

        const visibleSamples = 3000;
        selectionStartSample = currentViewportPos + Math.floor(relStart * visibleSamples);
        selectionEndSample = currentViewportPos + Math.floor(relEnd * visibleSamples);

        drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), selectionStartSample, selectionEndSample);
    });



    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        if (!didDrag) {
            // Click without drag: move playhead and jump playback if playing
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = canvas.width / dpr;
            const visibleSamples = 3000;

            const clickedSample = Math.floor((clickX / cssWidth) * visibleSamples);
            const newPlayheadSample = currentViewportPos + clickedSample;

            playheadPosition = newPlayheadSample / 10; // seconds
            setPlayheadPosition(playheadPosition);

            if (getIsPlaying()) {
                playFrom(playheadPosition);
            }
        }

        drawSegment(currentViewportPos, Math.floor(playheadPosition * 10), selectionStartSample, selectionEndSample);
    });
}
