const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
    ...pkg.scripts,
    "start": "concurrently \"npm run server\" \"npm run dev\""
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
