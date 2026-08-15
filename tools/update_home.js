import fs from 'fs';

const filePath = 'src/components/Home.jsx';
let text = fs.readFileSync(filePath, 'utf8');

text = text.replace(
    'const { homeData, updateHomeData } = useImageContext();',
    'const { homeData, updateContentData } = useImageContext();'
);

text = text.replace(
    /updateHomeData\(([^)]+)\);/g,
    `updateContentData('home_data', $1);`
);

fs.writeFileSync(filePath, text, 'utf8');
console.log("Home updated!");
