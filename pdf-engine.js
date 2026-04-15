// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let currentPdfDoc = null;
let currentPdfPageNum = 1;
let pdfIsRendering = false;
let pdfPagePending = null;

// 🔥 NAYA: Har page ki editing save karne ke liye dictionary
let pageEdits = {}; 

const uploadInputPdf = document.getElementById('upload'); 
const pdfControls = document.getElementById('pdfControls');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const editorCanvasPdf = document.getElementById('editorCanvas');

// Hidden temporary canvas (Background tasks ke liye)
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

// 1. Intercept file upload
uploadInputPdf.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                currentPdfDoc = pdf;
                currentPdfPageNum = 1;
                pageEdits = {}; // Nayi PDF aane par purani memory clear kardo
                if(pdfControls) pdfControls.style.display = 'flex';
                renderPdfPageToImage(currentPdfPageNum);
            }).catch(error => {
                console.error("Error:", error);
                alert("Cannot load this PDF file.");
            });
        };
        fileReader.readAsArrayBuffer(file);
    } 
    else if (!file.name.includes('changer_pdf_page_')) {
        if(pdfControls) pdfControls.style.display = 'none';
        currentPdfDoc = null;
    }
});

// 🔥 NAYA FUNCTION: Page change karne ya save karne se pehle current page ki image save karna
function saveCurrentPageEdit() {
    if (currentPdfDoc && editorCanvasPdf.width > 0) {
        pageEdits[currentPdfPageNum] = {
            dataUrl: editorCanvasPdf.toDataURL('image/jpeg', 1.0),
            width: editorCanvasPdf.width,
            height: editorCanvasPdf.height
        };
    }
}

function sendBlobToScriptJs(blob, num) {
    const newFile = new File([blob], `changer_pdf_page_${num}.png`, { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(newFile);
    uploadInputPdf.files = dataTransfer.files;
    uploadInputPdf.dispatchEvent(new Event('change', { bubbles: true }));
    if(pageInfo) pageInfo.textContent = `Page ${num} / ${currentPdfDoc.numPages}`;
    
    pdfIsRendering = false;
    if (pdfPagePending !== null) {
        let nextNum = pdfPagePending;
        pdfPagePending = null;
        renderPdfPageToImage(nextNum);
    }
}

// 2. Render Page to Image Function
function renderPdfPageToImage(num) {
    pdfIsRendering = true;

    // Agar user ne is page par pehle edit kiya hua hai, toh seedha wahi edited image load karo
    if (pageEdits[num]) {
        fetch(pageEdits[num].dataUrl)
            .then(res => res.blob())
            .then(blob => sendBlobToScriptJs(blob, num));
        return;
    }

    // Warna original PDF se fresh page load karo
    currentPdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: 2.0 });
        tempCanvas.height = viewport.height;
        tempCanvas.width = viewport.width;

        page.render({ canvasContext: tempCtx, viewport: viewport }).promise.then(() => {
            tempCanvas.toBlob((blob) => {
                sendBlobToScriptJs(blob, num);
            }, 'image/png', 1.0);
        });
    });
}

// 3. Prev/Next page logic (Ab yaad rakhega tumhare edits)
if(prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (!currentPdfDoc || currentPdfPageNum <= 1) return;
        saveCurrentPageEdit(); // Page badalne se pehle edit save karo
        currentPdfPageNum--;
        queueRenderPage(currentPdfPageNum);
    });
}

if(nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (!currentPdfDoc || currentPdfPageNum >= currentPdfDoc.numPages) return;
        saveCurrentPageEdit(); // Page badalne se pehle edit save karo
        currentPdfPageNum++;
        queueRenderPage(currentPdfPageNum);
    });
}

function queueRenderPage(num) {
    if (pdfIsRendering) pdfPagePending = num;
    else renderPdfPageToImage(num);
}

// 4. 🔥 MULTI-PAGE PDF EXPORT LOGIC 🔥
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
        if (!currentPdfDoc && (!editorCanvasPdf.width || editorCanvasPdf.width === 0)) {
            alert("Please load and edit a file first!");
            return;
        }

        // Agar sirf ek normal image hai (PDF nahi upload ki)
        if (!currentPdfDoc) {
            const imgData = editorCanvasPdf.toDataURL('image/jpeg', 1.0);
            const { jsPDF } = window.jspdf;
            const orientation = editorCanvasPdf.width > editorCanvasPdf.height ? 'landscape' : 'portrait';
            const pdf = new jsPDF({ orientation: orientation, unit: 'px', format: [editorCanvasPdf.width, editorCanvasPdf.height] });
            pdf.addImage(imgData, 'JPEG', 0, 0, editorCanvasPdf.width, editorCanvasPdf.height);
            pdf.save('ChangerPro_Edited.pdf');
            return;
        }

        // Agar multi-page PDF document hai
        saveCurrentPageEdit(); // Sabse pehle current screen ko save karo
        
        const originalBtnText = downloadPdfBtn.innerHTML;
        downloadPdfBtn.innerHTML = "⏳ Saving All Pages...";
        downloadPdfBtn.style.opacity = "0.7";
        downloadPdfBtn.style.pointerEvents = "none";

        const { jsPDF } = window.jspdf;
        let finalPdf = null;

        try {
            // Loop laga kar PDF ke saare pages check karo (1 se aakhiri tak)
            for (let i = 1; i <= currentPdfDoc.numPages; i++) {
                let imgData, width, height;

                if (pageEdits[i]) {
                    // Agar user ne is page ko edit kiya hai, toh edited version lo
                    imgData = pageEdits[i].dataUrl;
                    width = pageEdits[i].width;
                    height = pageEdits[i].height;
                } else {
                    // Agar page edit nahi kiya, toh background mein original PDF se original page extract karo
                    const page = await currentPdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;

                    await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;
                    imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
                    width = viewport.width;
                    height = viewport.height;
                }

                const orientation = width > height ? 'landscape' : 'portrait';

                if (i === 1) {
                    finalPdf = new jsPDF({ orientation: orientation, unit: 'px', format: [width, height] });
                } else {
                    finalPdf.addPage([width, height], orientation);
                }

                finalPdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            }

            // Ek hi file mein saare pages download karo
            finalPdf.save('ChangerPro_Full_Edited.pdf');
        } catch (error) {
            console.error("Error generating full PDF:", error);
            alert("An error occurred while exporting the PDF.");
        } finally {
            // Button ko wapas normal kardo
            downloadPdfBtn.innerHTML = originalBtnText;
            downloadPdfBtn.style.opacity = "1";
            downloadPdfBtn.style.pointerEvents = "auto";
        }
    });
}