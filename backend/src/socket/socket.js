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

    // --- 1. JOIN ROOM ---
    socket.on("join-room", (data) => {
      const { meetingCode, userId, fullName } = data;
      socket.join(meetingCode);

      if (!meetingParticipants[meetingCode]) {
        meetingParticipants[meetingCode] = [];
      }

      // Track by socketId to support multiple tabs gracefully
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

      // Emit using your exact event string
      io.to(meetingCode).emit(
        "participants-updated",
        meetingParticipants[meetingCode]
      );

      console.log(`User ${fullName} joined ${meetingCode}`);
    });

    // --- 2. LEAVE ROOM (MANUAL CLICK) ---
    // Moved OUTSIDE of the disconnect block so it actually listens
    socket.on("leave-room", ({ meetingCode, userId }) => {
      if (meetingParticipants[meetingCode]) {
        const leavingUser = meetingParticipants[meetingCode].find(
          (u) => u.socketId === socket.id
        );
        if (leavingUser) {
          socket.broadcast
            .to(meetingCode)
            .emit("user-left-alert", { fullName: leavingUser.fullName });
        }
        // Filter by socketId to only remove the specific instance that left
        meetingParticipants[meetingCode] = meetingParticipants[
          meetingCode
        ].filter((user) => user.socketId !== socket.id);

        io.to(meetingCode).emit(
          "participants-updated",
          meetingParticipants[meetingCode]
        );
      }

      delete userSocketMap[socket.id];
      socket.leave(meetingCode);
      console.log(`User ${userId} manually left room ${meetingCode}`);
    });

    // --- 3. DISCONNECT (TAB CLOSE / UNMOUNT) ---
    socket.on("disconnect", () => {
      const userData = userSocketMap[socket.id];

      if (userData) {
        const { meetingCode } = userData;

        if (meetingParticipants[meetingCode]) {
          const leavingUser = meetingParticipants[meetingCode].find(
            (u) => u.socketId === socket.id
          );
          if (leavingUser) {
            socket.broadcast
              .to(meetingCode)
              .emit("user-left-alert", { fullName: leavingUser.fullName });
          }
          // Safely filter out only this specific socket connection
          meetingParticipants[meetingCode] = meetingParticipants[
            meetingCode
          ].filter((user) => user.socketId !== socket.id);

          io.to(meetingCode).emit(
            "participants-updated",
            meetingParticipants[meetingCode]
          );
        }
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
