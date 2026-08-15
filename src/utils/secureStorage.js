import CryptoJS from 'crypto-js';

// Application Secret Key for Encryption
// In a real production environment, this should be an environment variable.
// For this client-side demo, we use a complex hardcoded string.
const SECRET_KEY = "wEdDiNg_inViTaTiOn_2025_sEcReT_kEy_!@#$";

const SecureStorage = {
    /**
     * Encrypts and saves data to localStorage
     * @param {string} key - Storage key
     * @param {any} value - Data to store (will be JSON stringified)
     */
    setItem: (key, value) => {
        try {
            const jsonValue = JSON.stringify(value);
            const encryptedVideo = CryptoJS.AES.encrypt(jsonValue, SECRET_KEY).toString();
            // Prefix to identify encrypted data just in case, though we assume all our keys use this
            localStorage.setItem(key, `SECURE_${encryptedVideo}`);
        } catch (error) {
            console.error('Error encrypting data', error);
        }
    },

    /**
     * Retrieves and decrypts data from localStorage
     * @param {string} key - Storage key
     * @returns {any} - Decrypted data or null
     */
    getItem: (key) => {
        try {
            const encryptedValue = localStorage.getItem(key);
            if (!encryptedValue) return null;

            // Check for our prefix
            if (!encryptedValue.startsWith('SECURE_')) {
                // Determine if we should handle legacy plaintext data
                // For security hardening, we might want to ignore plaintext
                // But for migration, let's try to parse it as plain JSON if migration needed.
                // Here we strict enforcement: ignore if not secured.
                return null;
            }

            const ciphertext = encryptedValue.replace('SECURE_', '');
            const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) return null;

            return JSON.parse(decryptedData);
        } catch (error) {
            console.error('Error decrypting data', error);
            return null;
        }
    },

    /**
     * Removes item from storage
     * @param {string} key 
     */
    removeItem: (key) => {
        localStorage.removeItem(key);
    },

    /**
     * Clears all storage
     */
    clear: () => {
        localStorage.clear();
    }
};

export default SecureStorage;
