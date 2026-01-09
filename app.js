const drawCanvas = document.getElementById('drawCanvas');
const refCanvas = document.getElementById('refCanvas');
const drawCtx = drawCanvas.getContext('2d');
const refCtx = refCanvas.getContext('2d');
const floatingRef = document.getElementById('floatingRef');
const countInput = document.getElementById('lineCount');
const allowCurvesBtn = document.getElementById('allowCurves')

let targetLines = [];
let isDrawing = false;
let points = [];
let allowTouch = true;
let allowHintLines = true;
let refCrosshairEnabled = false;
let refGridEnabled = false;
let drawCrosshairEnabled = false;
let drawGridEnabled = false;
let allowCurves;  // initializes on loadConfigs()

// --- Persistent Configurations ---
function loadConfigs() {
    // Load Line Count (Default to 3)
    const savedCount = localStorage.getItem('pm-line-count');
    countInput.value = savedCount !== null ? savedCount : 3;

    // Load Curves Preference
    const savedCurves = localStorage.getItem('pm-allow-curves');
    allowCurves = savedCurves === 'true';
    allowCurvesBtn.classList.toggle('disabled', !allowCurves);
}

function saveConfigs() {
    localStorage.setItem('pm-line-count', countInput.value);
    localStorage.setItem('pm-allow-curves', allowCurves);

    allowCurvesBtn.classList.toggle('disabled', !allowCurves);
}

// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('user-theme', target);
    startNewGame();
}

function toggleCurves() {
    allowCurves = !allowCurves;
    saveConfigs()
}

function toggleTouch() {
    allowTouch = !allowTouch;
    document.getElementById('touchToggle').classList.toggle('disabled', !allowTouch);
}

function toggleHintLines() {
    allowHintLines = !allowHintLines;
    document.getElementById('hintLinesToggle').classList.toggle('disabled', !allowHintLines);
}

// --- Crosshair & Grid Toggles ---
function toggleRefCrosshair() {
    refCrosshairEnabled = !refCrosshairEnabled;
    document.getElementById('refCrosshair').classList.toggle('active', refCrosshairEnabled);
    redrawRef();
}

function toggleRefGrid() {
    refGridEnabled = !refGridEnabled;
    document.getElementById('refGrid').classList.toggle('active', refGridEnabled);
    redrawRef();
}

function toggleDrawCrosshair() {
    drawCrosshairEnabled = !drawCrosshairEnabled;
    document.getElementById('drawCrosshair').classList.toggle('active', drawCrosshairEnabled);
    redrawDrawOverlays();
}

function toggleDrawGrid() {
    drawGridEnabled = !drawGridEnabled;
    document.getElementById('drawGrid').classList.toggle('active', drawGridEnabled);
    redrawDrawOverlays();
}

function drawCrosshair(ctx, w, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.restore();
}

