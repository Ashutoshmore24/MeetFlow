import { Server } from "socket.io";
import { meetingParticipants, userSocketMap } from "./roomManager.js";
import ENV from "../lib/env.js";
import Meeting from "../models/Meeting.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ENV.CLIENT_URL,
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

      // Remove any stale entry for this socket (e.g. from a reconnect)
      meetingParticipants[meetingCode] = meetingParticipants[meetingCode].filter(
        (user) => user.socketId !== socket.id
      );

      meetingParticipants[meetingCode].push({
        userId,
        fullName,
        socketId: socket.id,
      });

      socket.broadcast.to(meetingCode).emit("user-joined-alert", { fullName });
      userSocketMap[socket.id] = { meetingCode, userId, fullName };

      // Send roster update to ALL users (for participant list display only)
      io.to(meetingCode).emit(
        "participants-updated",
        meetingParticipants[meetingCode]
      );

      // Tell EXISTING users to initiate WebRTC offers to the new joiner
      // Only existing users should create offers to prevent dual-offer glare
      socket.broadcast.to(meetingCode).emit("new-peer-joined", {
        socketId: socket.id,
        userId,
        fullName,
      });
      
      console.log(`User ${fullName} joined ${meetingCode}`);
    });

    // Helper function to deduplicate structural cleanup logic
    const handleUserRemoval = async (meetingCode) => {
      if (!meetingParticipants[meetingCode]) return;

      const leavingUser = meetingParticipants[meetingCode].find(
        (u) => u.socketId === socket.id
      );

      if (leavingUser) {
        socket.broadcast
          .to(meetingCode)
          .emit("user-left-alert", { fullName: leavingUser.fullName });

        // Notify remaining peers to immediately close the WebRTC connection
        // to this socket (faster cleanup than waiting for participants-updated diff)
        socket.broadcast
          .to(meetingCode)
          .emit("peer-left", { socketId: socket.id });
      }

      meetingParticipants[meetingCode] = meetingParticipants[meetingCode].filter(
        (user) => user.socketId !== socket.id
      );

      // Clean up memory if the room becomes empty
      if (meetingParticipants[meetingCode].length === 0) {
        delete meetingParticipants[meetingCode];

        // Auto-end the meeting in the database so it appears in history
        try {
          await Meeting.findOneAndUpdate(
            { meetingCode, status: { $in: ["active", "scheduled"] } },
            { status: "ended", endedAt: new Date() }
          );
          console.log(`Meeting ${meetingCode} auto-ended (room empty)`);
        } catch (err) {
          console.error(`Error auto-ending meeting ${meetingCode}:`, err);
        }
      } else {
        io.to(meetingCode).emit(
          "participants-updated",
          meetingParticipants[meetingCode]
        );
      }
    };

    // LEAVE ROOM
    socket.on("leave-room", async ({ meetingCode, userId }) => {
      await handleUserRemoval(meetingCode);
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

    
    // WEBRTC SIGNALING RELAY EVENTS
   
    // 1. Relay connection offer from a new user to a specific existing user
    socket.on("webrtc-offer", ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit("webrtc-offer", {
        senderSocketId: socket.id,
        offer,
      });
    });

    // 2. Relay the answer back to the user who initiated the connection
    socket.on("webrtc-answer", ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit("webrtc-answer", {
        senderSocketId: socket.id,
        answer,
      });
    });

    // 3. Relay network route routing info (ICE candidates) between specific peers
    socket.on("webrtc-ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("webrtc-ice-candidate", {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // DISCONNECT
    socket.on("disconnect", async () => {
      const userData = userSocketMap[socket.id];
      if (userData) {
        await handleUserRemoval(userData.meetingCode);
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
