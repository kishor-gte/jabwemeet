const fs = require('fs');
const file = 'backend/utils/mailer.js';
let content = fs.readFileSync(file, 'utf8');

// Replace standard html brand tags
content = content.replace(/<div class="brand">JabWe<span>Meet<\/span> 🥂<\/div>/g, '<div class="brand">JabWe<span>Meet</span> 🥂</div>');

// Replace CSS styles to make it brand colored
content = content.replace(/\.brand \{ font-size:26px; font-weight:900; color:#ffffff;/g, '.brand { font-size:26px; font-weight:900; color:#ffffff;'); // Jab and Meet are white
content = content.replace(/\.brand span \{ color:#ec4899; \}/g, '.brand span { color:#e06d53; }'); // We is orange

// Wait, the user said it is "not visible in that color". If their email client forces a white background, white text is invisible.
// To fix this, let's just make the whole text the primary brand color #e06d53 so it's visible on ANY background (black or white)!
content = content.replace(/\.brand \{ font-size:26px; font-weight:900; color:#ffffff;/g, '.brand { font-size:26px; font-weight:900; color:#e06d53;'); 
content = content.replace(/\.brand span \{ color:#ec4899; \}/g, '.brand span { color:#e06d53; }'); 
content = content.replace(/color:#ec4899/g, 'color:#e06d53'); 

fs.writeFileSync(file, content);
console.log('Fixed mailer colors in ' + file);