function drawGrid(ctx, w, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    const cols = 4, rows = 4;
    for (let i = 1; i < cols; i++) {
        const x = (w / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
        const y = (h / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    ctx.restore();
}

// --- Drawing Logic ---
function syncLayout() {
    const temp = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    const toolbarHeight = 40;
    const drawableHeight = window.innerHeight - toolbarHeight;
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = drawableHeight;
    drawCtx.putImageData(temp, 0, 0);
    refCanvas.width = 140;
    refCanvas.height = 140 * (drawableHeight / window.innerWidth);
}

window.addEventListener('resize', () => {
    syncLayout();
    redrawRef();
    redrawDrawOverlays();
});

function canDraw(e) {
    return e.pointerType === 'pen' || (allowTouch && e.pointerType === 'touch');
}

function getCanvasY(clientY) {
    return clientY - 40;
}

drawCanvas.onpointerdown = (e) => {
    if (!canDraw(e)) return;
    isDrawing = true;
    points = [{x: e.clientX, y: getCanvasY(e.clientY)}];
    drawCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink-color').trim();
    drawCtx.lineWidth = 3;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCanvas.setPointerCapture(e.pointerId);
};

drawCanvas.onpointermove = (e) => {
    if (!isDrawing || !canDraw(e)) return;
    const newPoint = {x: e.clientX, y: getCanvasY(e.clientY)};
    points.push(newPoint);

    if (points.length === 2) {
        // First segment: draw a simple line
        drawCtx.beginPath();
        drawCtx.moveTo(points[0].x, points[0].y);
        drawCtx.lineTo(points[1].x, points[1].y);
        drawCtx.stroke();
    } else if (points.length > 2) {
        // Use quadratic curve through midpoints for smooth lines
        const p0 = points[points.length - 3];
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];

        const mid1 = {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2};
        const mid2 = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};

        drawCtx.beginPath();
        drawCtx.moveTo(mid1.x, mid1.y);
        drawCtx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
        drawCtx.stroke();
    }
};

drawCanvas.onpointerup = () => {
    isDrawing = false;
    points = [];
};

// --- Game Core ---
function renderLine(ctx, p, color, width, dash = []) {
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.moveTo(p.x1, p.y1);
    if (p.type === 'curve') ctx.quadraticCurveTo(p.cx, p.cy, p.x2, p.y2); else ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function redrawRef() {
    refCtx.clearRect(0, 0, refCanvas.width, refCanvas.height);
    const theme = document.documentElement.getAttribute('data-theme');
    const refInk = theme === 'dark' ? '#eeeeee' : '#333333';
    const overlayColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';
    targetLines.forEach(p => renderLine(refCtx, p, refInk, 1.5));
    if (refGridEnabled) drawGrid(refCtx, refCanvas.width, refCanvas.height, overlayColor);
    if (refCrosshairEnabled) drawCrosshair(refCtx, refCanvas.width, refCanvas.height, overlayColor);
}

function redrawDrawOverlays() {
    const overlay = document.getElementById('drawOverlay');
    if (overlay) overlay.remove();
    if (!drawCrosshairEnabled && !drawGridEnabled) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'drawOverlay';
    canvas.style.cssText = 'position:absolute;top:40px;left:0;width:100%;height:calc(100% - 40px);pointer-events:none;z-index:50;';
    canvas.width = drawCanvas.width;
    canvas.height = drawCanvas.height;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme');
    const overlayColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
    if (drawGridEnabled) drawGrid(ctx, canvas.width, canvas.height, overlayColor);
    if (drawCrosshairEnabled) drawCrosshair(ctx, canvas.width, canvas.height, overlayColor);
}

function hintLinesCount() {
    return allowHintLines ? Math.round(countInput.value / 3) : 0
}

function startNewGame() {
    targetLines = [];
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    syncLayout();

    const n = countInput.value;

    for (let i = 0; i < n; i++) {
        const isCurve = allowCurves && Math.random() > 0.5;
        const p = {
            type: isCurve ? 'curve' : 'line',
            x1: Math.random() * (refCanvas.width - 20) + 10,
            y1: Math.random() * (refCanvas.height - 20) + 10,
            x2: Math.random() * (refCanvas.width - 20) + 10,
            y2: Math.random() * (refCanvas.height - 20) + 10,
            cx: Math.random() * refCanvas.width,
            cy: Math.random() * refCanvas.height
        };
        targetLines.push(p);
    }
    redrawRef();
    redrawDrawOverlays();

    allowHintLines && drawMatchLines(0, hintLinesCount());
}

function showMatch() {
    drawMatchLines(hintLinesCount(), targetLines.length);
}

// start,end are the start and end indexes of the target lines to draw.
function drawMatchLines(start, end) {
    const ratio = drawCanvas.width / refCanvas.width;
    targetLines.slice(start, end).forEach((t, idx) => {
        const scaled = {
            type: t.type,
            x1: t.x1 * ratio,
            y1: t.y1 * ratio,
            x2: t.x2 * ratio,
            y2: t.y2 * ratio,
            cx: t.cx * ratio,
            cy: t.cy * ratio
        };
        renderLine(drawCtx, scaled, 'rgba(255, 69, 58, 0.5)', 5, [10, 5]);
    });
}

// Draggable Ref Window (can drag from header or body)
let isDrag = false, offset = {x: 0, y: 0};
floatingRef.onpointerdown = (e) => {
    if (e.target.classList.contains('icon-btn')) return;
    isDrag = true;
    offset.x = e.clientX - floatingRef.offsetLeft;
    offset.y = e.clientY - floatingRef.offsetTop;
    floatingRef.setPointerCapture(e.pointerId);
    e.stopPropagation();
};
floatingRef.onpointermove = (e) => {
    if (isDrag) {
        floatingRef.style.left = (e.clientX - offset.x) + 'px';
        floatingRef.style.top = (e.clientY - offset.y) + 'px';
        floatingRef.style.right = 'auto';
    }
};
floatingRef.onpointerup = () => isDrag = false;

// --- Initialization ---
initTheme();
loadConfigs();
syncLayout();
startNewGame();
document.getElementById('touchToggle').classList.toggle('disabled', !allowTouch);

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => console.log("PWA Active"));
}
