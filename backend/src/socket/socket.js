import { Server } from "socket.io";

let io;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`A User Connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`A User Disconnected: ${socket.id}`);
    });
  });
};

// Access io instance from anywhere
export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.io not initialized. Call initializeSocket(server) first."
    );
  }

  return io;
};