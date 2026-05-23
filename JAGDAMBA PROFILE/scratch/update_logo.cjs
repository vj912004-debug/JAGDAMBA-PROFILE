const fs = require('fs');

const logoPath = 'd:/j/JAGDAMBA PROFILE/public/logo.png';
const pdfGenPath = 'd:/j/JAGDAMBA PROFILE/src/utils/pdfGenerator.ts';

// Read logo and convert to base64
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

// Read pdfGenerator
let content = fs.readFileSync(pdfGenPath, 'utf8');

// Replace all base64 images with the new logo data URI
const before = content.length;
content = content.replace(/src="data:image\/png;base64,[^"]+"/g, `src="${logoDataUri}"`);
const after = content.length;

fs.writeFileSync(pdfGenPath, content, 'utf8');
console.log(`Replaced successfully! File size changed from ${before} to ${after} bytes.`);
console.log(`Logo base64 size: ${logoBase64.length} chars`);
