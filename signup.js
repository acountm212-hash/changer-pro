const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
let img = null;

// Editor State
let layers = [];
let history = []; 
let activeTool = 'move'; 
let eraseColor = '#ffffff';

// Selection, Snapping & Scale State
let isDragging = false;
let isResizing = false;
let selectedLayer = null;
let startX, startY, currentX, currentY;
let activeGuides = [];
let showGrid = false; 
const HANDLE_SIZE = 12; 
const SNAP_DIST = 8;

const clearBtn = document.getElementById('clearBtn');
const uploadInput = document.getElementById('upload');
const floatingToolbar = document.getElementById('floatingToolbar');
const toggleGridBtn = document.getElementById('toggleGridBtn');

// Tools Selection
const tools = ['toolMove', 'toolErase', 'toolMagnify'];
tools.forEach(tool => {
    let btn = document.getElementById(tool);
    if(btn) {
        btn.onclick = (e) => {
            activeTool = tool.replace('tool', '').toLowerCase();
            document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedLayer = null; 
            updateUIState();
            drawEverything();
        };
    }
});

if(toggleGridBtn) {
    toggleGridBtn.onclick = () => {
        showGrid = !showGrid;
        if (showGrid) {
            toggleGridBtn.classList.add('active');
            toggleGridBtn.style.background = 'rgba(56, 189, 248, 0.2)';
        } else {
            toggleGridBtn.classList.remove('active');
            toggleGridBtn.style.background = '';
        }
        drawEverything();
    };
}

function saveState() {
    const clonedLayers = layers.map(layer => ({ ...layer }));
    history.push(clonedLayers);
    if (history.length > 30) history.shift();
}

const undoBtn = document.getElementById('undoBtn');
if(undoBtn) {
    undoBtn.onclick = () => {
        if (history.length > 0) {
            layers = history.pop();
            selectedLayer = null;
            updateUIState();
            drawEverything();
        }
    };
}

uploadInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'application/pdf') return; 

    const reader = new FileReader();
    reader.onload = (event) => {
        img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            layers = []; history = []; selectedLayer = null;
            if(clearBtn) clearBtn.style.display = 'inline-block';
            updateUIState();
            drawEverything();
        }
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

if(clearBtn) {
    clearBtn.onclick = () => {
        if(confirm("Clear all changes?")) {
            img = null; layers = []; history = []; selectedLayer = null;
            uploadInput.value = '';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clearBtn.style.display = 'none';
            updateUIState();
        }
    };
}

// 🔥 ADVANCED MOBILE TOUCH & DESKTOP MOUSE COORDS HANDLER
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Scale X/Y is vital for responsive canvases
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;

    // Bulletproof Touch vs Mouse check
    if (e.type.includes('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
}

function findClickedLayer(mx, my) {
    for (let i = layers.length - 1; i >= 0; i--) {
        let l = layers[i];
        if (l.hidden || l.type === 'patch') continue;
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) return l;
    }
    for (let i = layers.length - 1; i >= 0; i--) {
        let l = layers[i];
        if (l.hidden || l.type !== 'patch') continue;
        if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) return l;
    }
    return null;
}

// 🔥 UNIFIED EVENT LISTENERS (PC + Mobile)
function handlePointerDown(e) {
    if(!img) return;
    
    // Sirf touch events par preventDefault karo taaki click aur focus break na ho
    if(e.type === 'touchstart' && e.cancelable) e.preventDefault();

    const m = getCoords(e);
    
    if (activeTool === 'erase') {
        isDragging = true;
        startX = m.x; startY = m.y; currentX = m.x; currentY = m.y;
        const p = ctx.getImageData(m.x, m.y, 1, 1).data;
        eraseColor = `rgb(${p[0]},${p[1]},${p[2]})`;
        selectedLayer = null;
    } 
    else if (activeTool === 'move') {
        if (selectedLayer && !selectedLayer.locked) {
            let hx = selectedLayer.x + selectedLayer.w;
            let hy = selectedLayer.y + selectedLayer.h;
            if (m.x >= hx - HANDLE_SIZE && m.x <= hx + HANDLE_SIZE && m.y >= hy - HANDLE_SIZE && m.y <= hy + HANDLE_SIZE) {
                isResizing = true; saveState(); return;
            }
        }

        let clicked = findClickedLayer(m.x, m.y);
        if (clicked) {
            if(selectedLayer !== clicked) saveState();
            selectedLayer = clicked;
            if(!selectedLayer.locked) isDragging = true;
            
            selectedLayer.offsetX = m.x - selectedLayer.x;
            selectedLayer.offsetY = m.y - selectedLayer.y;
        } else {
            selectedLayer = null;
            let drawer = document.getElementById('ftDrawer');
            if(drawer) drawer.classList.remove('open');
        }
    }
    updateUIState();
    drawEverything();
}

