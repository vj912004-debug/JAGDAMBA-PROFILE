# Jagdamba Profile ERP - Technical Documentation

This document provides a deep dive into the technical architecture and implementation details of the Jagdamba Profile ERP system.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🏗 System Architecture

The application is built as a Modern Single Page Application (SPA) using:
- **React 18.3**: Optimized UI rendering.
- **Vite 6**: Next-generation frontend tooling.
- **Context API**: Global state management with `useReducer` for predictable transitions.
- **Prisma & Better-SQLite3**: Robust local database handling.

## 📂 Directory Structure

```text
src/
├── components/     # Reusable UI atoms and molecules
├── context/        # AppContext with state reduction logic
├── data/           # Seed data and constants
├── pages/          # Feature-based page modules (CRM, HR, Production)
├── utils/          # Logic for PDF generation, storage, and math
└── App.jsx         # Routing and layout orchestration
```

## 📜 Architectural Decision Records (ADR)

### ADR 01: Unidirectional Data Flow
**Decision**: Use `useReducer` within a Context Provider.
**Rationale**: Ensures that state updates are traceable and manageable across complex modules (e.g., updating an order status from both the Production and Accounts views).

### ADR 02: Native SQLite Integration
**Decision**: Use `Better-SQLite3` for local persistence.
**Rationale**: Provides high-performance, ACID-compliant storage for industrial data without the overhead of a remote server during offline production.

## 🚀 Future Roadmap
1. **Real-time Sync**: Implementing WebSockets for multi-user production board updates.
2. **AI-Driven Nesting**: Integration of ML models to further optimize material usage.
3. **Mobile Companion**: Native iOS/Android app for on-floor production reporting.

---
© 2026 Jagdamba Profile ERP Ecosystem | Confidential
