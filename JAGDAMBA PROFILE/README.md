# Jagdamba Profile ERP - Documentation

Jagdamba Profile ERP is a comprehensive, professional management system designed for industrial profile cutting and production workflows. It handles everything from order entry and material tracking to production status and final delivery challans.

---

## 🛠 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API (custom `AppProvider`)
- **Persistence**: Browser LocalStorage (with data seeding support)
- **PDF Generation**: `jsPDF`, `jspdf-autotable`, and `html2canvas`
- **Icons**: `lucide-react`

---

## 🏗 Project Structure

```text
src/
├── components/      # Reusable UI components (Sidebar, Navbar, Stats Cards, etc.)
├── pages/           # Core application pages (Dashboard, OrderEntry, Reports, etc.)
├── store/           # Context API and global state logic
├── utils/           # Helper functions (PDF generation, excel exports)
├── App.tsx          # Main application routing and layout
└── main.tsx         # Application entry point
```

---

## 👥 User Roles & Permissions

The system supports role-based access control to ensure departmental security:

| Role | Responsibilities |
| :--- | :--- |
| **Admin** | Full system access, settings, and advanced reports. |
| **Office Entry** | Creating orders, managing customer details. |
| **Production Supervisor** | Managing production status and assigning workers. |
| **Nesting Operator** | Marking nesting status and plate usage. |
| **Dispatch** | Recording dispatches and generating delivery notes. |
| **Accounts User** | Handling challans and payment tracking. |

---

## ⚙️ Core Modules

### 1. Order Entry System
- **Comprehensive Form**: Capture party details, delivery dates, and urgency.
- **Line Items**: Add multiple items per order with specific cutting types (CNC, Circle, Square, etc.), material grades, and dimensions.
- **Drawing Support**: Track drawing numbers and associated files.
- **PDF Acknowledgment**: Generate professional PO/Order Acknowledgments instantly.

### 2. Production Workflow
The application tracks orders through 11 distinct stages:
1. `Order Received`
2. `Drawing Received`
3. `Nesting Pending`
4. `Nesting Done`
5. `Production Pending`
6. `Cutting In Process`
7. `Ready` (for Dispatch)
8. `Dispatch Done`
9. `Challan Done`
10. `Payment Pending`
11. `Payment Received`

### 3. Material & Plate Tracking
- **Stock Management**: Track raw material plates by Grade, Thickness, and Heat Number.
- **Usage Tracking**: Log weight used from specific plates against orders.
- **Scrap Management**: Track whether scrap belongs to the company or the customer.

### 4. Dispatch & Challan
- **Dispatch Module**: Record partial or full dispatches with vehicle numbers.
- **Challan Generation**: Create professional, GST-compliant Delivery Challans with automated calculation of taxes and balances.
- **PDF Export**: Modern, branded PDF layouts for all customer-facing documents.

### 5. Reporting & Analytics
- **Live Dashboard**: High-level overview of pending jobs, urgent orders, and stock balance.
- **Advanced Reports**: Filterable views for Challan History, Worker-wise performance, and Purchase summaries.
- **Excel Export**: Download report data for offline analysis.

---

## 📄 PDF Generation System (`pdfGenerator.ts`)

The system uses a custom PDF engine to ensure all generated documents look professional:

- **`generateChallanPDF`**: Generates a branded Delivery Challan with borders, headers, and signature sections.
- **`generateOrderEntryPDF`**: Creates a detailed Purchase Order/Acknowledgment.
- **`downloadPDF`**: A utility to capture any UI element (like a report or chart) and save it as a high-resolution PDF.

---

## 🌐 Multi-Language Support

The ERP is fully localized for:
- **English**
- **Gujarati** (ગુજરાતી)

Users can toggle languages from the top navigation bar to suit their preference.

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 💾 Data Persistence

Data is currently managed via **LocalStorage**, allowing for:
- Offline usage within a single browser.
- Data persistence across sessions.
- Automatic generation of the next Order, Challan, and PO numbers.
