const fs = require('fs');

const path = 'src/context/ImageContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// I will create a generalized data update function
const addGen = `
    const updateContent = async (key, data, isArray = true) => {
        try {
            await api.post(\`/api/content/\${key}\`, data);
            
            // Map keys back to state setters
            if (key === 'gallery') setGalleryPhotos(data);
            if (key === 'moments') setMomentsPhotos(data);
            if (key === 'events') setEvents(data);
            if (key === 'stories') setStories(data);
        } catch (error) {
            console.error(\`Failed to update \${key}:\`, error);
        }
    };
`;

// It might be too complex to replace everything automatically using regex. I will rewrite ImageContext using Node.
// Actually, it's better to just write the file completely if I know its structure, or use `edit_file` / `replace_string_in_file`.
