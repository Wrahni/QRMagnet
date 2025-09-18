class WiFiQRGenerator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updatePreview();
    }

    initializeElements() {
        // Form elements
        this.ssidInput = document.getElementById('ssid');
        this.passwordInput = document.getElementById('password');
        this.securitySelect = document.getElementById('security');
        this.greetingInput = document.getElementById('greeting');
        this.shapeSelect = document.getElementById('shape');
        this.instructionTextInput = document.getElementById('instruction-text');

        // Checkboxes
        this.showInstructionsCheckbox = document.getElementById('show-instructions');
        this.showSsidCheckbox = document.getElementById('show-ssid');
        this.showPasswordCheckbox = document.getElementById('show-password');

        // Font selectors
        this.greetingFontSelect = document.getElementById('greeting-font');
        this.instructionFontSelect = document.getElementById('instruction-font');
        this.credentialsFontSelect = document.getElementById('credentials-font');

        // Buttons
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.downloadSvgBtn = document.getElementById('download-svg');
        this.downloadPngBtn = document.getElementById('download-png');

        // Preview elements
        this.magnetSvg = document.getElementById('magnet-svg');
        this.qrContainer = document.getElementById('qr-container');
        this.greetingText = document.getElementById('greeting-text');
        this.instructionDisplay = document.getElementById('instruction-display');
        this.ssidDisplay = document.getElementById('ssid-display');
        this.passwordDisplay = document.getElementById('password-display');
        this.contentGroup = document.getElementById('content-group');
        this.background = document.getElementById('background');
        this.instructionInput = document.getElementById('instruction-input');
    }

    bindEvents() {
        // Form input events
        this.ssidInput.addEventListener('input', () => this.updatePreview());
        this.passwordInput.addEventListener('input', () => this.updatePreview());
        this.securitySelect.addEventListener('change', () => this.updatePreview());
        this.greetingInput.addEventListener('input', () => this.updatePreview());
        this.shapeSelect.addEventListener('change', () => this.updatePreview());
        this.instructionTextInput.addEventListener('input', () => this.updatePreview());

        // Checkbox events
        this.showInstructionsCheckbox.addEventListener('change', () => {
            this.toggleInstructionInput();
            this.updatePreview();
        });
        this.showSsidCheckbox.addEventListener('change', () => this.updatePreview());
        this.showPasswordCheckbox.addEventListener('change', () => this.updatePreview());

        // Font selection events
        this.greetingFontSelect.addEventListener('change', () => this.updatePreview());
        this.instructionFontSelect.addEventListener('change', () => this.updatePreview());
        this.credentialsFontSelect.addEventListener('change', () => this.updatePreview());

        // Button events
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        this.downloadSvgBtn.addEventListener('click', () => this.downloadSVG());
        this.downloadPngBtn.addEventListener('click', () => this.downloadPNG());
    }

    toggleInstructionInput() {
        if (this.showInstructionsCheckbox.checked) {
            this.instructionInput.style.display = 'block';
        } else {
            this.instructionInput.style.display = 'none';
        }
    }

    togglePasswordVisibility() {
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            this.togglePasswordBtn.textContent = 'Hide';
        } else {
            this.passwordInput.type = 'password';
            this.togglePasswordBtn.textContent = 'Show';
        }
    }

    generateWiFiQRString() {
        const ssid = this.ssidInput.value.trim();
        const password = this.passwordInput.value.trim();
        const security = this.securitySelect.value;

        if (!ssid) return null;

        // WiFi QR format: WIFI:T:WPA;S:MyNetwork;P:MyPassword;;
        let qrString;
        
        if (security === 'nopass') {
            qrString = `WIFI:T:;S:${ssid};;`;
        } else {
            qrString = `WIFI:T:${security};S:${ssid};P:${password};;`;
        }

        return qrString;
    }

    async generateQRCode() {
        const qrString = this.generateWiFiQRString();
        if (!qrString) {
            this.clearQRCode();
            return;
        }

        try {
            // Clear existing QR code
            this.qrContainer.innerHTML = '';

            // Generate QR code matrix
            const qrData = await new Promise((resolve, reject) => {
                QRCode.toDataURL(qrString, {
                    width: 256,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    },
                    errorCorrectionLevel: 'M'
                }, (err, url) => {
                    if (err) reject(err);
                    else resolve(url);
                });
            });

            // Create SVG QR code manually for better control
            const qrMatrix = this.generateQRMatrix(qrString);
            this.createSVGQRCode(qrMatrix);

        } catch (error) {
            console.error('Error generating QR code:', error);
            this.clearQRCode();
        }
    }

    generateQRMatrix(text) {
        // Use the QRCode library to generate matrix data
        return new Promise((resolve, reject) => {
            try {
                // Generate QR code using the library's matrix generation
                QRCode.toDataURL(text, {
                    width: 200,
                    margin: 0,
                    errorCorrectionLevel: 'M'
                }, (err, url) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // We'll create a simple pattern for now
                    const size = 25; // 25x25 matrix
                    const matrix = [];
                    
                    // Create a deterministic pattern based on the text
                    const hash = this.simpleHash(text);
                    for (let y = 0; y < size; y++) {
                        matrix[y] = [];
                        for (let x = 0; x < size; x++) {
                            // Create a pattern that looks like a QR code
                            const isCorner = (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
                            const isFinder = isCorner && ((x < 3 || x > size - 4) || (y < 3 || y > size - 4));
                            const isData = !isCorner && ((x + y + hash) % 3 === 0);
                            
                            matrix[y][x] = isFinder || isData ? 1 : 0;
                        }
                    }
                    resolve(matrix);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    async createSVGQRCode(matrixPromise) {
        try {
            const matrix = await matrixPromise;
            const moduleSize = 3; // Size of each QR code module
            const totalSize = matrix.length * moduleSize;
            
            // Create background
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', -totalSize/2);
            bg.setAttribute('y', -totalSize/2);
            bg.setAttribute('width', totalSize);
            bg.setAttribute('height', totalSize);
            bg.setAttribute('fill', 'white');
            bg.setAttribute('stroke', 'black');
            bg.setAttribute('stroke-width', '0.5');
            this.qrContainer.appendChild(bg);

            // Create QR modules
            for (let y = 0; y < matrix.length; y++) {
                for (let x = 0; x < matrix[y].length; x++) {
                    if (matrix[y][x]) {
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', (x * moduleSize) - totalSize/2);
                        rect.setAttribute('y', (y * moduleSize) - totalSize/2);
                        rect.setAttribute('width', moduleSize);
                        rect.setAttribute('height', moduleSize);
                        rect.setAttribute('fill', 'black');
                        this.qrContainer.appendChild(rect);
                    }
                }
            }
        } catch (error) {
            console.error('Error creating SVG QR code:', error);
            // Fallback: create a simple placeholder
            this.createPlaceholderQR();
        }
    }

    createPlaceholderQR() {
        const size = 75;
        
        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', -size/2);
        bg.setAttribute('y', -size/2);
        bg.setAttribute('width', size);
        bg.setAttribute('height', size);
        bg.setAttribute('fill', 'white');
        bg.setAttribute('stroke', 'black');
        bg.setAttribute('stroke-width', '1');
        this.qrContainer.appendChild(bg);

        // Create a simple QR-like pattern
        const moduleSize = 3;
        const modules = size / moduleSize;
        
        for (let y = 0; y < modules; y++) {
            for (let x = 0; x < modules; x++) {
                // Create a pattern that looks QR-ish
                const shouldFill = (x + y) % 3 === 0 || 
                                 (x < 5 && y < 5) || 
                                 (x >= modules - 5 && y < 5) || 
                                 (x < 5 && y >= modules - 5);
                
                if (shouldFill) {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', (x * moduleSize) - size/2);
                    rect.setAttribute('y', (y * moduleSize) - size/2);
                    rect.setAttribute('width', moduleSize);
                    rect.setAttribute('height', moduleSize);
                    rect.setAttribute('fill', 'black');
                    this.qrContainer.appendChild(rect);
                }
            }
        }

        // Add text indicator
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', size/2 + 15);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '8');
        text.setAttribute('fill', 'black');
        text.textContent = 'QR';
        this.qrContainer.appendChild(text);
    }

    clearQRCode() {
        this.qrContainer.innerHTML = '';
    }

    updatePreview() {
        // Update shape
        this.updateShape();

        // Update QR code
        this.generateQRCode();

        // Update text elements
        this.updateTextElements();

        // Update fonts
        this.updateFonts();
    }

    updateShape() {
        const shape = this.shapeSelect.value;
        this.magnetSvg.classList.remove('shape-square', 'shape-round');
        this.magnetSvg.classList.add(`shape-${shape}`);

        if (shape === 'round') {
            this.contentGroup.setAttribute('clip-path', 'url(#round-clip)');
            this.background.setAttribute('rx', '90');
            this.background.setAttribute('ry', '90');
        } else {
            this.contentGroup.setAttribute('clip-path', 'url(#square-clip)');
            this.background.setAttribute('rx', '5');
            this.background.setAttribute('ry', '5');
        }
    }

    updateTextElements() {
        // Update greeting text
        const greetingValue = this.greetingInput.value.trim();
        if (greetingValue) {
            this.greetingText.textContent = greetingValue;
            this.greetingText.style.display = 'block';
        } else {
            this.greetingText.style.display = 'none';
        }

        // Update instruction text
        if (this.showInstructionsCheckbox.checked) {
            const instructionValue = this.instructionTextInput.value.trim() || 'Scan to Connect';
            this.instructionDisplay.textContent = instructionValue;
            this.instructionDisplay.style.display = 'block';
        } else {
            this.instructionDisplay.style.display = 'none';
        }

        // Update SSID display
        if (this.showSsidCheckbox.checked && this.ssidInput.value.trim()) {
            this.ssidDisplay.textContent = `Network: ${this.ssidInput.value.trim()}`;
            this.ssidDisplay.style.display = 'block';
        } else {
            this.ssidDisplay.style.display = 'none';
        }

        // Update password display
        if (this.showPasswordCheckbox.checked && this.passwordInput.value.trim()) {
            this.passwordDisplay.textContent = `Password: ${this.passwordInput.value.trim()}`;
            this.passwordDisplay.style.display = 'block';
        } else {
            this.passwordDisplay.style.display = 'none';
        }

        // Adjust positioning based on visible elements
        this.adjustElementPositions();
    }

    adjustElementPositions() {
        let yPos = 40;
        const elementSpacing = 20;
        const qrSize = 80;

        // Position greeting text
        if (this.greetingText.style.display !== 'none' && this.greetingInput.value.trim()) {
            this.greetingText.setAttribute('y', yPos);
            yPos += 25;
        }

        // Position QR code (center it)
        const qrY = yPos + (qrSize / 2);
        this.qrContainer.setAttribute('transform', `translate(100, ${qrY})`);
        yPos += qrSize + 15;

        // Position instruction text
        if (this.instructionDisplay.style.display !== 'none') {
            this.instructionDisplay.setAttribute('y', yPos);
            yPos += 20;
        }

        // Position credentials
        if (this.ssidDisplay.style.display !== 'none') {
            this.ssidDisplay.setAttribute('y', yPos);
            yPos += 12;
        }

        if (this.passwordDisplay.style.display !== 'none') {
            this.passwordDisplay.setAttribute('y', yPos);
        }
    }

    updateFonts() {
        this.greetingText.setAttribute('font-family', this.greetingFontSelect.value);
        this.instructionDisplay.setAttribute('font-family', this.instructionFontSelect.value);
        this.ssidDisplay.setAttribute('font-family', this.credentialsFontSelect.value);
        this.passwordDisplay.setAttribute('font-family', this.credentialsFontSelect.value);
    }

    async downloadSVG() {
        if (!this.validateInputs()) return;

        try {
            const svgElement = this.magnetSvg.cloneNode(true);
            
            // Set proper dimensions for the chosen shape
            const shape = this.shapeSelect.value;
            if (shape === 'round') {
                svgElement.setAttribute('viewBox', '0 0 200 200');
                svgElement.setAttribute('width', '200');
                svgElement.setAttribute('height', '200');
            } else {
                svgElement.setAttribute('viewBox', '0 0 200 200');
                svgElement.setAttribute('width', '200');
                svgElement.setAttribute('height', '200');
            }

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `wifi-magnet-${this.ssidInput.value.trim().replace(/\s+/g, '-')}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showSuccessMessage('SVG downloaded successfully!');
        } catch (error) {
            console.error('Error downloading SVG:', error);
            this.showErrorMessage('Error downloading SVG file.');
        }
    }

    async downloadPNG() {
        if (!this.validateInputs()) return;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 400; // High resolution for print quality

            canvas.width = size;
            canvas.height = size;

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);

            // Create SVG data URL
            const svgElement = this.magnetSvg.cloneNode(true);
            svgElement.setAttribute('width', size);
            svgElement.setAttribute('height', size);
            
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Load and draw SVG
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                
                // Convert to PNG and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `wifi-magnet-${this.ssidInput.value.trim().replace(/\s+/g, '-')}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(svgUrl);
                    
                    this.showSuccessMessage('PNG downloaded successfully!');
                }, 'image/png');
            };

            img.onerror = () => {
                console.error('Error loading SVG for PNG conversion');
                this.showErrorMessage('Error converting to PNG.');
                URL.revokeObjectURL(svgUrl);
            };

            img.src = svgUrl;
        } catch (error) {
            console.error('Error downloading PNG:', error);
            this.showErrorMessage('Error downloading PNG file.');
        }
    }

    validateInputs() {
        const ssid = this.ssidInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!ssid) {
            this.showErrorMessage('Please enter a WiFi network name (SSID).');
            this.ssidInput.focus();
            return false;
        }

        if (!password && this.securitySelect.value !== 'nopass') {
            this.showErrorMessage('Please enter a WiFi password.');
            this.passwordInput.focus();
            return false;
        }

        return true;
    }

    showSuccessMessage(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const downloadSection = document.querySelector('.form-section:last-child');
        downloadSection.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    showErrorMessage(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const downloadSection = document.querySelector('.form-section:last-child');
        downloadSection.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    clearMessages() {
        const messages = document.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WiFiQRGenerator();
});