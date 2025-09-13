import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "https://task-management-ffe9.onrender.com";

// Debug: Log the socket URL
console.log('Socket URL:', URL);

export const socket = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"), // Adjust based on your auth setup
  },
});

// Debug: Log connection status
socket.on('connect', () => {
  console.log('Socket connected to:', URL);
});
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});
