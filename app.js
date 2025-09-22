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
let currentQRCodeData = null;
let currentShape = 'square';

// DOM Elements - Wait for DOM to be loaded
let elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Initialize DOM elements
    elements = {
        form: document.getElementById('magnetForm'),
        ssidInput: document.getElementById('ssid'),
        passwordInput: document.getElementById('password'),
        securitySelect: document.getElementById('security'),
        greetingInput: document.getElementById('greeting'),
        instructionInput: document.getElementById('instruction'),
        greetingFontSelect: document.getElementById('greetingFont'),
        instructionFontSelect: document.getElementById('instructionFont'),
        credentialFontSelect: document.getElementById('credentialFont'),
        togglePasswordBtn: document.getElementById('togglePassword'),
        toggleIcon: document.getElementById('toggleIcon'),
        generateSVGBtn: document.getElementById('generateSVG'),
        generatePNGBtn: document.getElementById('generatePNG'),
        magnetPreview: document.getElementById('magnetPreview'),
        previewDimensions: document.getElementById('previewDimensions'),
        previewGreeting: document.getElementById('previewGreeting'),
        previewInstruction: document.getElementById('previewInstruction'),
        previewSSID: document.getElementById('previewSSID'),
        previewPassword: document.getElementById('previewPassword'),
        qrCanvas: document.getElementById('qrCanvas'),
        shapeInputs: document.querySelectorAll('input[name="shape"]')
    };
    
    // Verify QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded! Check if the CDN script is included.');
        alert('QR Code library failed to load. Please refresh the page.');
        return;
    } else {
        console.log('QRCode library loaded successfully');
    }
    
    // Verify all DOM elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Missing DOM element: ${key}`);
        }
    }
    
    initializeEventListeners();
    updatePreview();
});

// Event listeners
function initializeEventListeners() {
    // Form inputs
    if (elements.ssidInput) elements.ssidInput.addEventListener('input', updatePreview);
    if (elements.passwordInput) elements.passwordInput.addEventListener('input', updatePreview);
    if (elements.securitySelect) elements.securitySelect.addEventListener('change', updatePreview);
    if (elements.greetingInput) elements.greetingInput.addEventListener('input', updatePreview);
    if (elements.instructionInput) elements.instructionInput.addEventListener('input', updatePreview);
    
    // Font selectors
    if (elements.greetingFontSelect) elements.greetingFontSelect.addEventListener('change', updateFonts);
    if (elements.instructionFontSelect) elements.instructionFontSelect.addEventListener('change', updateFonts);
    if (elements.credentialFontSelect) elements.credentialFontSelect.addEventListener('change', updateFonts);
    
    // Shape selector
    elements.shapeInputs.forEach(input => {
        input.addEventListener('change', handleShapeChange);
    });
    
    // Password toggle
    if (elements.togglePasswordBtn) elements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    
    // Generate buttons
    if (elements.generateSVGBtn) elements.generateSVGBtn.addEventListener('click', generateSVG);
    if (elements.generatePNGBtn) elements.generatePNGBtn.addEventListener('click', generatePNG);
}

// Handle shape change
function handleShapeChange(event) {
    currentShape = event.target.value;
    const shape = appData.magnetShapes[currentShape];
    
    // Update preview container
    if (elements.magnetPreview) elements.magnetPreview.className = `magnet-preview ${currentShape}`;
    if (elements.previewDimensions) elements.previewDimensions.textContent = shape.dimensions;
    
    updatePreview();
}

// Toggle password visibility
function togglePasswordVisibility() {
    if (!elements.passwordInput || !elements.toggleIcon) return;
    
    const isPassword = elements.passwordInput.type === 'password';
    elements.passwordInput.type = isPassword ? 'text' : 'password';
    elements.toggleIcon.textContent = isPassword ? '🙈' : '👁';
}

// Update fonts in preview
function updateFonts() {
    if (!elements.greetingFontSelect || !elements.instructionFontSelect || !elements.credentialFontSelect) return;
    
    const greetingFont = elements.greetingFontSelect.value;
    const instructionFont = elements.instructionFontSelect.value;
    const credentialFont = elements.credentialFontSelect.value;
    
    if (elements.previewGreeting) elements.previewGreeting.style.fontFamily = greetingFont;
    if (elements.previewInstruction) elements.previewInstruction.style.fontFamily = instructionFont;
    if (elements.previewSSID) elements.previewSSID.style.fontFamily = credentialFont;
    if (elements.previewPassword) elements.previewPassword.style.fontFamily = credentialFont;
}

