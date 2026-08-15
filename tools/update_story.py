import re

file_path = 'src/components/Story.jsx'
with open(file_path, 'r') as f:
    text = f.read()

# Replace context destructuring
text = re.sub(r'const { stories, addStory, replaceStory, deleteStory } = useImageContext\(\);', r'const { stories, updateContentData } = useImageContext();', text)

# addStory
text = text.replace('addStory(saved);', '''
        const newStories = [saved, ...(stories || [])];
        updateContentData('stories', newStories);
''')

# replaceStory
text = text.replace('replaceStory(editDraft);', '''
        const newStories = (stories || []).map(s => s.id === editDraft.id ? editDraft : s);
        updateContentData('stories', newStories);
''')

# deleteStory
text = text.replace('deleteStory(id);', '''
        const newStories = (stories || []).filter(s => s.id !== id);
        updateContentData('stories', newStories);
''')

with open(file_path, 'w') as f:
    f.write(text)
print("Story updated!")
