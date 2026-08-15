import fs from 'fs';

const filePath = 'src/components/Contact.jsx';
let text = fs.readFileSync(filePath, 'utf8');

text = text.replace(
    'const { contactData, updateContactData } = useImageContext();',
    'const { contactData, updateContentData } = useImageContext();'
);

text = text.replace(
    /updateContactData\(([^)]+)\);/g,
    `updateContentData('contact_data', $1);`
);

fs.writeFileSync(filePath, text, 'utf8');
console.log("Contact updated!");
