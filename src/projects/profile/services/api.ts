// import axios from 'axios';
// Removed for pure frontend version

const api = {
  get: () => Promise.reject('Backend removed. Using local storage.'),
  post: () => Promise.reject('Backend removed. Using local storage.'),
  put: () => Promise.reject('Backend removed. Using local storage.'),
  patch: () => Promise.reject('Backend removed. Using local storage.'),
  delete: () => Promise.reject('Backend removed. Using local storage.'),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  }
};

export default api;
