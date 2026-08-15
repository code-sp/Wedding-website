import fs from 'fs';

const path = 'src/context/ImageContext.jsx';
let content = fs.readFileSync(path, 'utf8');

const newMethod = `
    // --- GENERALIZED SYNC METHOD ---
    const updateContentData = async (key, payload) => {
        try {
            await api.post(\`/api/content/\${key}\`, payload);
            if (key === 'gallery') setGalleryPhotos(payload);
            if (key === 'moments') setMomentsPhotos(payload);
            if (key === 'events') setEvents(payload);
            if (key === 'stories') setStories(payload);
            if (key === 'home_data') setHomeData(payload);
            if (key === 'contact_data') setContactData(payload);
        } catch (error) {
            console.error(\`Failed to update \${key} data:\`, error);
            throw error;
        }
    };
`;

const splitStr = "    const addEvent = (newEvent) => {";
if (content.includes(splitStr)) {
    content = content.replace(splitStr, newMethod + "\n" + splitStr);
    content = content.replace("deleteRsvpSubmission", "deleteRsvpSubmission,\n        updateContentData");
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated ImageContext.jsx");
} else {
    console.log("Could not find addEvent boundary");
}
