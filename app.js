// Application data
const appData = {
    magnetShapes: {
        square: { name: "Square", dimensions: "60×60mm", width: 60, height: 60 },
        round: { name: "Round", dimensions: "Ø65mm", diameter: 65 }
    },
    fonts: {
        serif: [
            { name: "Playfair Display", family: "Playfair Display, serif" },
            { name: "Georgia", family: "Georgia, serif" },
            { name: "Times New Roman", family: "Times New Roman, serif" }
        ],
        sansSerif: [
            { name: "Montserrat", family: "Montserrat, sans-serif" },
            { name: "Roboto", family: "Roboto, sans-serif" },
            { name: "Arial", family: "Arial, sans-serif" }
        ],
        monospace: [
            { name: "Inconsolata", family: "Inconsolata, monospace" },
            { name: "Courier New", family: "Courier New, monospace" },
            { name: "Monaco", family: "Monaco, monospace" }
        ]
    },
    designSpecs: {
        qrSize: 40,
        margin: 3,
        textSizes: { greeting: 8, instruction: 6, credentials: 5 }
    }
};

// Global state
let currentQRCode = null;
let currentShape = 'square';

// DOM Elements
const elements = {
    form: document.getElementById('configForm'),
    magnetPreview: document.getElementById('magnetPreview'),
    previewDimensions: document.getElementById('previewDimensions'),
    qrCanvas: document.getElementById('qrCanvas'),
    exportSvg: document.getElementById('exportSvg'),
    exportPng: document.getElementById('exportPng'),

    // Form inputs
    networkName: document.getElementById('networkName'),
    password: document.getElementById('password'),
    greeting: document.getElementById('greeting'),
    instruction: document.getElementById('instruction'),
    shape: document.getElementById('shape'),
    greetingFont: document.getElementById('greetingFont'),
    instructionFont: document.getElementById('instructionFont'),
    credentialsFont: document.getElementById('credentialsFont')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFontSelectors();
    bindEventListeners();
    updatePreview();
});

// Initialize font selectors
function initializeFontSelectors() {
    populateFontSelector(elements.greetingFont, 'sansSerif');
    populateFontSelector(elements.instructionFont, 'sansSerif');
    populateFontSelector(elements.credentialsFont, 'monospace');
}

// Populate font selector dropdown
function populateFontSelector(selectElement, defaultCategory) {
    selectElement.innerHTML = '';

    Object.entries(appData.fonts).forEach(([category, fonts]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.family;
            option.textContent = font.name;
            option.style.fontFamily = font.family;

            if (category === defaultCategory && fonts.indexOf(font) === 0) {
                option.selected = true;
            }

            optgroup.appendChild(option);
        });

        selectElement.appendChild(optgroup);
    });
}

// Bind event listeners
function bindEventListeners() {
    elements.form.addEventListener('change', updatePreview);
    elements.form.addEventListener('input', updatePreview);
    elements.exportSvg.addEventListener('click', exportSVG);
    elements.exportPng.addEventListener('click', exportPNG);
    elements.shape.addEventListener('change', handleShapeChange);
}

// Handle shape change with circular QR code styling
function handleShapeChange(event) {
    currentShape = event.target.value;
    const shape = appData.magnetShapes[currentShape];

    // Update preview container
    elements.magnetPreview.className = `magnet-preview ${currentShape}`;
    elements.previewDimensions.textContent = shape.dimensions;

    // Apply round styling to QR code when round magnet is selected
    if (currentShape === 'round') {
        elements.qrCanvas.classList.add('round-qr');
    } else {
        elements.qrCanvas.classList.remove('round-qr');
    }

    updatePreview();
}

// Enhanced QR Code generation with circular clipping
function generateQRCode(text) {
    try {
        return qrcode(0, 'M');
    } catch (error) {
        console.error('QR Code generation failed:', error);
        return null;
    }
}

