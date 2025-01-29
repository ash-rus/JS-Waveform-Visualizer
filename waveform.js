// initializing audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext; // webkitAudioContext required for Safari
const audioContext = new AudioContext();
let currentBuffer = null;

const drawAudio = url => {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer)) // specialized ArrayBuffer for audio data
        .then(audioBuffer => draw(normalizeData(filterData(audioBuffer, 1000))));
};

// downsampling for simplified visual
const filterData  = (audioBuffer, samples) => {
    const rawData = audioBuffer.getChannelData(0);  // only use one data channel
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];

    for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j])
        }
        filteredData.push(sum / blockSize);
    }
    return filteredData;
}


// multiply every value by the inverse of the max value 
const normalizeData = filteredData => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
}

// Canvas graphic display
const draw = normalizedData => {
    const canvas = document.querySelector("canvas");
    const dpr = window.devicePixelRatio || 1;
    const padding = 20;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
    
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.translate(0, canvas.offsetHeight / 2 + padding);    // y = 0 in middle of canvas

    // draw line segments
    const width = canvas.offsetWidth / normalizedData.length;
    for (let i = 0; i < normalizedData.length; i++) {
        const x = width * i;
        let height = normalizedData[i] * canvas.offsetHeight - padding;
        if (height < 0) {
            height = 0;
        } else if (height > canvas.offsetHeight / 2) {
            height = canvas.offsetHeight / 2;
        }
        //drawLineSegment(ctx, x, height, width, (i + 1) % 2)
        drawRectangle(ctx, x, height, width);
    }
};

const drawLineSegment = (ctx, x, y, width, isEven) => {
    ctx.lineWidth = 1;  // line thickness
    ctx.strokeStyle = "#fff";   // line color
    ctx.beginPath();
    y = isEven ? y : -y;
    ctx.moveTo(x, -y);
    ctx.lineTo(x, y);
    ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, 0);
    ctx.stroke();
};

const drawRectangle = (ctx, x, y, width) => {
    const height = Math.abs(y); // Ensure height is positive

    // Draw the rectangle in the bottom half
    const startYBottom = y > 0 ? 0 : -height;
    ctx.fillStyle = "#fff"; // Fill color for the rectangle
    ctx.beginPath();
    ctx.rect(x, startYBottom, width, height); // Draw bottom rectangle
    ctx.fill();

    // Draw the mirrored rectangle in the top half (if the height is positive)
    if (y > 0) {
        const startYTop = -height;
        ctx.beginPath();
        ctx.rect(x, startYTop, width, height); // Draw top mirrored rectangle
        ctx.fill();
    }
};

drawAudio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/3/shoptalk-clip.mp3');