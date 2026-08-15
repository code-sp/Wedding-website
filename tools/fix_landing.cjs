const fs = require('fs');
let text = fs.readFileSync('src/components/LandingPage.jsx', 'utf8');
const search = "} else if (result.user.role === 'client' && !result.user.isRegistered && result.user.access_code.startsWith('REQ')) {";
const replace = "} else if (result.requireClientRegistration) {";
text = text.split(search).join(replace);
fs.writeFileSync('src/components/LandingPage.jsx', text);