// Enhanced canvas drawing with circular clipping for QR code
function drawQRCodeToCanvas(qrCode, canvas) {
    if (!qrCode || !canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 150; // 40mm at preview scale
    canvas.width = size;
    canvas.height = size;

    const modules = qrCode.modules;
    const moduleCount = modules.length;
    const moduleSize = size / moduleCount;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Apply circular clipping mask if round shape is selected
    if (currentShape === 'round') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
        ctx.clip();
    }

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    // Draw QR modules
    ctx.fillStyle = 'black';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (modules[row][col]) {
                ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
            }
        }
    }

    // Restore context if clipping was applied
    if (currentShape === 'round') {
        ctx.restore();
    }
}

// Enhanced text drawing with circular path support
function drawTextAlongCircle(ctx, text, x, y, radius, startAngle, fontSize, fontFamily) {
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const anglePerChar = (Math.PI * 1.8) / text.length; // Spread text around most of circle

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const angle = startAngle + (i * anglePerChar) - (Math.PI * 0.9); // Center the text

        const charX = x + Math.cos(angle) * radius;
        const charY = y + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate(angle + Math.PI/2); // Rotate character to follow curve
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }

    ctx.restore();
}

// Update preview with enhanced circular text support
function updatePreview() {
    const formData = {
        networkName: elements.networkName.value || 'Your Network',
        password: elements.password.value || 'password123',
        greeting: elements.greeting.value || 'Scan to Connect',
        instruction: elements.instruction.value || 'Point camera at QR code',
        greetingFont: elements.greetingFont.value,
        instructionFont: elements.instructionFont.value,
        credentialsFont: elements.credentialsFont.value
    };

    // Generate WiFi QR code
    const wifiString = `WIFI:T:WPA;S:${formData.networkName};P:${formData.password};H:false;;`;
    currentQRCode = generateQRCode(wifiString);

    if (currentQRCode) {
        currentQRCode.addData(wifiString);
        currentQRCode.make();
        drawQRCodeToCanvas(currentQRCode, elements.qrCanvas);
    }

    // Update text elements in preview
    updateTextElements(formData);
}

// Update text elements with circular support
function updateTextElements(formData) {
    const greetingElement = document.querySelector('.preview-greeting');
    const instructionElement = document.querySelector('.preview-instruction');
    const networkElement = document.querySelector('.network-name');
    const passwordElement = document.querySelector('.network-password');

    if (greetingElement) {
        greetingElement.textContent = formData.greeting;
        greetingElement.style.fontFamily = formData.greetingFont;

        // Apply circular text styling for round magnets
        if (currentShape === 'round') {
            greetingElement.classList.add('circular-text');
        } else {
            greetingElement.classList.remove('circular-text');
        }
    }

    if (instructionElement) {
        instructionElement.textContent = formData.instruction;
        instructionElement.style.fontFamily = formData.instructionFont;

        // Apply circular text styling for round magnets
        if (currentShape === 'round') {
            instructionElement.classList.add('circular-text-bottom');
        } else {
            instructionElement.classList.remove('circular-text-bottom');
        }
    }

    if (networkElement) {
        networkElement.textContent = `Network: ${formData.networkName}`;
        networkElement.style.fontFamily = formData.credentialsFont;
    }

    if (passwordElement) {
        passwordElement.textContent = `Password: ${formData.password}`;
        passwordElement.style.fontFamily = formData.credentialsFont;
    }
}

