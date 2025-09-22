// WiFi QR Code Magnet Generator App
(function() {
    'use strict';
    
    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded');
        return;
    }

    // Application state
    const state = {
        ssid: '',
        password: '',
        security: 'WPA',
        greeting: '',
        instruction: 'Scan to Connect',
        shape: 'square',
        fonts: {
            greeting: 'Playfair Display, serif',
            instruction: 'Montserrat, sans-serif',
            credentials: 'Inconsolata, monospace'
        }
    };

    // DOM elements
    let elements = {};

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });

    function initializeApp() {
        try {
            // Get all DOM elements
            elements = {
                ssid: document.getElementById('ssid'),
                password: document.getElementById('password'),
                security: document.getElementById('security'),
                greeting: document.getElementById('greeting'),
                instruction: document.getElementById('instruction'),
                togglePassword: document.getElementById('togglePassword'),
                shapeInputs: document.querySelectorAll('input[name="shape"]'),
                greetingFont: document.getElementById('greetingFont'),
                instructionFont: document.getElementById('instructionFont'),
                credentialsFont: document.getElementById('credentialsFont'),
                downloadSvg: document.getElementById('downloadSvg'),
                downloadPng: document.getElementById('downloadPng'),
                qrCanvas: document.getElementById('qrCanvas'),
                magnetPreview: document.getElementById('magnetPreview'),
                greetingText: document.getElementById('greetingText'),
                instructionText: document.getElementById('instructionText'),
                credentialsText: document.getElementById('credentialsText'),
                errorMessage: document.getElementById('errorMessage')
            };

            // Verify all elements exist
            const missingElements = Object.entries(elements).filter(([key, el]) => !el && key !== 'shapeInputs');
            if (missingElements.length > 0) {
                console.error('Missing DOM elements:', missingElements.map(([key]) => key));
                return;
            }

            setupEventListeners();
            initializeFonts();
            updatePreview();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            showError('Failed to initialize application. Please refresh the page.');
        }
    }

    function setupEventListeners() {
        // Form inputs - use both input and change events to be thorough
        elements.ssid.addEventListener('input', function(e) {
            state.ssid = e.target.value.trim();
            updatePreview();
        });
        
        elements.password.addEventListener('input', function(e) {
            state.password = e.target.value;
            updatePreview();
        });
        
        elements.security.addEventListener('change', function(e) {
            state.security = e.target.value;
            updatePreview();
        });
        
        elements.greeting.addEventListener('input', function(e) {
            state.greeting = e.target.value.trim();
            updatePreview();
        });
        
        elements.instruction.addEventListener('input', function(e) {
            state.instruction = e.target.value.trim() || 'Scan to Connect';
            updatePreview();
        });

        // Password toggle
        elements.togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            togglePasswordVisibility();
        });

        // Shape selection
        elements.shapeInputs.forEach(input => {
            input.addEventListener('change', function(e) {
                state.shape = e.target.value;
                elements.magnetPreview.className = `magnet-preview ${state.shape}`;
                updatePreview();
            });
        });

        // Font selection
        elements.greetingFont.addEventListener('change', function(e) {
            state.fonts.greeting = e.target.value;
            elements.greetingText.style.fontFamily = e.target.value;
        });
        
        elements.instructionFont.addEventListener('change', function(e) {
            state.fonts.instruction = e.target.value;
            elements.instructionText.style.fontFamily = e.target.value;
        });
        
        elements.credentialsFont.addEventListener('change', function(e) {
            state.fonts.credentials = e.target.value;
            elements.credentialsText.style.fontFamily = e.target.value;
        });

        // Export buttons
        elements.downloadSvg.addEventListener('click', downloadSVG);
        elements.downloadPng.addEventListener('click', downloadPNG);
    }

    function initializeFonts() {
        // Set initial font styles
        elements.greetingText.style.fontFamily = state.fonts.greeting;
        elements.instructionText.style.fontFamily = state.fonts.instruction;
        elements.credentialsText.style.fontFamily = state.fonts.credentials;
    }

    function togglePasswordVisibility() {
        const isPassword = elements.password.type === 'password';
        elements.password.type = isPassword ? 'text' : 'password';
        elements.togglePassword.textContent = isPassword ? 'Hide' : 'Show';
    }

    function updatePreview() {
        hideError();
        
        // Update text elements
        elements.greetingText.textContent = state.greeting;
        elements.instructionText.textContent = state.instruction;
        
        // Update credentials display
        if (state.ssid) {
            const credentialsText = `Network: ${state.ssid}` + 
                (state.password && state.security !== 'nopass' ? `\nPassword: ${state.password}` : '');
            elements.credentialsText.textContent = credentialsText;
        } else {
            elements.credentialsText.textContent = '';
        }

        // Generate QR code
        generateQRCode();
    }

    function generateQRCode() {
        if (!state.ssid.trim()) {
            // Clear QR code if no SSID
            const ctx = elements.qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, elements.qrCanvas.width, elements.qrCanvas.height);
            
            // Draw placeholder
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 150, 150);
            ctx.fillStyle = '#999';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Enter SSID', 75, 70);
            ctx.fillText('to generate', 75, 90);
            ctx.fillText('QR code', 75, 110);
            return;
        }

        try {
            const wifiString = createWiFiString(state.ssid, state.password, state.security);
            console.log('Generating QR code for:', wifiString);
            
            // Clear canvas first
            const ctx = elements.qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, elements.qrCanvas.width, elements.qrCanvas.height);
            
            // Generate QR code using QRCode.toCanvas
            QRCode.toCanvas(elements.qrCanvas, wifiString, {
                width: 150,
                height: 150,
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function(error) {
                if (error) {
                    console.error('QR Code generation failed:', error);
                    showError('Failed to generate QR code. Please check your input.');
                    
                    // Show error placeholder
                    const ctx = elements.qrCanvas.getContext('2d');
                    ctx.clearRect(0, 0, 150, 150);
                    ctx.fillStyle = '#ffe6e6';
                    ctx.fillRect(0, 0, 150, 150);
                    ctx.fillStyle = '#d00';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('QR Generation', 75, 70);
                    ctx.fillText('Failed', 75, 90);
                } else {
                    console.log('QR code generated successfully');
                }
            });
        } catch (error) {
            console.error('QR Code generation error:', error);
            showError('Error generating QR code: ' + error.message);
            
            // Show error placeholder
            const ctx = elements.qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, 150, 150);
            ctx.fillStyle = '#ffe6e6';
            ctx.fillRect(0, 0, 150, 150);
            ctx.fillStyle = '#d00';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error', 75, 80);
        }
    }

    function createWiFiString(ssid, password, security) {
        // Escape special characters in WiFi string
        function escapeWiFiString(str) {
            if (!str) return '';
            return str
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/;/g, '\\;')    // Escape semicolons
                .replace(/,/g, '\\,')    // Escape commas
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/'/g, "\\'");   // Escape single quotes
        }

        const escapedSSID = escapeWiFiString(ssid);
        const escapedPassword = escapeWiFiString(password);
        
        // Format: WIFI:T:<security>;S:<ssid>;P:<password>;H:;;
        let wifiString = `WIFI:T:${security};S:${escapedSSID};`;
        
        if (security !== 'nopass' && password) {
            wifiString += `P:${escapedPassword};`;
        } else {
            wifiString += 'P:;';
        }
        
        wifiString += 'H:;;';
        
        return wifiString;
    }

    function downloadSVG() {
        if (!state.ssid.trim()) {
            showError('Please enter a network name (SSID) first.');
            return;
        }

        try {
            // Create SVG content
            const svgContent = createSVGContent();
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `wifi-magnet-${state.ssid.replace(/[^a-zA-Z0-9]/g, '-')}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('SVG download failed:', error);
            showError('Failed to download SVG. Please try again.');
        }
    }

    function downloadPNG() {
        if (!state.ssid.trim()) {
            showError('Please enter a network name (SSID) first.');
            return;
        }

        try {
            // Create a temporary canvas for high-resolution export
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 3; // Higher resolution
            
            // Set canvas size based on shape
            const size = state.shape === 'round' ? 260 * scale : 240 * scale;
            canvas.width = size;
            canvas.height = size;
            
            // Scale context for high resolution
            ctx.scale(scale, scale);
            
            // Draw magnet content
            drawMagnetContent(ctx, state.shape === 'round' ? 260 : 240);
            
            // Download
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `wifi-magnet-${state.ssid.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png', 0.95);
        } catch (error) {
            console.error('PNG download failed:', error);
            showError('Failed to download PNG. Please try again.');
        }
    }

    function createSVGContent() {
        const isRound = state.shape === 'round';
        const size = isRound ? 260 : 240;
        const qrSize = 120;
        
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
        
        // Background
        if (isRound) {
            svg += `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white" stroke="#ddd" stroke-width="1"/>`;
        } else {
            svg += `<rect width="${size}" height="${size}" fill="white" stroke="#ddd" stroke-width="1" rx="12"/>`;
        }
        
        // QR Code placeholder (would need actual QR generation for SVG)
        const qrX = (size - qrSize) / 2;
        const qrY = size / 2 - 20;
        svg += `<rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" fill="#f0f0f0" stroke="#ccc" rx="4"/>`;
        svg += `<text x="${size/2}" y="${qrY + qrSize/2}" text-anchor="middle" font-family="monospace" font-size="10" fill="#666">QR Code</text>`;
        
        // Greeting text
        if (state.greeting) {
            svg += `<text x="${size/2}" y="40" text-anchor="middle" font-family="${state.fonts.greeting}" font-size="14" font-weight="600" fill="#134252">${escapeXML(state.greeting)}</text>`;
        }
        
        // Instruction text
        svg += `<text x="${size/2}" y="${qrY + qrSize + 25}" text-anchor="middle" font-family="${state.fonts.instruction}" font-size="12" font-weight="500" fill="#626c71">${escapeXML(state.instruction)}</text>`;
        
        // Credentials text
        if (state.ssid) {
            const credY = qrY + qrSize + 45;
            svg += `<text x="${size/2}" y="${credY}" text-anchor="middle" font-family="${state.fonts.credentials}" font-size="10" fill="#626c71">Network: ${escapeXML(state.ssid)}</text>`;
            if (state.password && state.security !== 'nopass') {
                svg += `<text x="${size/2}" y="${credY + 15}" text-anchor="middle" font-family="${state.fonts.credentials}" font-size="10" fill="#626c71">Password: ${escapeXML(state.password)}</text>`;
            }
        }
        
        svg += '</svg>';
        return svg;
    }

    function drawMagnetContent(ctx, size) {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw background
        ctx.fillStyle = 'white';
        if (state.shape === 'round') {
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.fillRect(0, 0, size, size);
        }
        
        // Draw QR code from canvas
        const qrSize = 120;
        const qrX = (size - qrSize) / 2;
        const qrY = size / 2 - 20;
        
        try {
            ctx.drawImage(elements.qrCanvas, qrX, qrY, qrSize, qrSize);
        } catch (error) {
            console.warn('Could not draw QR code to canvas:', error);
        }
        
        // Draw text elements
        ctx.textAlign = 'center';
        
        // Greeting text
        if (state.greeting) {
            ctx.font = `600 14px ${state.fonts.greeting}`;
            ctx.fillStyle = '#134252';
            ctx.fillText(state.greeting, size/2, 40);
        }
        
        // Instruction text
        ctx.font = `500 12px ${state.fonts.instruction}`;
        ctx.fillStyle = '#626c71';
        ctx.fillText(state.instruction, size/2, qrY + qrSize + 25);
        
        // Credentials text
        if (state.ssid) {
            ctx.font = `400 10px ${state.fonts.credentials}`;
            ctx.fillStyle = '#626c71';
            const credY = qrY + qrSize + 45;
            ctx.fillText(`Network: ${state.ssid}`, size/2, credY);
            if (state.password && state.security !== 'nopass') {
                ctx.fillText(`Password: ${state.password}`, size/2, credY + 15);
            }
        }
    }

    function escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
    }

    function hideError() {
        elements.errorMessage.classList.add('hidden');
    }
})();