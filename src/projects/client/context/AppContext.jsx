import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AppContext = createContext();

const initialState = {
  isAuthenticated: localStorage.getItem('steelconnect_auth') === 'true',
  contacts: [],
  employees: [],
  candidates: [],
  customSteelGrades: [],
  theme: localStorage.getItem('steelconnect_theme') || 'light',
  isLoading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN':
      localStorage.setItem('steelconnect_auth', 'true');
      return { ...state, isAuthenticated: true };
    case 'LOGOUT':
      localStorage.setItem('steelconnect_auth', 'false');
      return { ...state, isAuthenticated: false };
    case 'SET_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_THEME':
      localStorage.setItem('steelconnect_theme', action.payload);
      return { ...state, theme: action.payload };

    // Contacts
    case 'ADD_CONTACT':
      return { ...state, contacts: [action.payload, ...state.contacts] };
    case 'UPDATE_CONTACT':
      return { ...state, contacts: state.contacts.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CONTACT':
      return { ...state, contacts: state.contacts.filter(c => c.id !== action.payload) };
    case 'IMPORT_CONTACTS':
      return { ...state, contacts: [...action.payload, ...state.contacts] };
    case 'CLEAR_CONTACTS':
      return { ...state, contacts: [] };

    // Employees
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [action.payload, ...state.employees] };
    case 'UPDATE_EMPLOYEE':
      return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EMPLOYEE':
      return { ...state, employees: state.employees.filter(e => e.id !== action.payload) };

    // Candidates
    case 'ADD_CANDIDATE':
      return { ...state, candidates: [action.payload, ...state.candidates] };
    case 'UPDATE_CANDIDATE':
      return { ...state, candidates: state.candidates.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CANDIDATE':
      return { ...state, candidates: state.candidates.filter(c => c.id !== action.payload) };

    // Steel Grades
    case 'ADD_GRADE':
      return { ...state, customSteelGrades: [...state.customSteelGrades, action.payload] };
    case 'DELETE_GRADE':
      return { ...state, customSteelGrades: state.customSteelGrades.filter(g => g.name !== action.payload) };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [contacts, employees, candidates, grades] = await Promise.all([
        api.getContacts(),
        api.getEmployees(),
        api.getCandidates(),
        api.getGrades()
      ]);
      dispatch({
        type: 'SET_DATA',
        payload: {
          contacts,
          employees,
          candidates,
          customSteelGrades: grades
        }
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data from server');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply the selected theme to the client portal container
  useEffect(() => {
    const el = document.querySelector('.client-app-container');
    if (el) el.classList.toggle('theme-dark', state.theme === 'dark');
  }, [state.theme]);

  // API Wrapper Actions
  const actions = {
    login: () => dispatch({ type: 'LOGIN' }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    toggleTheme: () => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' }),

    // Contacts
    addContact: async (data) => {
      const res = await api.createContact(data);
      dispatch({ type: 'ADD_CONTACT', payload: res });
      return res;
    },
    updateContact: async (id, data) => {
      const res = await api.updateContact(id, data);
      dispatch({ type: 'UPDATE_CONTACT', payload: res });
      return res;
    },
    deleteContact: async (id) => {
      await api.deleteContact(id);
      dispatch({ type: 'DELETE_CONTACT', payload: id });
    },
    importContacts: async (contacts) => {
      const saved = await api.bulkCreateContacts(contacts);
      dispatch({ type: 'IMPORT_CONTACTS', payload: saved });
      return saved;
    },
    clearContacts: async () => {
      await api.clearContacts();
      dispatch({ type: 'CLEAR_CONTACTS' });
    },

    // Employees
    addEmployee: async (data) => {
      const res = await api.createEmployee(data);
      dispatch({ type: 'ADD_EMPLOYEE', payload: res });
      return res;
    },
    updateEmployee: async (id, data) => {
      const res = await api.updateEmployee(id, data);
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: res });
      return res;
    },
    deleteEmployee: async (id) => {
      await api.deleteEmployee(id);
      dispatch({ type: 'DELETE_EMPLOYEE', payload: id });
    },

    // Candidates
    addCandidate: async (data) => {
      const res = await api.createCandidate(data);
      dispatch({ type: 'ADD_CANDIDATE', payload: res });
      return res;
    },
    updateCandidate: async (id, data) => {
      const res = await api.updateCandidate(id, data);
      dispatch({ type: 'UPDATE_CANDIDATE', payload: res });
      return res;
    },
    deleteCandidate: async (id) => {
      await api.deleteCandidate(id);
      dispatch({ type: 'DELETE_CANDIDATE', payload: id });
    },

    // Grades
    addGrade: async (name) => {
      const res = await api.addGrade(name);
      dispatch({ type: 'ADD_GRADE', payload: res });
      return res;
    },
    deleteGrade: async (name) => {
      await api.deleteGrade(name);
      dispatch({ type: 'DELETE_GRADE', payload: name });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions, refreshData: fetchData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
