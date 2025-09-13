import { io } from "socket.io-client";

const URL = import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const socket = io(URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"), // Adjust based on your auth setup
  },
});
