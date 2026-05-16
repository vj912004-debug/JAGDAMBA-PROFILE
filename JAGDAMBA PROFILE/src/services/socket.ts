// import { io } from 'socket.io-client';
// Removed for pure frontend version

export const socket = {
  connected: false,
  connect: () => {},
  disconnect: () => {},
  on: () => {},
  off: () => {},
  emit: () => {},
};

export const connectSocket = () => {
  console.log('Socket mock: connect');
};

export const disconnectSocket = () => {
  console.log('Socket mock: disconnect');
};
