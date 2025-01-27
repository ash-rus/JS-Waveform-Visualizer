// initializing audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext; // webkitAudioContext required for Safari
const audioContext = new AudioContext();
let currentBuffer = null;

const visualizeAudio = url => {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer)) // specialized ArrayBuffer for audio data
        .then(audioBuffer => visualize(audioBuffer));
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