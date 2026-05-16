import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream('Jagdamba_Detailed_Tech_Spec.pdf'));

const colors = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  dark: '#0f172a',
  secondary: '#64748b',
  slate: '#1e293b',
  light: '#f1f5f9'
};

// --- Helper Functions ---
const header = (text) => {
  doc.fillColor(colors.primary).fontSize(20).text(text).moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor(colors.primary).stroke().moveDown(1);
};

const subHeader = (text) => {
  doc.fillColor(colors.primaryDark).fontSize(14).text(text, { underline: true }).moveDown(0.5);
};

const body = (text) => {
  doc.fillColor(colors.slate).fontSize(11).text(text).moveDown(0.8);
};

const listItem = (text) => {
  doc.fillColor(colors.primary).text('• ', { continued: true });
  doc.fillColor(colors.slate).text(text).moveDown(0.3);
};

// --- Page 1: Title ---
doc.fillColor(colors.dark).fontSize(28).text('JAGDAMBA PROFILE ERP', { align: 'center' });
doc.fontSize(18).fillColor(colors.primary).text('Ultimate Technical Specification', { align: 'center' });
doc.moveDown(6);

doc.fontSize(12).fillColor(colors.secondary).text('A deep-dive into the architectural integrity, modular structure, and technological stack of the enterprise ecosystem.', { align: 'center' });
doc.moveDown(10);
doc.fontSize(10).text('Generated: May 4, 2026 | Technical Authority Edition', { align: 'center' });

doc.addPage();

// --- Page 2: Tech Stack ---
header('1. Comprehensive Tech Stack');
body('The application is engineered using a modern, multi-layered architecture designed for high performance and strict data integrity.');

subHeader('Frontend Core');
listItem('React 18.3: Component-based UI with Concurrent Rendering.');
listItem('TypeScript 5.x: Strict type definitions for enterprise-grade reliability.');
listItem('Vite 6.0: Lightning-fast build pipeline and Hot Module Replacement.');

doc.moveDown();
subHeader('Data & Persistence');
listItem('Better-SQLite3: Native SQLite driver for high-speed local data handling.');
listItem('Prisma ORM: Type-safe database client and schema management.');
listItem('Context API: Unidirectional data flow for global state orchestration.');

doc.moveDown();
subHeader('UI/UX System');
listItem('Tailwind CSS 4: Utility-first styling with high-impact design tokens.');
listItem('Lucide React: Vector-based iconography for visual clarity.');
listItem('Framer Motion: Advanced micro-interactions and transitions.');

doc.addPage();

// --- Page 3: Modules ---
header('2. Module Encyclopedia');

subHeader('A. Order Management & CRM');
body('Manages the entire sales lifecycle from initial lead to Purchase Order generation.');
listItem('CRM: Industry-specific client database with interaction logging.');
listItem('Order Logic: Dynamic line-item calculation with real-time tax/total updates.');

doc.moveDown();
subHeader('B. Production ERP');
body('The core workflow engine tracking orders through 11 physical manufacturing stages.');
listItem('Stages 1-3: Nesting & Planning (Optimization logic).');
listItem('Stages 4-7: Laser & Plasma Processing (Production tracking).');
listItem('Stages 8-11: Dispatch, Logistics, and Final Reconciliation.');

doc.moveDown();
subHeader('C. HR & Logistics');
body('Enterprise Resource Planning for human and physical capital.');
listItem('Staffing: Departmental silos (Office, Production, Accounts).');
listItem('Fleet: Vehicle capacity tracking and transporter performance logs.');

doc.addPage();

// --- Page 4: Data Models ---
header('3. Data Models & Interfaces');
body('The system architecture relies on standardized TypeScript interfaces.');

const codeBlock = (text) => {
  const y = doc.y;
  doc.rect(50, y, 500, 100).fill(colors.dark);
  doc.fillColor('#d1d5db').fontSize(9).text(text, 60, y + 10);
  doc.moveDown(6);
};

subHeader('Order Entity Schema');
codeBlock(`interface Order {
  id: string;
  orderNo: string;
  partyName: string;
  items: OrderItem[];
  status: 'PENDING' | 'PRODUCTION' | 'DISPATCHED';
  handledBy: string;
}`);

doc.moveDown(4);
subHeader('Staff Entity Schema');
codeBlock(`interface Employee {
  id: string;
  name: string;
  department: 'OFFICE' | 'PRODUCTION' | 'ACCOUNTS';
  skills: string[];
  status: 'ACTIVE' | 'ON_LEAVE';
}`);

// --- Footer for all pages ---
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).fillColor(colors.secondary).text(`Jagdamba Profile ERP | Page ${i + 1} of ${range.count}`, 50, 800, { align: 'center' });
}

doc.end();
console.log('Advanced PDF generated: Jagdamba_Detailed_Tech_Spec.pdf');
