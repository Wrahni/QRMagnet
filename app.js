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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  updatePreview();
});

// Event listeners
function initializeEventListeners() {
  // Form inputs
  elements.ssidInput.addEventListener('input', updatePreview);
  elements.passwordInput.addEventListener('input', updatePreview);
  elements.securitySelect.addEventListener('change', updatePreview);
  elements.greetingInput.addEventListener('input', updatePreview);
  elements.instructionInput.addEventListener('input', updatePreview);
  
  // Font selectors
  elements.greetingFontSelect.addEventListener('change', updateFonts);
  elements.instructionFontSelect.addEventListener('change', updateFonts);
  elements.credentialFontSelect.addEventListener('change', updateFonts);
  
  // Shape selector
  elements.shapeInputs.forEach(input => {
    input.addEventListener('change', handleShapeChange);
  });
  
  // Password toggle
  elements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  
  // Generate buttons
  elements.generateSVGBtn.addEventListener('click', generateSVG);
  elements.generatePNGBtn.addEventListener('click', generatePNG);
}

// Handle shape change
function handleShapeChange(event) {
  currentShape = event.target.value;
  const shape = appData.magnetShapes[currentShape];
  
  // Update preview container
  elements.magnetPreview.className = `magnet-preview ${currentShape}`;
  elements.previewDimensions.textContent = shape.dimensions;
  
  updatePreview();
}

// Toggle password visibility
function togglePasswordVisibility() {
  const isPassword = elements.passwordInput.type === 'password';
  elements.passwordInput.type = isPassword ? 'text' : 'password';
  elements.toggleIcon.textContent = isPassword ? '🙈' : '👁️';
}

// Update fonts in preview
function updateFonts() {
  const greetingFont = elements.greetingFontSelect.value;
  const instructionFont = elements.instructionFontSelect.value;
  const credentialFont = elements.credentialFontSelect.value;
  
  elements.previewGreeting.style.fontFamily = greetingFont;
  elements.previewInstruction.style.fontFamily = instructionFont;
  elements.previewSSID.style.fontFamily = credentialFont;
  elements.previewPassword.style.fontFamily = credentialFont;
}

// Add this NEW function right before generateWiFiString()
function escapeWiFiString(str) {
    if (!str) return str;
    return str.replace(/\\/g, '\\\\')    // Escape backslashes
              .replace(/;/g, '\\;')      // Escape semicolons  
              .replace(/,/g, '\\,')      // Escape commas
              .replace(/"/g, '\\"');     // Escape quotes
}

// Then UPDATE your existing generateWiFiString() function to use it:
function generateWiFiString() {
    const ssid = escapeWiFiString(elements.ssidInput.value.trim());        // <- ADD escapeWiFiString() here
    const password = escapeWiFiString(elements.passwordInput.value);       // <- ADD escapeWiFiString() here
    const security = elements.securitySelect.value;
    
    if (!ssid) return null;
    
    // Format: WIFI:T:<type>;S:<ssid>;P:<password>;H:;;
    let wifiString = `WIFI:T:${security};S:${ssid}`;
    if (security !== 'nopass' && password) {
        wifiString += `;P:${password}`;
    }
    wifiString += `;H:;;`;
    
    return wifiString;
}


// Generate QR code
function generateQRCode() {
    const wifiString = generateWiFiString();
    if (!wifiString) return null;
    
    try {
        // Use QRCode.toCanvas directly - this method exists!
        QRCode.toCanvas(elements.qrCanvas, wifiString, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 150
        });
        return true;
    } catch (error) {
        console.error('QR Code generation failed:', error);
        return false;
    }
}


// Draw QR code to canvas
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
}

// Update preview
function updatePreview() {
  const ssid = elements.ssidInput.value.trim();
  const password = elements.passwordInput.value;
  const greeting = elements.greetingInput.value.trim();
  const instruction = elements.instructionInput.value.trim() || 'Scan to Connect';
  
  // Update text content
  elements.previewGreeting.textContent = greeting;
  elements.previewInstruction.textContent = instruction;
  elements.previewSSID.textContent = ssid ? `Network: ${ssid}` : 'Network: ';
  elements.previewPassword.textContent = password ? `Password: ${password}` : 'Password: ';
  
  // Generate and display QR code
  const qrCode = generateQRCode();
  if (qrCode) {
    drawQRCodeToCanvas(qrCode, elements.qrCanvas);
  } else {
    // Clear canvas if no valid QR code
    const ctx = elements.qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.qrCanvas.width, elements.qrCanvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Enter SSID', 75, 70);
    ctx.fillText('to generate', 75, 90);
    ctx.fillText('QR code', 75, 110);
  }
  
  // Update fonts
  updateFonts();
}

