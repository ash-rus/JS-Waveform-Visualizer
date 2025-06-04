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

export function drawSegment(pos) {
    const visibleSamples = 3000; // 5 minutes @ 10Hz

    if (!normalizedData || normalizedData.length === 0) {
        console.warn("[drawSegment] normalizedData is empty or not loaded");
        return;
    }

    // Clamp pos to valid range
    if (pos < 0) pos = 0;
    if (pos > normalizedData.length - visibleSamples) {
        pos = normalizedData.length - visibleSamples;
        if (pos < 0) pos = 0;  // handle case where data length < visibleSamples
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

