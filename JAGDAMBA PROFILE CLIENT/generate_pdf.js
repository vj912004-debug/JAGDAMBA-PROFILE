import PDFDocument from 'pdfkit';
import fs from 'fs';

// Create a document
const doc = new PDFDocument({
  margin: 50,
  size: 'A4'
});

// Pipe its output somewhere, like to a file or HTTP response
doc.pipe(fs.createWriteStream('Jagdamba_System_Documentation.pdf'));

// Colors
const colors = {
  primary: '#2563eb',
  dark: '#0f172a',
  secondary: '#64748b',
  slate: '#1e293b'
};

// Header
doc.fillColor(colors.dark)
   .fontSize(24)
   .text('JAGDAMBA PROFILE', { continued: true })
   .fillColor(colors.primary)
   .text(' ERP');

doc.fontSize(10)
   .fillColor(colors.secondary)
   .text('Internal Technical Documentation | Version 1.2.0', { align: 'right' });

doc.moveDown();
doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
doc.moveDown();

// Title
doc.fillColor(colors.dark)
   .fontSize(32)
   .text('System Ecosystem & Architecture', { align: 'center' });

doc.fontSize(14)
   .fillColor(colors.secondary)
   .text('A comprehensive guide to the professional ERP and CRM platform.', { align: 'center' });

doc.moveDown(2);

// Section 1
doc.fillColor(colors.primary)
   .fontSize(18)
   .text('1. Production Workflow Lifecycle');

doc.moveDown(0.5);
doc.fillColor(colors.dark)
   .fontSize(12)
   .text('The core of Jagdamba Profile ERP is a sophisticated 11-stage state machine that tracks every order from inception to final settlement.');

doc.moveDown();
// Mocking a table
const drawRow = (label, value, y) => {
  doc.fillColor(colors.slate).fontSize(10).text(label, 70, y);
  doc.fillColor(colors.dark).fontSize(10).text(value, 300, y);
};

let tableY = doc.y;
doc.rect(50, tableY, 500, 20).fill('#f1f5f9');
doc.fillColor(colors.dark).fontSize(10).text('Workflow Stage', 70, tableY + 5);
doc.text('Primary Actor', 300, tableY + 5);
tableY += 25;

drawRow('Order & Drawing Received', 'Office Administration', tableY); tableY += 20;
drawRow('Nesting & Material Planning', 'Nesting Operator', tableY); tableY += 20;
drawRow('Production / Laser Cutting', 'Production Team', tableY); tableY += 20;
drawRow('Ready for Dispatch', 'Dispatch Manager', tableY); tableY += 20;
drawRow('Payment & Settlement', 'Accounts Department', tableY);

doc.moveDown(4);

// Section 2
doc.fillColor(colors.primary)
   .fontSize(18)
   .text('2. Technical Core: PDF Generation Engine');

doc.moveDown(0.5);
doc.fillColor(colors.dark)
   .fontSize(12)
   .text('Located in src/utils/pdfGenerator.ts, this module uses jsPDF and autoTable to generate high-fidelity business documents.');

doc.moveDown();
const features = [
  'Vector-based Layouts: Pixel-perfect clarity at any zoom level.',
  'Auto-calculating Tables: Handles dynamic line items with automated totals.',
  'Multi-part Branding: Consistent header/footer injection.',
  'DOM Capture: Uses html2canvas for complex visual reports.'
];

features.forEach(feature => {
  doc.fillColor(colors.primary).text('• ', { continued: true });
  doc.fillColor(colors.dark).text(feature);
});

doc.moveDown(2);

// Footer
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8)
     .fillColor(colors.secondary)
     .text('© 2026 Jagdamba Profile ERP Ecosystem | Confidential', 50, 780, { align: 'center' });
}

// Finalize PDF file
doc.end();

console.log('PDF generated successfully: Jagdamba_System_Documentation.pdf');
