import { io } from "socket.io-client";

let socket;

export function connectSocket() {
  const token = localStorage.getItem("connecthub_token");

  if (!token) return null;

  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { token },
      autoConnect: false,
    });

    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
