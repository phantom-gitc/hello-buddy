import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (!socket || !socket.connected) {
    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
