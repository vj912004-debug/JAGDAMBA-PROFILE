// Storage utility
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(`steelconnect_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Storage save error:', e);
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(`steelconnect_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Storage load error:', e);
    return defaultValue;
  }
};

export const clearStorage = () => {
  Object.keys(localStorage)
    .filter(k => k.startsWith('steelconnect_'))
    .forEach(k => localStorage.removeItem(k));
};
