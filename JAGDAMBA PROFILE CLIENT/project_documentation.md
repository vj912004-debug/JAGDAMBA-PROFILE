# Jagdamba Profile ERP - System Documentation

Jagdamba Profile ERP is a comprehensive, professional management system designed for industrial profile cutting and production workflows.

## 🛠 Technology Stack
- **Frontend**: React 18 (TypeScript) with Vite
- **Styling**: Tailwind CSS 4 for a modern, responsive UI
- **State Management**: React Context API
- **Document Engine**: jsPDF, AutoTable, and html2canvas
- **Backend/Storage**: Better-SQLite3 for robust data persistence

## 📋 Core Modules

### 1. Order Management & CRM
- **CRM Portal**: Detailed industry contact database with segmentation.
- **Order Entry**: Advanced forms supporting multi-item orders and drawing attachments.
- **PO Generation**: Professional PDF acknowledgments for customers.

### 2. Production & Material Workflow
The system tracks orders through a rigorous 11-stage process:
1. **Order Received**: Initial entry and drawing upload.
2. **Nesting**: Optimization of material usage.
3. **Cutting**: Real-time progress tracking of laser/plasma cutting.
4. **Ready for Dispatch**: Quality check and packaging.
5. **Dispatch & Logistics**: Vehicle tracking and Challan generation.
6. **Payment**: Final billing and settlement.

### 3. Material & Stock Tracking
- **Heat Number Tracking**: Full traceability of raw material (MS, SS, Alloy).
- **Usage Logs**: Automated weight consumption and scrap calculation.
- **Worker Performance**: Billing and productivity analysis per operator.

## 📄 Document Generation (`pdfGenerator.ts`)
The system features a custom-built PDF engine producing high-fidelity documents:
- **Delivery Challans**: GST-compliant layouts with automated weight totals.
- **Purchase Orders**: Detailed line-item acknowledgments.
- **Production Reports**: Management summaries for operational oversight.

## 🌐 Localization
The system supports **English** and **Gujarati**, ensuring smooth operation for staff at all levels.

---
© 2026 Jagdamba Profile ERP
