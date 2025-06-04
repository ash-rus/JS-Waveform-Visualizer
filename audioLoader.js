const audioContext = new (window.AudioContext || window.webkitAudioContext)();

export const loadAudio = async (url) => {
  console.log(`[audioLoader.js] Fetching audio from: ${url}`);

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    console.log("[audioLoader.js] Decoding audio data...");
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("[audioLoader.js] Audio decoded successfully");
    
    return audioBuffer;
  } catch (error) {
    console.error("[audioLoader.js] Error loading audio:", error);
    throw error;
  }
};
