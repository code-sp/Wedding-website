const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1_500_000;

const estimateDataUrlBytes = (dataUrl) => {
    const base64 = String(dataUrl).split(',')[1] || '';
    return Math.ceil((base64.length * 3) / 4);
};

/**
 * Compress a browser image into a bounded data URL.
 * The persistence layer later materializes this into a dedicated asset URL.
 */
export const compressImage = (file, maxWidth = 800, quality = 0.72) => {
    return new Promise((resolve, reject) => {
        if (!(file instanceof File)) {
            reject(new Error('No image file selected'));
            return;
        }
        if (!ALLOWED_TYPES.has(file.type)) {
            reject(new Error('Only JPEG, PNG and WebP images are supported'));
            return;
        }
        if (!file.size || file.size > MAX_INPUT_BYTES) {
            reject(new Error('Image must be smaller than 20 MB'));
            return;
        }

        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Unable to read image file'));
        reader.onload = (event) => {
            const img = new Image();

            img.onerror = () => reject(new Error('The selected image could not be decoded'));
            img.onload = () => {
                try {
                    const scale = Math.min(1, maxWidth / Math.max(1, img.width));
                    let width = Math.max(1, Math.round(img.width * scale));
                    let height = Math.max(1, Math.round(img.height * scale));
                    let currentQuality = Math.min(0.9, Math.max(0.45, quality));

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { alpha: true });
                    if (!ctx) throw new Error('Image processing is unavailable in this browser');

                    let output = '';
                    for (let attempt = 0; attempt < 7; attempt += 1) {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.clearRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);

                        // WebP preserves transparency while substantially reducing large PNG payloads.
                        output = canvas.toDataURL('image/webp', currentQuality);
                        if (!output.startsWith('data:image/webp')) {
                            output = canvas.toDataURL('image/jpeg', currentQuality);
                        }

                        if (estimateDataUrlBytes(output) <= MAX_OUTPUT_BYTES) {
                            resolve(output);
                            return;
                        }

                        width = Math.max(1, Math.round(width * 0.84));
                        height = Math.max(1, Math.round(height * 0.84));
                        currentQuality = Math.max(0.45, currentQuality - 0.08);
                    }

                    reject(new Error('Image is still too large after compression'));
                } catch (error) {
                    reject(error instanceof Error ? error : new Error('Image compression failed'));
                }
            };

            img.src = event.target?.result;
        };

        reader.readAsDataURL(file);
    });
};
