import fs from 'fs';

const filePath = 'src/components/Story.jsx';
let text = fs.readFileSync(filePath, 'utf8');

// Replace context methods array with updateContentData
text = text.replace(
    'const { stories, addStory, replaceStory, deleteStory } = useImageContext();',
    'const { stories, updateContentData } = useImageContext();'
);

text = text.replace(
    'addStory(saved);',
    `const newStories = [saved, ...(stories || [])];
        updateContentData('stories', newStories);`
);

text = text.replace(
    'replaceStory(editDraft);',
    `const newStories = (stories || []).map(s => s.id === editDraft.id ? editDraft : s);
        updateContentData('stories', newStories);`
);

text = text.replace(
    'deleteStory(id);',
    `const newStories = (stories || []).filter(s => s.id !== id);
        updateContentData('stories', newStories);`
);

fs.writeFileSync(filePath, text, 'utf8');
console.log("Story updated!");
