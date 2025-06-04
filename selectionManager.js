let isDragging = false;
let selectionStart = null;
let selectionEnd = null;

export function initSelection(audioBuffer) {
    const canvas = document.querySelector('canvas');

    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        selectionStart = e.offsetX;
        selectionEnd = null;
    });

    canvas.addEventListener('mousemove', e => {
        if (isDragging) {
            selectionEnd = e.offsetX;
            drawSelection();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        if (selectionStart !== null && selectionEnd !== null) {
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            console.log("Selected range:", start, "to", end);
        }
    });
}

function drawSelection() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "rgba(255,255,0,0.2)";
    const x = Math.min(selectionStart, selectionEnd);
    const width = Math.abs(selectionEnd - selectionStart);
    ctx.fillRect(x, 0, width, canvas.height / dpr);
    ctx.restore();
}
