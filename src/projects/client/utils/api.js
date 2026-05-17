import { sampleContacts, sampleEmployees, sampleCandidates, STEEL_GRADES } from '../data/seedData';

const KEYS = {
  CONTACTS: 'steelconnect_contacts',
  EMPLOYEES: 'steelconnect_employees',
  CANDIDATES: 'steelconnect_candidates',
  GRADES: 'steelconnect_grades',
};

// Helper to initialize localStorage if empty
const initStore = (key, initialData) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(initialData));
  }
};

// Initialize everything
initStore(KEYS.CONTACTS, sampleContacts);
initStore(KEYS.EMPLOYEES, sampleEmployees);
initStore(KEYS.CANDIDATES, sampleCandidates);
initStore(KEYS.GRADES, STEEL_GRADES.map(name => ({ name })));

const get = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const set = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  // Contacts
  getContacts: async () => get(KEYS.CONTACTS),
  createContact: async (data) => {
    const items = get(KEYS.CONTACTS);
    const newItem = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    set(KEYS.CONTACTS, [newItem, ...items]);
    return newItem;
  },
  updateContact: async (id, data) => {
    const items = get(KEYS.CONTACTS);
    const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
    set(KEYS.CONTACTS, updated);
    return updated.find(item => item.id === id);
  },
  deleteContact: async (id) => {
    const items = get(KEYS.CONTACTS);
    set(KEYS.CONTACTS, items.filter(item => item.id !== id));
    return true;
  },

  // Employees
  getEmployees: async () => get(KEYS.EMPLOYEES),
  createEmployee: async (data) => {
    const items = get(KEYS.EMPLOYEES);
    const newItem = { ...data, id: 'e' + Date.now(), createdAt: new Date().toISOString() };
    set(KEYS.EMPLOYEES, [newItem, ...items]);
    return newItem;
  },
  updateEmployee: async (id, data) => {
    const items = get(KEYS.EMPLOYEES);
    const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
    set(KEYS.EMPLOYEES, updated);
    return updated.find(item => item.id === id);
  },
  deleteEmployee: async (id) => {
    const items = get(KEYS.EMPLOYEES);
    set(KEYS.EMPLOYEES, items.filter(item => item.id !== id));
    return true;
  },

  // Candidates
  getCandidates: async () => get(KEYS.CANDIDATES),
  createCandidate: async (data) => {
    const items = get(KEYS.CANDIDATES);
    const newItem = { ...data, id: 'c' + Date.now(), createdAt: new Date().toISOString() };
    set(KEYS.CANDIDATES, [newItem, ...items]);
    return newItem;
  },
  updateCandidate: async (id, data) => {
    const items = get(KEYS.CANDIDATES);
    const updated = items.map(item => item.id === id ? { ...item, ...data } : item);
    set(KEYS.CANDIDATES, updated);
    return updated.find(item => item.id === id);
  },
  deleteCandidate: async (id) => {
    const items = get(KEYS.CANDIDATES);
    set(KEYS.CANDIDATES, items.filter(item => item.id !== id));
    return true;
  },

  // Grades
  getGrades: async () => get(KEYS.GRADES),
  addGrade: async (name) => {
    const items = get(KEYS.GRADES);
    const newItem = { name };
    set(KEYS.GRADES, [...items, newItem]);
    return newItem;
  },
  deleteGrade: async (name) => {
    const items = get(KEYS.GRADES);
    set(KEYS.GRADES, items.filter(item => item.name !== name));
    return true;
  },
  
  // WhatsApp Utility (Local Server)
  whatsapp: {
    getStatus: () => fetch('/api/whatsapp/status').then(r => r.json()),
    getQr: () => fetch('/api/whatsapp/qr').then(r => r.json()),
    init: () => fetch('/api/whatsapp/init', { method: 'POST' }).then(r => r.json()),
    disconnect: () => fetch('/api/whatsapp/disconnect', { method: 'POST' }).then(r => r.json()),
    sendBulk: (message, contacts) => fetch('/api/whatsapp/send-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, contacts }),
    }).then(r => r.json()),
  }
};
