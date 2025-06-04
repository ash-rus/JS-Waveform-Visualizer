let canvas, ctx, dpr;
let normalizedData = null;
let samplesPerBlock = null;

export function initRenderer(audioBuffer) {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;

    const sampleRate = audioBuffer.sampleRate;
    const rawData = audioBuffer.getChannelData(0);
    samplesPerBlock = Math.floor(sampleRate / 10);
    normalizedData = processAndNormalize(rawData, samplesPerBlock);
}

function processAndNormalize(rawData, samplesPerBlock) {
    // Downsample and normalize
    const totalBlocks = Math.floor(rawData.length / samplesPerBlock);
    const data = [];

    let globalMax = 0;
    for (let i = 0; i < totalBlocks; i++) {
        let min = Infinity, max = -Infinity;
        for (let j = 0; j < samplesPerBlock; j++) {
            const val = rawData[i * samplesPerBlock + j];
            min = Math.min(min, val);
            max = Math.max(max, val);
        }
        globalMax = Math.max(globalMax, Math.abs(min), Math.abs(max));
        data.push({ min, max });
    }

    return data.map(n => ({ min: n.min / globalMax, max: n.max / globalMax }));
}

function drawSelectionOverlay(startSample, endSample, viewportPos, cssWidth, height) {
    if (startSample === null || endSample === null) return;

    const visibleSamples = 3000;
    const viewStart = viewportPos;
    const viewEnd = viewportPos + visibleSamples;

    // Clip selection to visible range
    const clippedStart = Math.max(startSample, viewStart);
    const clippedEnd = Math.min(endSample, viewEnd);

    if (clippedStart >= clippedEnd) return; // nothing to draw

    const x = ((clippedStart - viewportPos) / visibleSamples) * cssWidth;
    const width = ((clippedEnd - clippedStart) / visibleSamples) * cssWidth;

    ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    ctx.fillRect(x, -height / 2, width, height);
}


export function drawSegment(pos, playheadPos = null, selectionStart = null, selectionEnd = null) {
    const visibleSamples = 3000;

    if (!normalizedData || normalizedData.length === 0) {
        console.warn("[drawSegment] normalizedData is empty or not loaded");
        return;
    }

    if (pos < 0) pos = 0;
    if (pos > normalizedData.length - visibleSamples) {
        pos = normalizedData.length - visibleSamples;
        if (pos < 0) pos = 0;
    }

    const segment = normalizedData.slice(pos, pos + visibleSamples);
    resizeCanvasIfNeeded();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(0, canvas.height / (2 * dpr));

    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const width = cssWidth / segment.length;
    const heightScale = cssHeight / 2;

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;

    for (let i = 0; i < segment.length; i++) {
        const { min, max } = segment[i];
        const x = i * width;
        ctx.beginPath();
        ctx.moveTo(x, -min * heightScale);
        ctx.lineTo(x, -max * heightScale);
        ctx.stroke();
    }

    drawSelectionOverlay(selectionStart, selectionEnd, pos, cssWidth, cssHeight);

    if (playheadPos !== null) {
        const playheadX = getPlayheadX(playheadPos, pos, cssWidth);
        if (playheadX !== null) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(playheadX, -heightScale);
            ctx.lineTo(playheadX, heightScale);
            ctx.stroke();
        }
    }

    ctx.restore();
}


function resizeCanvasIfNeeded() {
    const cssWidth = parseInt(getComputedStyle(canvas).width, 10);
    const cssHeight = parseInt(getComputedStyle(canvas).height, 10);
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
    }
}

export function drawPlayhead(xPosition) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xPosition, 0);
    ctx.lineTo(xPosition, canvas.height / dpr);
    ctx.stroke();
    ctx.restore();
}

export function getPlayheadX(playheadPos, displayPos, canvasWidth) {
  // playheadPos and displayPos in samples (pos units)
  // Calculate relative position of playhead inside visible segment
  const relativePos = playheadPos - displayPos; 
  const visibleSamples = 3000; // same constant as drawSegment

  if (relativePos < 0 || relativePos > visibleSamples) return null; // outside visible range

  return (relativePos / visibleSamples) * canvasWidth;
}