// Generate SVG
function generateSVG() {
  const ssid = elements.ssidInput.value.trim();
  const password = elements.passwordInput.value;
  
  if (!ssid) {
    alert('Please enter a WiFi SSID');
    return;
  }
  
  const greeting = elements.greetingInput.value.trim();
  const instruction = elements.instructionInput.value.trim() || 'Scan to Connect';
  const shape = appData.magnetShapes[currentShape];
  const greetingFont = elements.greetingFontSelect.value;
  const instructionFont = elements.instructionFontSelect.value;
  const credentialFont = elements.credentialFontSelect.value;
  
  // Calculate dimensions in mm to pixels (96 DPI)
  const mmToPx = 3.7795275591; // 96 DPI conversion
  const width = currentShape === 'square' ? shape.width * mmToPx : shape.diameter * mmToPx;
  const height = currentShape === 'square' ? shape.height * mmToPx : shape.diameter * mmToPx;
  const margin = appData.designSpecs.margin * mmToPx;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  if (currentShape === 'round') {
    svg += `<circle cx="${width/2}" cy="${height/2}" r="${(width/2)-1}" fill="white" stroke="black" stroke-width="1"/>`;
  } else {
    svg += `<rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="black" stroke-width="1"/>`;
  }
  
  // Calculate positions
  const centerX = width / 2;
  let currentY = margin;
  
  // Greeting text
  if (greeting) {
    const greetingSize = appData.designSpecs.textSizes.greeting * mmToPx;
    currentY += greetingSize;
    svg += `<text x="${centerX}" y="${currentY}" font-family="${greetingFont}" font-size="${greetingSize}" font-weight="600" text-anchor="middle" fill="black">${greeting}</text>`;
    currentY += greetingSize * 0.5;
  }
  
  // QR Code
  const qrSize = appData.designSpecs.qrSize * mmToPx;
  const qrX = centerX - qrSize / 2;
  currentY += 20;
  
  if (currentQRCode) {
    const modules = currentQRCode.modules;
    const moduleCount = modules.length;
    const moduleSize = qrSize / moduleCount;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules[row][col]) {
          const x = qrX + col * moduleSize;
          const y = currentY + row * moduleSize;
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
  }
  
  currentY += qrSize + 15;
  
  // Instruction text
  const instructionSize = appData.designSpecs.textSizes.instruction * mmToPx;
  svg += `<text x="${centerX}" y="${currentY}" font-family="${instructionFont}" font-size="${instructionSize}" font-weight="500" text-anchor="middle" fill="black">${instruction}</text>`;
  currentY += instructionSize * 1.5;
  
  // Credentials
  const credentialSize = appData.designSpecs.textSizes.credentials * mmToPx;
  svg += `<text x="${centerX}" y="${currentY}" font-family="${credentialFont}" font-size="${credentialSize}" text-anchor="middle" fill="black">Network: ${ssid}</text>`;
  currentY += credentialSize * 1.2;
  svg += `<text x="${centerX}" y="${currentY}" font-family="${credentialFont}" font-size="${credentialSize}" text-anchor="middle" fill="black">Password: ${password}</text>`;
  
  svg += '</svg>';
  
  // Download SVG
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wifi-magnet-${currentShape}-${ssid.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate PNG
function generatePNG() {
  const ssid = elements.ssidInput.value.trim();
  
  if (!ssid) {
    alert('Please enter a WiFi SSID');
    return;
  }
  
  const password = elements.passwordInput.value;
  const greeting = elements.greetingInput.value.trim();
  const instruction = elements.instructionInput.value.trim() || 'Scan to Connect';
  const shape = appData.magnetShapes[currentShape];
  const greetingFont = elements.greetingFontSelect.value;
  const instructionFont = elements.instructionFontSelect.value;
  const credentialFont = elements.credentialFontSelect.value;
  
  // Create high-resolution canvas for PNG export
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // High DPI for crisp output (300 DPI)
  const dpiScale = 300 / 96;
  const mmToPx = 3.7795275591 * dpiScale;
  const width = currentShape === 'square' ? shape.width * mmToPx : shape.diameter * mmToPx;
  const height = currentShape === 'square' ? shape.height * mmToPx : shape.diameter * mmToPx;
  const margin = appData.designSpecs.margin * mmToPx;
  
  canvas.width = width;
  canvas.height = height;
  
  // Set high DPI scaling
  ctx.scale(dpiScale, dpiScale);
  
  // White background
  ctx.fillStyle = 'white';
  if (currentShape === 'round') {
    ctx.beginPath();
    ctx.arc(width/(2*dpiScale), height/(2*dpiScale), (width/(2*dpiScale))-1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(0, 0, width/dpiScale, height/dpiScale);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, (width/dpiScale)-2, (height/dpiScale)-2);
  }
  
  // Calculate positions
  const centerX = width / (2 * dpiScale);
  let currentY = margin / dpiScale;
  
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  
  // Greeting text
  if (greeting) {
    const greetingSize = appData.designSpecs.textSizes.greeting * mmToPx / dpiScale;
    currentY += greetingSize;
    ctx.font = `600 ${greetingSize}px ${greetingFont}`;
    ctx.fillText(greeting, centerX, currentY);
    currentY += greetingSize * 0.5;
  }
  
  // QR Code
  const qrSize = appData.designSpecs.qrSize * mmToPx / dpiScale;
  const qrX = centerX - qrSize / 2;
  currentY += 20 / dpiScale;
  
  if (currentQRCode) {
    const modules = currentQRCode.modules;
    const moduleCount = modules.length;
    const moduleSize = qrSize / moduleCount;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules[row][col]) {
          const x = qrX + col * moduleSize;
          const y = currentY + row * moduleSize;
          ctx.fillRect(x, y, moduleSize, moduleSize);
        }
      }
    }
  }
  
  currentY += qrSize + 15 / dpiScale;
  
  // Instruction text
  const instructionSize = appData.designSpecs.textSizes.instruction * mmToPx / dpiScale;
  ctx.font = `500 ${instructionSize}px ${instructionFont}`;
  ctx.fillText(instruction, centerX, currentY);
  currentY += instructionSize * 1.5;
  
  // Credentials
  const credentialSize = appData.designSpecs.textSizes.credentials * mmToPx / dpiScale;
  ctx.font = `400 ${credentialSize}px ${credentialFont}`;
  ctx.fillText(`Network: ${ssid}`, centerX, currentY);
  currentY += credentialSize * 1.2;
  ctx.fillText(`Password: ${password}`, centerX, currentY);
  
  // Download PNG
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-magnet-${currentShape}-${ssid.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}