function handlePointerMove(e) {
    if(!img) return;
    if(e.type === 'touchmove' && (isDragging || isResizing || activeTool==='magnify')) {
        if(e.cancelable) e.preventDefault(); 
    }

    const m = getCoords(e);

    if (activeTool === 'magnify') {
        drawEverything();
        ctx.save(); ctx.beginPath(); ctx.arc(m.x, m.y, 80, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = '#3d8bff'; ctx.stroke(); ctx.clip();
        ctx.drawImage(canvas, m.x - 40, m.y - 40, 80, 80, m.x - 80, m.y - 80, 160, 160);
        ctx.restore();
    }
    else if (isDragging && activeTool === 'erase') {
        currentX = m.x; currentY = m.y;
        drawEverything();
        ctx.fillStyle = eraseColor;
        ctx.fillRect(startX, startY, currentX - startX, currentY - startY);
    } 
    else if (isResizing && selectedLayer) {
        selectedLayer.w = Math.max(30, m.x - selectedLayer.x);
        if(selectedLayer.type !== 'text') {
            selectedLayer.h = Math.max(30, m.y - selectedLayer.y);
        }
        drawEverything();
        updateToolbarPosition();
    }
    else if (isDragging && selectedLayer && !selectedLayer.locked) {
        let rawX = m.x - selectedLayer.offsetX;
        let rawY = m.y - selectedLayer.offsetY;
        
        let snapped = calculateSnapping(rawX, rawY, selectedLayer);
        selectedLayer.x = snapped.x;
        selectedLayer.y = snapped.y;
        
        drawEverything();
        updateToolbarPosition();
    }
}

function handlePointerUp(e) {
    if (isDragging && activeTool === 'erase') {
        saveState();
        layers.push({
            type: 'patch', x: startX, y: startY,
            w: currentX - startX, h: currentY - startY,
            color: eraseColor, locked: false, hidden: false
        });
    }
    isDragging = false; isResizing = false;
    activeGuides = []; 
    drawEverything();
    updateToolbarPosition();
}

// Mouse Listeners
canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('mouseleave', handlePointerUp);

// Touch Listeners (Mobile support)
canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
canvas.addEventListener('touchmove', handlePointerMove, {passive: false});
canvas.addEventListener('touchend', handlePointerUp);

function calculateSnapping(mX, mY, layer) {
    activeGuides = [];
    let nx = mX; let ny = mY;
    let lCx = mX + layer.w / 2; 
    let lCy = mY + layer.h / 2; 
    let snapCBtn = document.getElementById('snapCenter');
    let snapOBtn = document.getElementById('snapObjects');
    
    let snapC = snapCBtn ? snapCBtn.checked : false;
    let snapO = snapOBtn ? snapOBtn.checked : false;
    
    let snappedX = false, snappedY = false;

    if (snapC) {
        let cCx = canvas.width / 2; let cCy = canvas.height / 2;
        if (Math.abs(lCx - cCx) < SNAP_DIST) { nx = cCx - layer.w/2; activeGuides.push({axis: 'x', pos: cCx}); snappedX = true; }
        if (Math.abs(lCy - cCy) < SNAP_DIST) { ny = cCy - layer.h/2; activeGuides.push({axis: 'y', pos: cCy}); snappedY = true; }
    }

    if (snapO) {
        layers.forEach(t => {
            if (t === layer || t.hidden || t.type === 'patch') return;
            let tCx = t.x + t.w / 2; let tCy = t.y + t.h / 2;
            if (!snappedX) {
                if (Math.abs(lCx - tCx) < SNAP_DIST) { nx = tCx - layer.w/2; activeGuides.push({axis: 'x', pos: tCx}); snappedX = true; }
                else if (Math.abs(mX - t.x) < SNAP_DIST) { nx = t.x; activeGuides.push({axis: 'x', pos: t.x}); snappedX = true; }
            }
            if (!snappedY) {
                if (Math.abs(lCy - tCy) < SNAP_DIST) { ny = tCy - layer.h/2; activeGuides.push({axis: 'y', pos: tCy}); snappedY = true; }
                else if (Math.abs(mY - t.y) < SNAP_DIST) { ny = t.y; activeGuides.push({axis: 'y', pos: t.y}); snappedY = true; }
            }
        });
    }
    return {x: nx, y: ny};
}

function updateUIState() {
    let txtIn = document.getElementById('textInput');
    let fSize = document.getElementById('fontSize');
    let fFam = document.getElementById('fontFamily');
    let fWght = document.getElementById('fontWeight');
    let addBtn = document.getElementById('addTextBtn');
    let upBtn = document.getElementById('updateTextBtn');

    if (selectedLayer && selectedLayer.type === 'text') {
        if(txtIn) txtIn.value = selectedLayer.content;
        if(fSize) fSize.value = selectedLayer.size;
        if(fFam) fFam.value = selectedLayer.font;
        if(fWght) fWght.value = selectedLayer.weight;
        if(addBtn) addBtn.style.display = 'none';
        if(upBtn) upBtn.style.display = 'inline-block';
    } else {
        if(addBtn) addBtn.style.display = 'inline-block';
        if(upBtn) upBtn.style.display = 'none';
    }
    updateToolbarPosition();
}

function updateToolbarPosition() {
    if(!floatingToolbar) return;
    if (selectedLayer && activeTool === 'move') {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / canvas.width;
        const scaleY = rect.height / canvas.height;
        
        let screenX = rect.left + (selectedLayer.x + (selectedLayer.w / 2)) * scaleX;
        let screenY = rect.top + (selectedLayer.y * scaleY);

        floatingToolbar.style.left = `${screenX}px`;
        floatingToolbar.style.top = `${screenY - 15}px`; 
        floatingToolbar.style.display = 'flex';
        
        let lockBtn = document.getElementById('ftLock');
        let hideBtn = document.getElementById('ftHide');
        if(lockBtn) lockBtn.innerHTML = selectedLayer.locked ? '🔒' : '🔓';
        if(hideBtn) hideBtn.innerHTML = selectedLayer.hidden ? '👁️‍🗨️' : '👁️';
    } else {
        floatingToolbar.style.display = 'none';
    }
}

const ftLock = document.getElementById('ftLock');
if(ftLock) ftLock.onclick = () => { saveState(); selectedLayer.locked = !selectedLayer.locked; updateToolbarPosition(); drawEverything(); };

const ftHide = document.getElementById('ftHide');
if(ftHide) ftHide.onclick = () => { saveState(); selectedLayer.hidden = !selectedLayer.hidden; selectedLayer = null; updateUIState(); drawEverything(); };

const ftDel = document.getElementById('ftDelete');
if(ftDel) ftDel.onclick = () => { saveState(); layers = layers.filter(l => l !== selectedLayer); selectedLayer = null; updateUIState(); drawEverything(); };

const ftCopy = document.getElementById('ftCopy');
if(ftCopy) ftCopy.onclick = () => { 
    saveState(); 
    let clone = {...selectedLayer, x: selectedLayer.x + 20, y: selectedLayer.y + 20, locked: false};
    layers.push(clone); selectedLayer = clone; updateUIState(); drawEverything();
};

const ftExp = document.getElementById('ftExpand');
if(ftExp) ftExp.onclick = () => { document.getElementById('ftDrawer').classList.toggle('open'); };

const ftFront = document.getElementById('ftFront');
if(ftFront) ftFront.onclick = () => { saveState(); layers = layers.filter(l => l !== selectedLayer); layers.push(selectedLayer); drawEverything(); };

const ftBack = document.getElementById('ftBack');
if(ftBack) ftBack.onclick = () => { saveState(); layers = layers.filter(l => l !== selectedLayer); layers.unshift(selectedLayer); drawEverything(); };

window.addEventListener('resize', updateToolbarPosition);
const cContainer = document.querySelector('.canvas-container');
if(cContainer) cContainer.addEventListener('scroll', updateToolbarPosition);

const addTextBtn = document.getElementById('addTextBtn');
if(addTextBtn) {
    addTextBtn.onclick = () => {
        const text = document.getElementById('textInput').value;
        if (!text || !img) return;
        saveState();
        const size = parseInt(document.getElementById('fontSize').value);
        const weight = document.getElementById('fontWeight').value;
        const font = document.getElementById('fontFamily').value;
        
        ctx.font = `${weight} ${size}px "${font}"`;
        const m = ctx.measureText(text.split('\n')[0]);
        const initialWidth = m.width > 350 ? 350 : Math.max(m.width + 10, 50);

        layers.push({
            type: 'text', content: text,
            size: size, font: font, weight: weight,
            x: canvas.width/2 - initialWidth/2, y: canvas.height/2 - size/2, 
            w: initialWidth, h: size * 1.2, locked: false, hidden: false
        });
        
        document.getElementById('textInput').value = ''; 
        drawEverything();
    };
}

function liveUpdateText() {
    if (selectedLayer && selectedLayer.type === 'text') {
        selectedLayer.content = document.getElementById('textInput').value;
        selectedLayer.size = parseInt(document.getElementById('fontSize').value);
        selectedLayer.font = document.getElementById('fontFamily').value;
        selectedLayer.weight = document.getElementById('fontWeight').value;
        drawEverything();
        updateToolbarPosition();
    }
}

['fontFamily', 'fontWeight', 'fontSize', 'textInput'].forEach(id => {
    let el = document.getElementById(id);
    if(el) {
        if(el.tagName === 'SELECT') el.onchange = liveUpdateText;
        else el.oninput = liveUpdateText;
    }
});

const updateTextBtn = document.getElementById('updateTextBtn');
if(updateTextBtn) updateTextBtn.onclick = () => { saveState(); liveUpdateText(); };

const uploadSticker = document.getElementById('uploadSticker');
if(uploadSticker) {
    uploadSticker.onchange = (e) => {
        if(!img || !e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const sImg = new Image();
            sImg.onload = () => {
                saveState();
                layers.push({
                    type: 'symbol', img: sImg,
                    x: canvas.width/2 - 50, y: canvas.height/2 - 50,
                    w: 100, h: (100/sImg.width)*sImg.height,
                    locked: false, hidden: false
                });
                drawEverything();
            };
            sImg.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };
}

function drawLayer(l) {
    if(l.hidden) return;
    if (l.type === 'patch') {
        ctx.fillStyle = l.color;
        ctx.fillRect(l.x, l.y, l.w, l.h);
    } 
    else if (l.type === 'text') {
        ctx.font = `${l.weight} ${l.size}px "${l.font}"`;
        ctx.fillStyle = "black";
        ctx.textBaseline = "top"; 

        const lines = l.content.split('\n'); 
        let currentY = l.y + (l.size * 0.1);
        const lineHeight = l.size * 1.25; 
        let finalHeight = 0;

        for (let i = 0; i < lines.length; i++) {
            let words = lines[i].split(' ');
            let line = '';
            
            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                
                if (testWidth > l.w && n > 0) {
                    ctx.fillText(line, l.x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                    finalHeight += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, l.x, currentY);
            currentY += lineHeight;
            finalHeight += lineHeight;
        }
        l.h = finalHeight;
    } 
    else if (l.type === 'symbol') {
        ctx.drawImage(l.img, l.x, l.y, l.w, l.h);
    }
}

function drawSelectionBox(l) {
    if (!l || l.hidden || activeTool !== 'move') return;
    ctx.strokeStyle = l.locked ? '#ff4d4d' : '#3d8bff'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(l.x, l.y, l.w, l.h);
    
    if(!l.locked) {
        ctx.fillStyle = '#3d8bff';
        ctx.fillRect(l.x+l.w-6, l.y+l.h-6, 12, 12);
    }
}

function drawGridAndRulers() {
    if (!showGrid) return;
    ctx.save();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, 0, canvas.width, 20); 
    ctx.fillRect(0, 0, 20, canvas.height); 

    ctx.fillStyle = '#38bdf8'; 
    ctx.font = '10px Inter';
    ctx.textBaseline = 'top';
    for (let x = 50; x <= canvas.width; x += 50) {
        ctx.fillRect(x, 0, 1, 6);
        ctx.fillText(x, x + 3, 2);
    }
    for (let y = 50; y <= canvas.height; y += 50) {
        ctx.fillRect(0, y, 6, 1);
        ctx.fillText(y, 2, y + 3);
    }
    ctx.restore();
}

function drawEverything() {
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(img, 0, 0);
    
    layers.filter(l => l.type === 'patch').forEach(drawLayer);
    layers.filter(l => l.type !== 'patch').forEach(drawLayer);
    drawSelectionBox(selectedLayer);

    if (activeGuides.length > 0 && isDragging) {
        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); 
        activeGuides.forEach(g => {
            ctx.beginPath();
            if (g.axis === 'x') { ctx.moveTo(g.pos, 0); ctx.lineTo(g.pos, canvas.height); } 
            else { ctx.moveTo(0, g.pos); ctx.lineTo(canvas.width, g.pos); }
            ctx.stroke();
        });
        ctx.setLineDash([]); 
    }

    drawGridAndRulers();

    if (showGrid && isDragging && selectedLayer && activeTool === 'move') {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        let lCx = selectedLayer.x;
        let lCy = selectedLayer.y;
        
        ctx.beginPath(); ctx.moveTo(lCx, lCy); ctx.lineTo(lCx, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lCx, lCy); ctx.lineTo(0, lCy); ctx.stroke();
        
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(lCx + 5, lCy - 22, 65, 18);
        ctx.fillStyle = 'black';
        ctx.font = '10px Inter';
        ctx.fillText(`X:${Math.round(lCx)} Y:${Math.round(lCy)}`, lCx + 8, lCy - 18);
        ctx.restore();
    }
}

const downloadBtn = document.getElementById('downloadBtn');
if(downloadBtn) {
    downloadBtn.onclick = () => {
        selectedLayer = null; 
        let tempGridState = showGrid; 
        showGrid = false; 
        updateUIState(); 
        drawEverything();
        
        const link = document.createElement('a');
        link.download = 'ChangerPro_V10.png';
        link.href = canvas.toDataURL();
        link.click();
        
        showGrid = tempGridState; 
        drawEverything();
    };
}