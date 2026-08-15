import fs from 'fs';

const filePath = 'src/components/Events.jsx';
let text = fs.readFileSync(filePath, 'utf8');

text = text.replace(
    'const { events, addEvent, updateEvent, deleteEvent } = useImageContext();',
    'const { events, updateContentData } = useImageContext();'
);

text = text.replace(
    'addEvent(newEvent);',
    `const newEvents = [newEvent, ...(events || [])];
        updateContentData('events', newEvents);`
);

text = text.replace(
    'updateEvent(activeEvent.id, activeEvent);',
    `const newEvents = (events || []).map(e => e.id === activeEvent.id ? activeEvent : e);
        updateContentData('events', newEvents);`
);

text = text.replace(
    'deleteEvent(id);',
    `const newEvents = (events || []).filter(e => e.id !== id);
        updateContentData('events', newEvents);`
);

// We should also replace the `updateEvent` where it's used with `updatedPhoto`.
text = text.replace(
    /updateEvent\(([^,]+),\s*([^)]+)\);/g,
    `const newEvents = (events || []).map(e => e.id === $1 ? $2 : e);
        updateContentData('events', newEvents);`
);

fs.writeFileSync(filePath, text, 'utf8');
console.log("Events updated!");
