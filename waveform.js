// initializing audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
let currentBuffer = null;

let normalizedFullData = null;
let samplesPerBlock = null;


let scrollInterval = null;
let scrollDirection = 0;
let scrollSpeed = 10;
let scrollStartTime = null;


// Load entire audio once
const loadAudio = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    samplesPerBlock = Math.floor(sampleRate / 10); // 10 samples/sec

    const totalBlocks = Math.floor(rawData.length / samplesPerBlock);
    const filteredData = [];

    let globalMax = 0;

    for (let i = 0; i < totalBlocks; i++) {
        const blockStart = i * samplesPerBlock;
        let min = Infinity, max = -Infinity;

        for (let j = 0; j < samplesPerBlock; j++) {
            const index = blockStart + j;
            if (index >= rawData.length) break;
            const val = rawData[index];
            if (val < min) min = val;
            if (val > max) max = val;
        }

        filteredData.push({ min, max });
        globalMax = Math.max(globalMax, Math.abs(min), Math.abs(max));
    }

    // Normalize once, globally
    normalizedFullData = filteredData.map(n => ({
        min: n.min / globalMax,
        max: n.max / globalMax
    }));

    return audioBuffer;
};


const drawAudioSegment = (pos) => {
    if (!normalizedFullData || !samplesPerBlock) return;

    const samples = 3000; // 5 minutes at 10 samples/sec
    const start = pos;
    const end = pos + samples;

    const segment = normalizedFullData.slice(start, end);
    draw(segment);
};


// Downsampling
const filterData = (audioBuffer, pos, samples) => {
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerBlock = Math.floor(sampleRate / 10);
    const startSample = pos * samplesPerBlock;
    const endSample = startSample + samples * samplesPerBlock;

    const filteredData = [];

    for (let i = 0; i < samples; i++) {
        const blockStart = startSample + i * samplesPerBlock;
        if (blockStart >= rawData.length) break;

        let min = Infinity, max = -Infinity;
        for (let j = 0; j < samplesPerBlock && (blockStart + j) < rawData.length; j++) {
            const val = rawData[blockStart + j];
            if (val < min) min = val;
            if (val > max) max = val;
        }
        filteredData.push({ min, max });
    }

    return filteredData;
};

const normalizeData = filteredData => {
    const maxVal = Math.max(...filteredData.map(n => Math.max(Math.abs(n.min), Math.abs(n.max))));
    return filteredData.map(n => ({
        min: n.min / maxVal,
        max: n.max / maxVal
    }));
};

const draw = filteredData => {
    const canvas = document.querySelector("canvas");
    const dpr = window.devicePixelRatio || 1;

    // Only compute once
    const cssWidth = parseInt(getComputedStyle(canvas).width, 10);
    const cssHeight = parseInt(getComputedStyle(canvas).height, 10);

    // Set internal canvas size once per draw to match visible size
    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transforms
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.translate(0, cssHeight / 2);

    const width = cssWidth / filteredData.length;
    const heightScale = cssHeight / 2;

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    const minHeight = 1;

    for (let i = 0; i < filteredData.length; i++) {
        const x = width * i;
        let { min, max } = filteredData[i];

        let y1 = -min * heightScale;
        let y2 = -max * heightScale;

        if (Math.abs(y1 - y2) < minHeight) {
            y1 = -minHeight / 2;
            y2 = minHeight / 2;
        }

        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
    }
};

  
// On page load: preload audio, hook button
window.addEventListener("DOMContentLoaded", () => {
    const posInput = document.getElementById("posInput");
    const drawBtn = document.getElementById("drawBtn");

    loadAudio("15min.mp3").then(audioBuffer => {
        currentBuffer = audioBuffer;
        drawAudioSegment(parseInt(posInput.value));
    });

    drawBtn.addEventListener("click", () => {
        const pos = parseInt(posInput.value);
        if (!isNaN(pos)) {
            drawAudioSegment(pos);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            startScrolling(-1);
        } else if (e.key === "ArrowRight") {
            startScrolling(1);
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            stopScrolling();
        }
    });

});

const startScrolling = (direction) => {
    if (scrollInterval) return;

    scrollDirection = direction;
    scrollInterval = setInterval(() => {
        const posInput = document.getElementById("posInput");
        let currentPos = parseInt(posInput.value) || 0;

        const maxPos = normalizedFullData.length - 3000; // prevent reading past end

        // Only scroll if within bounds
        if ((direction === -1 && currentPos <= 0) || (direction === 1 && currentPos >= maxPos)) {
            stopScrolling();
            return;
        }

        currentPos += direction * scrollSpeed;

        // Clamp position
        currentPos = Math.max(0, Math.min(currentPos, maxPos));

        posInput.value = currentPos;
        drawAudioSegment(currentPos);
    }, 1); // smooth update
};

const stopScrolling = () => {
    clearInterval(scrollInterval);
    scrollInterval = null;
};
