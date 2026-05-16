# JAGDAMBA PROFILE ERP - Project Documentation

## 1. Overview
JAGDAMBA PROFILE ERP is a comprehensive, high-performance web application designed for managing steel cutting and profile production workflows. The system is built with a **Frontend-Only Architecture**, utilizing the browser's local storage for data persistence, making it fast, secure, and easy to deploy without complex backend dependencies.

## 2. Core Workflows

### A. Sales & Order Lifecycle
1.  **Order Entry**: The "Office Entry" or "Admin" creates a new Sales Order.
    *   Capture party details, delivery dates, and payment terms.
    *   Add job items with specific dimensions (Thickness, Width, Length).
    *   **Pricing**: Supports both "Nos" (per piece) and "Kg" (by weight) pricing models.
2.  **Order Acknowledgement**: Generate and print/download a professional PDF acknowledgement for the customer.

### B. Production Management
1.  **Production List**: Supervisors view all active orders and their items.
    *   **Assignment**: Assign specific workers to items.
    *   **Tracking**: View real-time progress (Total vs Completed).
    *   **Details**: Drill down into individual items to see precise dimensions (Thk x W x L).
2.  **Status Updates**: Workers or Supervisors mark items as "In Progress" or "Completed".

### C. Logistics & Fulfillment
1.  **Dispatch**: Once items are "Ready", the Dispatch team records the delivery.
    *   Enter vehicle numbers and remarks.
    *   Supports partial dispatches (e.g., 10 items out of 100).
2.  **Auto-Challan**: Upon dispatch, the system **automatically generates a Challan** with calculated GST and due dates, ensuring the Accounts department has immediate visibility.

### D. Procurement (Purchase)
1.  **Purchase Order**: Create POs for raw materials (Plates, Sheets).
2.  **Material Receipt (GRL)**: Record incoming materials.
    *   The system tracks "Theoretical Weight" vs "Actual Weight".
    *   Detailed Goods Receipt List (GRL) reports are available for audit.

## 3. Modules

| Module | Description | Primary Users |
| :--- | :--- | :--- |
| **Dashboard** | Real-time overview of orders, pending jobs, and urgent deliveries. | All |
| **Order Entry** | Detailed form for creating sales orders with item-level specs. | Office, Admin |
| **Production List** | High-density grid for tracking and updating production work. | Supervisor, Operator |
| **Plate Tracking** | Inventory management for steel plates and scrap. | Production |
| **Dispatch** | Interface for recording item dispatches and logistics. | Dispatch, Admin |
| **Challan** | Billing and payment tracking for dispatched orders. | Accounts, Admin |
| **Purchase Order** | Procurement management for raw materials. | Office, Admin |
| **Alert Center** | Security audit trail and real-time security alerts. | Admin |

## 4. Security & Audit System

### Role-Based Access Control (RBAC)
The system enforces strict access based on roles:
-   **Admin**: Full access to all modules, including the Alert Center and financial reports.
-   **Office Entry**: Create orders and purchase records.
-   **Production Supervisor**: Manage assignments and production tracking.
-   **Dispatch / Accounts**: Focused access to logistics and billing.

### Activity Logs & Red Alerts
-   **Audit Trail**: Every change (quantity edits, status updates) is recorded in a permanent activity log with the user's name and timestamp.
-   **Red Alerts**: Triggered automatically for sensitive actions (e.g., reducing a completed quantity or rolling back a dispatch).
-   **Alert Center**: A dedicated Admin dashboard to monitor security and verify data integrity.

## 5. Technical Specifications
-   **Framework**: React (Vite)
-   **Language**: TypeScript (Strict Typing)
-   **Styling**: Tailwind CSS with custom premium UI components.
-   **Persistence**: Browser LocalStorage (No database server required).
-   **Reporting**: `jsPDF` for generating landscape reports (up to 20 columns) and professional invoices.

## 6. How to Use
1.  **Login**: Use your assigned role to access specific modules.
2.  **Search & Filter**: Every list (Production, Purchase, Challan) includes advanced filtering to find data quickly.
3.  **PDF Export**: Click the "PDF Report" or "Download" buttons on any report page to generate high-quality documents for offline use.
