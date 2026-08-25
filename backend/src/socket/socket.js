import { Server } from "socket.io";
import { meetingParticipants, userSocketMap, meetingHosts, lobbyEnabled, lobbyQueue } from "./roomManager.js";
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

    // ─── Helper: resolve host for a meeting code (DB lookup, cached) ──
    const resolveHost = async (meetingCode) => {
      if (!meetingHosts[meetingCode]) {
        try {
          const meeting = await Meeting.findOne({ meetingCode }).select("host").lean();
          if (meeting?.host) {
            meetingHosts[meetingCode] = meeting.host.toString();
          }
        } catch (err) {
          console.error(`Error looking up host for ${meetingCode}:`, err);
        }
      }
      return meetingHosts[meetingCode];
    };

    // ─── Helper: fully admit a user into the meeting room ────────────
    const admitUser = (meetingCode, userId, fullName, userSocketId, userIsHost) => {
      const targetSocket = io.sockets.sockets.get(userSocketId);
      if (!targetSocket) return;

      targetSocket.join(meetingCode);

      if (!meetingParticipants[meetingCode]) {
        meetingParticipants[meetingCode] = [];
      }

      // Remove stale entry
      meetingParticipants[meetingCode] = meetingParticipants[meetingCode].filter(
        (user) => user.socketId !== userSocketId
      );

      meetingParticipants[meetingCode].push({
        userId,
        fullName,
        socketId: userSocketId,
        isHost: userIsHost,
      });

      userSocketMap[userSocketId] = { meetingCode, userId, fullName };

      // Notify everyone about the new participant
      targetSocket.broadcast.to(meetingCode).emit("user-joined-alert", { fullName });

      io.to(meetingCode).emit(
        "participants-updated",
        meetingParticipants[meetingCode]
      );

      // Tell existing users to create WebRTC offers to the new joiner
      targetSocket.broadcast.to(meetingCode).emit("new-peer-joined", {
        socketId: userSocketId,
        userId,
        fullName,
      });

      console.log(`User ${fullName} admitted to ${meetingCode}${userIsHost ? ' (host)' : ''}`);
    };

    // ─── Helper: get host socket id ──────────────────────────────────
    const getHostSocketId = (meetingCode) => {
      const hostUserId = meetingHosts[meetingCode];
      if (!hostUserId) return null;
      const hostEntry = meetingParticipants[meetingCode]?.find(
        (u) => u.userId === hostUserId
      );
      return hostEntry?.socketId || null;
    };

    // ─── Helper: check if the requesting socket belongs to the host ──
    const isHostSocket = (meetingCode) => {
      const hostUserId = meetingHosts[meetingCode];
      if (!hostUserId) return false;
      const userData = userSocketMap[socket.id];
      return userData && userData.userId === hostUserId;
    };

    // ═══════════════════════════════════════════════════════════════════
    // JOIN ROOM
    // ═══════════════════════════════════════════════════════════════════
    socket.on("join-room", async (data) => {
      const { meetingCode, userId, fullName } = data;
      
      // Fallback validation to prevent server crashes on malformed client data
      if (!meetingCode || !userId) return; 

      const hostUserId = await resolveHost(meetingCode);
      const userIsHost = hostUserId === userId;

      // If user is the host → always admit directly
      if (userIsHost) {
        admitUser(meetingCode, userId, fullName, socket.id, true);

        // Send current lobby state to the host
        socket.emit("lobby-status-changed", {
          enabled: !!lobbyEnabled[meetingCode],
        });
        socket.emit("lobby-queue-updated", lobbyQueue[meetingCode] || []);
        return;
      }

      // If lobby is enabled → put non-host users in the waiting queue
      if (lobbyEnabled[meetingCode]) {
        if (!lobbyQueue[meetingCode]) {
          lobbyQueue[meetingCode] = [];
        }

        // Remove any stale entry for this socket
        lobbyQueue[meetingCode] = lobbyQueue[meetingCode].filter(
          (u) => u.socketId !== socket.id
        );

        lobbyQueue[meetingCode].push({
          userId,
          fullName,
          socketId: socket.id,
        });

        // Track the user so disconnect cleanup can find them
        userSocketMap[socket.id] = { meetingCode, userId, fullName, inLobby: true };

        // Tell the user they're in the lobby
        socket.emit("waiting-in-lobby");

        // Notify the host about the updated queue
        const hostSocketId = getHostSocketId(meetingCode);
        if (hostSocketId) {
          io.to(hostSocketId).emit("lobby-queue-updated", lobbyQueue[meetingCode]);
        }

        console.log(`User ${fullName} placed in lobby for ${meetingCode}`);
        return;
      }

      // Lobby is off → admit directly
      admitUser(meetingCode, userId, fullName, socket.id, false);
    });

    // ═══════════════════════════════════════════════════════════════════
    // LEAVE ROOM & DISCONNECT HELPERS
    // ═══════════════════════════════════════════════════════════════════

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
        delete meetingHosts[meetingCode];
        delete lobbyEnabled[meetingCode];
        delete lobbyQueue[meetingCode];

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

    // Helper: remove a user from the lobby queue (e.g. on disconnect)
    const handleLobbyRemoval = (meetingCode) => {
      if (!lobbyQueue[meetingCode]) return;

      lobbyQueue[meetingCode] = lobbyQueue[meetingCode].filter(
        (u) => u.socketId !== socket.id
      );

      if (lobbyQueue[meetingCode].length === 0) {
        delete lobbyQueue[meetingCode];
      }

      // Notify the host about the updated queue
      const hostSocketId = getHostSocketId(meetingCode);
      if (hostSocketId) {
        io.to(hostSocketId).emit("lobby-queue-updated", lobbyQueue[meetingCode] || []);
      }
    };

    // LEAVE ROOM
    socket.on("leave-room", async ({ meetingCode, userId }) => {
      const userData = userSocketMap[socket.id];
      if (userData?.inLobby) {
        handleLobbyRemoval(meetingCode);
      } else {
        await handleUserRemoval(meetingCode);
      }
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
        timestamp: new Date().toISOString(),
      });
    });

    // ═══════════════════════════════════════════════════════════════════
    // LOBBY CONTROL EVENTS
    // ═══════════════════════════════════════════════════════════════════

    // Host toggles lobby mode on/off
    socket.on("toggle-lobby", ({ meetingCode, enabled }) => {
      if (!isHostSocket(meetingCode)) return;

      lobbyEnabled[meetingCode] = !!enabled;

      // Notify all participants in the room about the change
      io.to(meetingCode).emit("lobby-status-changed", {
        enabled: !!enabled,
      });

      console.log(`Lobby ${enabled ? 'enabled' : 'disabled'} for ${meetingCode}`);
    });

    // Host admits a participant from the lobby
    socket.on("admit-participant", ({ meetingCode, targetSocketId }) => {
      if (!isHostSocket(meetingCode)) return;

      if (!lobbyQueue[meetingCode]) return;

      const queuedUser = lobbyQueue[meetingCode].find(
        (u) => u.socketId === targetSocketId
      );
      if (!queuedUser) return;

      // Remove from lobby queue
      lobbyQueue[meetingCode] = lobbyQueue[meetingCode].filter(
        (u) => u.socketId !== targetSocketId
      );
      if (lobbyQueue[meetingCode].length === 0) {
        delete lobbyQueue[meetingCode];
      }

      // Clear the inLobby flag
      if (userSocketMap[targetSocketId]) {
        delete userSocketMap[targetSocketId].inLobby;
      }

      // Tell the user they've been admitted
      io.to(targetSocketId).emit("admitted-from-lobby");

      // Now fully admit them into the meeting
      admitUser(meetingCode, queuedUser.userId, queuedUser.fullName, targetSocketId, false);

      // Update the host with the new queue
      const hostSocketId = getHostSocketId(meetingCode);
      if (hostSocketId) {
        io.to(hostSocketId).emit("lobby-queue-updated", lobbyQueue[meetingCode] || []);
      }

      console.log(`Host admitted ${queuedUser.fullName} from lobby in ${meetingCode}`);
    });

    // Host denies a participant from the lobby
    socket.on("deny-participant", ({ meetingCode, targetSocketId }) => {
      if (!isHostSocket(meetingCode)) return;

      if (!lobbyQueue[meetingCode]) return;

      const queuedUser = lobbyQueue[meetingCode].find(
        (u) => u.socketId === targetSocketId
      );
      if (!queuedUser) return;

      // Remove from lobby queue
      lobbyQueue[meetingCode] = lobbyQueue[meetingCode].filter(
        (u) => u.socketId !== targetSocketId
      );
      if (lobbyQueue[meetingCode].length === 0) {
        delete lobbyQueue[meetingCode];
      }

      // Clean up
      delete userSocketMap[targetSocketId];

      // Tell the user they've been denied
      io.to(targetSocketId).emit("denied-from-lobby");

      // Update the host with the new queue
      const hostSocketId = getHostSocketId(meetingCode);
      if (hostSocketId) {
        io.to(hostSocketId).emit("lobby-queue-updated", lobbyQueue[meetingCode] || []);
      }

      console.log(`Host denied ${queuedUser.fullName} from lobby in ${meetingCode}`);
    });

    // ═══════════════════════════════════════════════════════════════════
    // HOST CONTROL EVENTS
    // ═══════════════════════════════════════════════════════════════════

    // Host mutes a participant's microphone
    socket.on("host-mute-participant", ({ meetingCode, targetSocketId }) => {
      if (!isHostSocket(meetingCode)) return;
      io.to(targetSocketId).emit("force-mute");
      console.log(`Host muted participant ${targetSocketId} in ${meetingCode}`);
    });

    // Host disables a participant's camera
    socket.on("host-disable-camera", ({ meetingCode, targetSocketId }) => {
      if (!isHostSocket(meetingCode)) return;
      io.to(targetSocketId).emit("force-camera-off");
      console.log(`Host disabled camera of ${targetSocketId} in ${meetingCode}`);
    });

    // Host kicks a participant from the meeting
    socket.on("host-kick-participant", async ({ meetingCode, targetSocketId }) => {
      if (!isHostSocket(meetingCode)) return;

      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (!targetSocket) return;

      // Find the kicked user's info before removing
      const kickedUser = meetingParticipants[meetingCode]?.find(
        (u) => u.socketId === targetSocketId
      );

      // Tell the target they've been kicked
      io.to(targetSocketId).emit("you-were-kicked");

      // Remove from room data
      if (meetingParticipants[meetingCode]) {
        meetingParticipants[meetingCode] = meetingParticipants[meetingCode].filter(
          (u) => u.socketId !== targetSocketId
        );
      }
      delete userSocketMap[targetSocketId];

      // Notify remaining peers
      if (kickedUser) {
        socket.broadcast.to(meetingCode).emit("user-left-alert", {
          fullName: kickedUser.fullName,
        });
      }
      io.to(meetingCode).emit("peer-left", { socketId: targetSocketId });
      io.to(meetingCode).emit(
        "participants-updated",
        meetingParticipants[meetingCode] || []
      );

      // Force the target socket to leave the room
      targetSocket.leave(meetingCode);

      console.log(`Host kicked ${targetSocketId} from ${meetingCode}`);
    });

    // ═══════════════════════════════════════════════════════════════════
    // WEBRTC SIGNALING RELAY EVENTS
    // ═══════════════════════════════════════════════════════════════════
   
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

    // ═══════════════════════════════════════════════════════════════════
    // DISCONNECT
    // ═══════════════════════════════════════════════════════════════════
    socket.on("disconnect", async () => {
      const userData = userSocketMap[socket.id];
      if (userData) {
        if (userData.inLobby) {
          // User was in the lobby queue — remove them
          handleLobbyRemoval(userData.meetingCode);
        } else {
          await handleUserRemoval(userData.meetingCode);
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