// Escape special characters in WiFi strings
function escapeWiFiString(str) {
    if (!str) return str;
    return str.replace(/\\/g, '\\\\')    // Escape backslashes
              .replace(/;/g, '\\;')      // Escape semicolons  
              .replace(/,/g, '\\,')      // Escape commas
              .replace(/"/g, '\\"');     // Escape quotes
}

// Generate WiFi QR code string
function generateWiFiString() {
    if (!elements.ssidInput || !elements.passwordInput || !elements.securitySelect) return null;
    
    const ssid = escapeWiFiString(elements.ssidInput.value.trim());
    const password = escapeWiFiString(elements.passwordInput.value);
    const security = elements.securitySelect.value;
    
    if (!ssid) return null;
    
    // Format: WIFI:T:<type>;S:<ssid>;P:<password>;H:;;
    let wifiString = `WIFI:T:${security};S:${ssid}`;
    if (security !== 'nopass' && password) {
        wifiString += `;P:${password}`;
    }
    wifiString += `;H:;;`;
    
    console.log('Generated WiFi string:', wifiString);
    return wifiString;
}

// Generate QR code - FIXED VERSION
function generateQRCode() {
    const wifiString = generateWiFiString();
    if (!wifiString) return null;
    
    if (!elements.qrCanvas) {
        console.error('QR Canvas element not found');
        return null;
    }
    
    try {
        console.log('Generating QR code for:', wifiString);
        
        // Use QRCode.toCanvas directly - this method exists in qrcode@1.5.3
        QRCode.toCanvas(elements.qrCanvas, wifiString, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 150
        }, function(error) {
            if (error) {
                console.error('QR Code generation failed:', error);
                showQRError();
            } else {
                console.log('QR Code generated successfully');
                currentQRCodeData = wifiString;
            }
        });
        
        return true;
    } catch (error) {
        console.error('QR Code generation failed:', error);
        showQRError();
        return false;
    }
}

// Show error message in QR canvas
function showQRError() {
    if (!elements.qrCanvas) return;
    
    const ctx = elements.qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, 150, 150);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Enter SSID', 75, 60);
    ctx.fillText('to generate', 75, 80);
    ctx.fillText('QR code', 75, 100);
}

// Update preview
function updatePreview() {
    if (!elements.ssidInput || !elements.passwordInput) return;
    
    const ssid = elements.ssidInput.value.trim();
    const password = elements.passwordInput.value;
    const greeting = elements.greetingInput ? elements.greetingInput.value.trim() : '';
    const instruction = elements.instructionInput ? elements.instructionInput.value.trim() || 'Scan to Connect' : 'Scan to Connect';
    
    // Update text content
    if (elements.previewGreeting) elements.previewGreeting.textContent = greeting;
    if (elements.previewInstruction) elements.previewInstruction.textContent = instruction;
    if (elements.previewSSID) elements.previewSSID.textContent = ssid ? `Network: ${ssid}` : 'Network:';
    if (elements.previewPassword) elements.previewPassword.textContent = password ? `Password: ${password}` : 'Password:';
    
    // Generate and display QR code
    if (ssid) {
        generateQRCode();
    } else {
        showQRError();
    }
    
    // Update fonts
    updateFonts();
}

// Generate SVG - Simplified version
function generateSVG() {
    const ssid = elements.ssidInput ? elements.ssidInput.value.trim() : '';
    if (!ssid) {
        alert('Please enter a WiFi SSID');
        return;
    }
    
    const password = elements.passwordInput ? elements.passwordInput.value : '';
    const greeting = elements.greetingInput ? elements.greetingInput.value.trim() : '';
    const instruction = elements.instructionInput ? elements.instructionInput.value.trim() || 'Scan to Connect' : 'Scan to Connect';
    
    // For now, create a simple SVG - this would need QR code module data for full implementation
    let svg = `<svg width="226" height="226" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="224" height="224" fill="white" stroke="black" stroke-width="1"/>
        <text x="113" y="40" font-family="Playfair Display, serif" font-size="16" text-anchor="middle" fill="black">${greeting}</text>
        <rect x="63" y="60" width="100" height="100" fill="#f0f0f0" stroke="#ccc"/>
        <text x="113" y="115" font-size="12" text-anchor="middle" fill="#666">QR Code</text>
        <text x="113" y="180" font-family="Montserrat, sans-serif" font-size="14" text-anchor="middle" fill="black">${instruction}</text>
        <text x="113" y="200" font-family="Inconsolata, monospace" font-size="12" text-anchor="middle" fill="black">Network: ${ssid}</text>
        <text x="113" y="215" font-family="Inconsolata, monospace" font-size="12" text-anchor="middle" fill="black">Password: ${password}</text>
    </svg>`;
    
    // Download SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-magnet-${currentShape}-${ssid.replace(/[^a-zA-Z0-9]/g, '')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate PNG - Simplified version
function generatePNG() {
    const ssid = elements.ssidInput ? elements.ssidInput.value.trim() : '';
    if (!ssid) {
        alert('Please enter a WiFi SSID');
        return;
    }
    
    // Create a simple PNG from the preview canvas
    if (elements.qrCanvas) {
        elements.qrCanvas.toBlob(function(blob) {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wifi-qr-${ssid.replace(/[^a-zA-Z0-9]/g, '')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }
}