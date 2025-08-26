import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (user) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_BACKEND_URL, {
    transports: ['websocket', 'polling'],
    query: {
      userId: user.id,
      companyId: user.companyId,
    },
    forceNew: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;