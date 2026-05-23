const fs = require('fs');

// Read the logo and convert to base64
const logoPath = 'd:/j/JAGDAMBA PROFILE/public/logo.png';
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

// Read ChallanPrint.tsx
const challanPath = 'd:/j/JAGDAMBA PROFILE/src/components/ChallanPrint.tsx';
let content = fs.readFileSync(challanPath, 'utf8');

// Replace all /logo.png references with inline base64
const before = (content.match(/src="\/logo\.png"/g) || []).length;
content = content.replace(/src="\/logo\.png"/g, `src="${logoDataUri}"`);
const after = (content.match(/src="data:image\/png;base64,/g) || []).length;

fs.writeFileSync(challanPath, content, 'utf8');
console.log(`Replaced ${before} occurrences of /logo.png with base64 data URI (${after} replacements)`);
console.log(`File size: ${Buffer.byteLength(content, 'utf8')} bytes`);