// Enhanced SVG export with circular QR code support
function exportSVG() {
    const formData = getFormData();
    const shape = appData.magnetShapes[currentShape];
    const { qrSize, margin, textSizes } = appData.designSpecs;

    // Calculate dimensions
    const totalWidth = currentShape === 'round' ? shape.diameter : shape.width;
    const totalHeight = currentShape === 'round' ? shape.diameter : shape.height;

    // Start SVG
    let svg = `<svg width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;

    // Add circular clipping definition for round QR codes
    if (currentShape === 'round') {
        svg += `<defs>
            <clipPath id="qrClip">
                <circle cx="${totalWidth/2}" cy="${totalHeight/2 - 5}" r="${qrSize/2}"/>
            </clipPath>
        </defs>`;
    }

    // Background
    if (currentShape === 'round') {
        svg += `<circle cx="${totalWidth/2}" cy="${totalHeight/2}" r="${totalWidth/2}" fill="white" stroke="black" stroke-width="0.1"/>`;
    } else {
        svg += `<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="white" stroke="black" stroke-width="0.1"/>`;
    }

    // QR Code
    if (currentQRCode) {
        const qrX = (totalWidth - qrSize) / 2;
        const currentY = margin + textSizes.greeting + 2;

        const modules = currentQRCode.modules;
        const moduleCount = modules.length;
        const moduleSize = qrSize / moduleCount;

        // Apply clipping for round QR codes
        const clipPath = currentShape === 'round' ? ' clip-path="url(#qrClip)"' : '';
        svg += `<g${clipPath}>`;

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (modules[row][col]) {
                    const x = qrX + (col * moduleSize);
                    const y = currentY + (row * moduleSize);
                    svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
                }
            }
        }
        svg += `</g>`;

        // Text elements with circular path support
        const greetingY = margin + textSizes.greeting/2;
        const instructionY = currentY + qrSize + 3;
        const credentialsY = instructionY + textSizes.instruction + 3;

        if (currentShape === 'round') {
            // Circular text paths
            const centerX = totalWidth / 2;
            const centerY = totalHeight / 2;
            const textRadius = totalWidth / 2 - margin - 5;

            svg += `<defs>
                <path id="topCircle" d="M ${centerX - textRadius},${centerY} A ${textRadius},${textRadius} 0 0,1 ${centerX + textRadius},${centerY}"/>
                <path id="bottomCircle" d="M ${centerX + textRadius},${centerY} A ${textRadius},${textRadius} 0 0,1 ${centerX - textRadius},${centerY}"/>
            </defs>`;

            svg += `<text font-family="${formData.greetingFont}" font-size="${textSizes.greeting}" fill="black" text-anchor="middle">
                <textPath href="#topCircle" startOffset="50%">${formData.greeting}</textPath>
            </text>`;

            svg += `<text font-family="${formData.instructionFont}" font-size="${textSizes.instruction}" fill="black" text-anchor="middle">
                <textPath href="#bottomCircle" startOffset="50%">${formData.instruction}</textPath>
            </text>`;
        } else {
            // Regular straight text
            svg += `<text x="${totalWidth/2}" y="${greetingY}" font-family="${formData.greetingFont}" font-size="${textSizes.greeting}" fill="black" text-anchor="middle">${formData.greeting}</text>`;
            svg += `<text x="${totalWidth/2}" y="${instructionY}" font-family="${formData.instructionFont}" font-size="${textSizes.instruction}" fill="black" text-anchor="middle">${formData.instruction}</text>`;
        }

        // Credentials (always straight)
        svg += `<text x="${totalWidth/2}" y="${credentialsY}" font-family="${formData.credentialsFont}" font-size="${textSizes.credentials}" fill="black" text-anchor="middle">Network: ${formData.networkName}</text>`;
        svg += `<text x="${totalWidth/2}" y="${credentialsY + textSizes.credentials + 1}" font-family="${formData.credentialsFont}" font-size="${textSizes.credentials}" fill="black" text-anchor="middle">Password: ${formData.password}</text>`;
    }

    svg += `</svg>`;

    // Download
    downloadFile(svg, `wifi-magnet-${currentShape}.svg`, 'image/svg+xml');
}

// Enhanced PNG export with circular QR code support
function exportPNG() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpi = 300; // High resolution for print
    const mmToPx = dpi / 25.4;

    const formData = getFormData();
    const shape = appData.magnetShapes[currentShape];
    const { qrSize, margin, textSizes } = appData.designSpecs;

    // Calculate dimensions in pixels
    const totalWidth = (currentShape === 'round' ? shape.diameter : shape.width) * mmToPx;
    const totalHeight = (currentShape === 'round' ? shape.diameter : shape.height) * mmToPx;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = 'white';
    if (currentShape === 'round') {
        ctx.beginPath();
        ctx.arc(totalWidth/2, totalHeight/2, totalWidth/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(0, 0, totalWidth, totalHeight);
        ctx.strokeRect(0, 0, totalWidth, totalHeight);
    }

    // QR Code with circular clipping
    if (currentQRCode) {
        const qrSizePx = qrSize * mmToPx;
        const qrX = (totalWidth - qrSizePx) / 2;
        const currentY = (margin + textSizes.greeting + 2) * mmToPx;

        // Apply circular clipping for round QR codes
        if (currentShape === 'round') {
            ctx.save();
            ctx.beginPath();
            ctx.arc(totalWidth/2, currentY + qrSizePx/2, qrSizePx/2, 0, 2 * Math.PI);
            ctx.clip();
        }

        const modules = currentQRCode.modules;
        const moduleCount = modules.length;
        const moduleSize = qrSizePx / moduleCount;

        ctx.fillStyle = 'black';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (modules[row][col]) {
                    const x = qrX + (col * moduleSize);
                    const y = currentY + (row * moduleSize);
                    ctx.fillRect(x, y, moduleSize, moduleSize);
                }
            }
        }

        if (currentShape === 'round') {
            ctx.restore();
        }

        // Text with circular support
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';

        if (currentShape === 'round') {
            // Circular text
            const centerX = totalWidth / 2;
            const centerY = totalHeight / 2;
            const textRadius = (totalWidth / 2) - (margin * mmToPx) - (20 * mmToPx);

            // Top curved text (greeting)
            drawTextAlongCircle(ctx, formData.greeting, centerX, centerY, textRadius, -Math.PI/2, textSizes.greeting * mmToPx/3, formData.greetingFont);

            // Bottom curved text (instruction)  
            drawTextAlongCircle(ctx, formData.instruction, centerX, centerY, textRadius, Math.PI/2, textSizes.instruction * mmToPx/3, formData.instructionFont);
        } else {
            // Regular straight text
            const greetingY = (margin + textSizes.greeting/2) * mmToPx;
            const instructionY = currentY + qrSizePx + (3 * mmToPx);

            ctx.font = `${textSizes.greeting * mmToPx/3}px ${formData.greetingFont}`;
            ctx.fillText(formData.greeting, totalWidth/2, greetingY);

            ctx.font = `${textSizes.instruction * mmToPx/3}px ${formData.instructionFont}`;
            ctx.fillText(formData.instruction, totalWidth/2, instructionY);
        }

        // Credentials (always straight)
        const credentialsY = (currentShape === 'round' ? totalHeight - (margin * 2 * mmToPx) : totalHeight - (margin * mmToPx));
        ctx.font = `${textSizes.credentials * mmToPx/3}px ${formData.credentialsFont}`;
        ctx.fillText(`Network: ${formData.networkName}`, totalWidth/2, credentialsY - (textSizes.credentials * mmToPx/2));
        ctx.fillText(`Password: ${formData.password}`, totalWidth/2, credentialsY);
    }

    // Download
    canvas.toBlob(blob => {
        downloadFile(blob, `wifi-magnet-${currentShape}.png`, 'image/png');
    });
}

// Get form data
function getFormData() {
    return {
        networkName: elements.networkName.value || 'Your Network',
        password: elements.password.value || 'password123',
        greeting: elements.greeting.value || 'Scan to Connect',
        instruction: elements.instruction.value || 'Point camera at QR code',
        greetingFont: elements.greetingFont.value,
        instructionFont: elements.instructionFont.value,
        credentialsFont: elements.credentialsFont.value
    };
}

// Download file helper
function downloadFile(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}