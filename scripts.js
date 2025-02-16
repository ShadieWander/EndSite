document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.url-link, .button-link, .channel-link, nav a[data-target]');
    const contents = document.querySelectorAll('.content');

    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            if (targetId) {
                contents.forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetId).classList.add('active');
            } else if (this.href) {
                window.open(this.href, '_blank');
            }
        });
        link.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        });
    });

    document.getElementById('downloads').classList.add('active');

    async function encrypt() {
        const plaintext = document.getElementById('plaintext').value;
        const password = document.getElementById('encryptPassword').value;

        const ciphertext = await AdvancedAES.encode(plaintext, password);
        displayResult('Encrypted Text', ciphertext);
    }

    async function decrypt() {
        const ciphertext = document.getElementById('ciphertext').value;
        const password = document.getElementById('decryptPassword').value;

        const plaintext = await AdvancedAES.decode(ciphertext, password);
        displayResult('Decrypted Text', plaintext);
    }

    function displayResult(label, text) {
        const resultContainer = document.getElementById('result-container');
        const resultLabel = document.getElementById('result-label');
        const resultText = document.getElementById('result-text');
        const resultBox = document.getElementById('result-box');

        resultLabel.textContent = label;
        resultText.textContent = text;

        resultBox.style.height = 'auto';
        const height = resultBox.scrollHeight + 'px';
        resultBox.style.height = height;

        resultContainer.classList.remove('hidden');
    }

    function downloadFile(filename, content) {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
    }

    const AdvancedAES = {
        async encode(plaintext, password) {
            const encoder = new TextEncoder();
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await this.deriveKey(password, salt);
            const alg = { name: 'AES-GCM', iv: iv };

            const encryptedContent = await crypto.subtle.encrypt(alg, key, encoder.encode(plaintext));

            const encryptedBytes = new Uint8Array(encryptedContent);
            const ciphertext = new Uint8Array(iv.length + salt.length + encryptedBytes.length);
            ciphertext.set(iv, 0);
            ciphertext.set(salt, iv.length);
            ciphertext.set(encryptedBytes, iv.length + salt.length);

            return this.customEncode(ciphertext);
        },

        async decode(ciphertext, password) {
            const data = this.customDecode(ciphertext);
            const iv = data.slice(0, 12);
            const salt = data.slice(12, 28);
            const encryptedBytes = data.slice(28);
            const key = await this.deriveKey(password, salt);
            const alg = { name: 'AES-GCM', iv: iv };

            const decryptedContent = await crypto.subtle.decrypt(alg, key, encryptedBytes);
            const decoder = new TextDecoder();

            return decoder.decode(decryptedContent);
        },

        async deriveKey(password, salt) {
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveKey']
            );
            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 200000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        },

        customEncode(data) {
            return btoa(String.fromCharCode.apply(null, data));
        },

        customDecode(data) {
            return new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));
        }
    };
});