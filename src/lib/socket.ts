import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string): Socket {
  // Reuse if same token and socket is alive (connected OR connecting)
  if (socket && currentToken === token && !socket.disconnected) {
    return socket;
  }

  // Disconnect old socket if token changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  // Use window.location.origin so the socket always connects back to wherever
  // the page was served from — works on localhost, local IP, and production
  const serverUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  socket = io(serverUrl, {
    path: "/api/socket",
    auth: { token },
    transports: ["polling", "websocket"], // polling first to avoid dev server issues
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}

export function getExistingSocket(): Socket | null {
  return socket;
}
