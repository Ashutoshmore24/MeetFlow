import { Server } from "socket.io";
import { meetingParticipants, userSocketMap } from "./roomManager.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // JOIN ROOM
    socket.on("join-room", (data) => {
      const { meetingCode, userId, fullName } = data;
      
      // Fallback validation to prevent server crashes on malformed client data
      if (!meetingCode || !userId) return; 

      socket.join(meetingCode);

      if (!meetingParticipants[meetingCode]) {
        meetingParticipants[meetingCode] = [];
      }

      const alreadyExists = meetingParticipants[meetingCode].find(
        (user) => user.socketId === socket.id
      );

      if (!alreadyExists) {
        meetingParticipants[meetingCode].push({
          userId,
          fullName,
          socketId: socket.id,
        });
      }

      socket.broadcast.to(meetingCode).emit("user-joined-alert", { fullName });
      userSocketMap[socket.id] = { meetingCode, userId };

      io.to(meetingCode).emit(
        "participants-updated",
        meetingParticipants[meetingCode]
      );
      
      console.log(`User ${fullName} joined ${meetingCode}`);
    });

    // Helper function to deduplicate structural cleanup logic
    const handleUserRemoval = (meetingCode) => {
      if (!meetingParticipants[meetingCode]) return;

      const leavingUser = meetingParticipants[meetingCode].find(
        (u) => u.socketId === socket.id
      );

      if (leavingUser) {
        socket.broadcast
          .to(meetingCode)
          .emit("user-left-alert", { fullName: leavingUser.fullName });
      }

      meetingParticipants[meetingCode] = meetingParticipants[meetingCode].filter(
        (user) => user.socketId !== socket.id
      );

      // Clean up memory if the room becomes empty
      if (meetingParticipants[meetingCode].length === 0) {
        delete meetingParticipants[meetingCode];
      } else {
        io.to(meetingCode).emit(
          "participants-updated",
          meetingParticipants[meetingCode]
        );
      }
    };

    // LEAVE ROOM
    socket.on("leave-room", ({ meetingCode, userId }) => {
      handleUserRemoval(meetingCode);
      delete userSocketMap[socket.id];
      socket.leave(meetingCode);
      console.log(`User ${userId} manually left room ${meetingCode}`);
    });

    // SEND MESSAGE
    socket.on("send-message", (data) => {
      const { meetingCode, userId, fullName, message } = data;
      
      io.to(meetingCode).emit("receive-message", {
        userId,
        fullName,
        message,
        timestamp: new Date().toISOString(), // Safe ISO string format for frontend JSON parsing
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const userData = userSocketMap[socket.id];
      if (userData) {
        handleUserRemoval(userData.meetingCode);
        delete userSocketMap[socket.id];
      }
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
