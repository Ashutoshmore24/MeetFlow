import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "../lib/socket";
import { useAuthStore } from "../store/useAuthStore";
import { useMeetingStore } from "../store/useMeetingStore";
import toast from "react-hot-toast";

const MeetingRoomPage = () => {
  const { meetingCode } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { upcomingMeetings } = useMeetingStore();

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [remoteStreams, setRemoteStreams] = useState({}); // { [socketId]: MediaStream }
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const chatEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({}); // { [socketId]: RTCPeerConnection }
  const remoteVideoRefs = useRef({}); // { [socketId]: HTMLVideoElement }
  // Queue ICE candidates that arrive before remoteDescription is set
  const iceCandidateQueues = useRef({}); // { [socketId]: RTCIceCandidate[] }
  // Screen sharing refs
  const screenStreamRef = useRef(null); // Holds the screen capture MediaStream
  const cameraTrackRef = useRef(null);  // Remembers the original camera track to restore after screen share ends

  const currentMeetingDoc = upcomingMeetings?.find(
    (m) => m.meetingCode === meetingCode
  );
  const hostId = currentMeetingDoc?.host?._id || currentMeetingDoc?.host;

  // Correct public STUN/TURN servers for NAT traversal
  const rtcConfig = useRef({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
    ],
  });

  // ─── Flush queued ICE candidates once remoteDescription is set ───
  const flushIceCandidateQueue = useCallback(async (socketId) => {
    const pc = peerConnections.current[socketId];
    const queue = iceCandidateQueues.current[socketId];
    if (!pc || !queue || queue.length === 0) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn("Error flushing queued ICE candidate:", err);
      }
    }
    iceCandidateQueues.current[socketId] = [];
  }, []);

  // ─── createPeerConnection ────────────────────────────────────────
  const createPeerConnection = useCallback(
    (targetSocketId) => {
      // If a connection already exists, close it first to avoid stale state
      if (peerConnections.current[targetSocketId]) {
        const existingPc = peerConnections.current[targetSocketId];
        existingPc.ontrack = null;
        existingPc.onicecandidate = null;
        existingPc.onconnectionstatechange = null;
        existingPc.onnegotiationneeded = null;
        existingPc.close();
        delete peerConnections.current[targetSocketId];
      }

      const pc = new RTCPeerConnection(rtcConfig.current);

      // Initialize ICE candidate queue for this peer
      iceCandidateQueues.current[targetSocketId] = [];

      // 1. Push local audio/video tracks into this peer pipeline
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // 2. Relay discovered ICE candidates to the target peer via socket
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // 3. Capture incoming remote stream tracks from this participant
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [targetSocketId]: remoteStream,
          }));

          // Also try to directly assign if the element already exists
          const el = remoteVideoRefs.current[targetSocketId];
          if (el && el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
          }
        }
      };

      // 4. Log connection state for debugging
      pc.onconnectionstatechange = () => {
        console.log(
          `Peer ${targetSocketId} connection state: ${pc.connectionState}`
        );
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          console.warn(
            `Peer connection to ${targetSocketId} ${pc.connectionState}`
          );
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(
          `Peer ${targetSocketId} ICE state: ${pc.iceConnectionState}`
        );
      };

      peerConnections.current[targetSocketId] = pc;
      return pc;
    },
    []
  );

  // ─── Cleanup a single peer connection ────────────────────────────
  const closePeerConnection = useCallback((socketId) => {
    const pc = peerConnections.current[socketId];
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      pc.close();
      delete peerConnections.current[socketId];
    }
    // Clean up ICE candidate queue
    delete iceCandidateQueues.current[socketId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
    delete remoteVideoRefs.current[socketId];
  }, []);

  // ─── 1. Capture local camera and microphone stream ───────────────
  useEffect(() => {
    let cancelled = false;

    async function startLocalStream() {
      try {
        let stream = null;

        // Try video + audio together first
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 360 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (err) {
          console.warn("Could not get video+audio:", err.name, err.message);

          // If combined request fails, try each independently and merge
          let videoTrack = null;
          let audioTrack = null;

          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            videoTrack = videoStream.getVideoTracks()[0];
          } catch (vidErr) {
            console.warn("Could not get video:", vidErr.name, vidErr.message);
          }

          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            audioTrack = audioStream.getAudioTracks()[0];
          } catch (audErr) {
            console.warn("Could not get audio:", audErr.name, audErr.message);
          }

          if (videoTrack || audioTrack) {
            stream = new MediaStream();
            if (videoTrack) stream.addTrack(videoTrack);
            if (audioTrack) stream.addTrack(audioTrack);

            if (!videoTrack) {
              toast.error("Camera not available. Joining with audio only.");
            } else if (!audioTrack) {
              toast.error("Microphone not available. Joining with video only.");
            }
          } else {
            console.error("No media devices available at all");
            toast.error(
              "Could not access camera or microphone. Please check browser permissions."
            );
            if (!cancelled) setMediaReady(true);
            return;
          }
        }

        if (cancelled) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setMediaReady(true);
      } catch (err) {
        console.error("Unexpected error accessing media devices:", err);
        toast.error("Could not access camera or microphone.");
        if (!cancelled) setMediaReady(true);
      }
    }

    startLocalStream();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // ─── 2. Socket events & WebRTC signaling ─────────────────────────
  useEffect(() => {
    if (!authUser || !mediaReady) return;

    socket.connect();
    socket.emit("join-room", {
      meetingCode,
      userId: authUser._id,
      fullName: authUser.fullName,
    });

    // ── Participants updated (ROSTER ONLY — no offer creation) ─────
    const handleParticipantsUpdated = (users) => {
      setParticipants(users);

      // Clean up peer connections for users who left
      const currentSocketIds = new Set(users.map((u) => u.socketId));
      Object.keys(peerConnections.current).forEach((socketId) => {
        if (!currentSocketIds.has(socketId)) {
          closePeerConnection(socketId);
        }
      });
    };

    // ── New peer joined — ONLY existing users create offers ───────
    const handleNewPeerJoined = async ({ socketId: newPeerSocketId }) => {
      if (newPeerSocketId === socket.id) return;
      try {
        const pc = createPeerConnection(newPeerSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", {
          targetSocketId: newPeerSocketId,
          offer: pc.localDescription,
        });
        console.log("Sent offer to new peer:", newPeerSocketId);
      } catch (err) {
        console.error(
          "Error creating offer for new peer",
          newPeerSocketId,
          err
        );
      }
    };

    // ── WebRTC offer received (new joiner receives this) ──────────
    const handleWebRTCOffer = async ({ senderSocketId, offer }) => {
      try {
        const pc = createPeerConnection(senderSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Flush any ICE candidates that arrived before remoteDescription was set
        await flushIceCandidateQueue(senderSocketId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          targetSocketId: senderSocketId,
          answer: pc.localDescription,
        });
        console.log("Sent answer to:", senderSocketId);
      } catch (err) {
        console.error("Error handling offer from", senderSocketId, err);
      }
    };

    // ── WebRTC answer received ────────────────────────────────────
    const handleWebRTCAnswer = async ({ senderSocketId, answer }) => {
      try {
        const pc = peerConnections.current[senderSocketId];
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Flush any ICE candidates that arrived before remoteDescription was set
          await flushIceCandidateQueue(senderSocketId);
          console.log("Applied answer from:", senderSocketId);
        } else if (pc) {
          console.warn(
            `Ignoring answer from ${senderSocketId}, pc state: ${pc.signalingState}`
          );
        }
      } catch (err) {
        console.error("Error handling answer from", senderSocketId, err);
      }
    };

    // ── ICE candidate received ────────────────────────────────────
    const handleICECandidate = async ({ senderSocketId, candidate }) => {
      try {
        const pc = peerConnections.current[senderSocketId];
        if (!pc || !candidate) return;

        // If remoteDescription is not yet set, queue the candidate
        if (!pc.remoteDescription || !pc.remoteDescription.type) {
          if (!iceCandidateQueues.current[senderSocketId]) {
            iceCandidateQueues.current[senderSocketId] = [];
          }
          iceCandidateQueues.current[senderSocketId].push(
            new RTCIceCandidate(candidate)
          );
          console.log(
            `Queued ICE candidate from ${senderSocketId} (remoteDescription not set yet)`
          );
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        // Ignore benign errors from late-arriving candidates after connection is established
        if (err.name !== "InvalidStateError") {
          console.error(
            "Error adding ICE candidate from",
            senderSocketId,
            err
          );
        }
      }
    };

    // ── Peer left — immediately clean up their connection ─────────
    const handlePeerLeft = ({ socketId: leftSocketId }) => {
      console.log("Peer left, cleaning up:", leftSocketId);
      closePeerConnection(leftSocketId);
    };

    socket.on("participants-updated", handleParticipantsUpdated);
    socket.on("new-peer-joined", handleNewPeerJoined);
    socket.on("peer-left", handlePeerLeft);

    socket.on("user-joined-alert", (data) => {
      toast.success(`${data.fullName} joined the meeting`, {
        style: {
          background: "#069948",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
        },
      });
    });

    socket.on("user-left-alert", (data) => {
      toast.error(`${data.fullName} left the meeting`, {
        style: {
          background: "#990606",
          color: "#f8fafc",
          border: "1px solid #1e293b",
        },
      });
    });

    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("webrtc-offer", handleWebRTCOffer);
    socket.on("webrtc-answer", handleWebRTCAnswer);
    socket.on("webrtc-ice-candidate", handleICECandidate);

    return () => {
      // Close all peer connections
      Object.keys(peerConnections.current).forEach((socketId) => {
        closePeerConnection(socketId);
      });

      socket.off("participants-updated", handleParticipantsUpdated);
      socket.off("new-peer-joined", handleNewPeerJoined);
      socket.off("peer-left", handlePeerLeft);
      socket.off("user-joined-alert");
      socket.off("user-left-alert");
      socket.off("receive-message");
      socket.off("webrtc-offer", handleWebRTCOffer);
      socket.off("webrtc-answer", handleWebRTCAnswer);
      socket.off("webrtc-ice-candidate", handleICECandidate);
      socket.disconnect();
    };
  }, [
    meetingCode,
    authUser,
    mediaReady,
    createPeerConnection,
    closePeerConnection,
    flushIceCandidateQueue,
  ]);

  // ─── 3. Auto-scroll chat ─────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── 4. Bind remote streams to video elements when they mount ────
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([socketId, stream]) => {
      const el = remoteVideoRefs.current[socketId];
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
      }
    });
  }, [remoteStreams, participants]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleLeaveMeeting = () => {
    // Close all peer connections
    Object.keys(peerConnections.current).forEach((socketId) => {
      closePeerConnection(socketId);
    });
    // Stop screen share if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    // Stop local media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    socket.emit("leave-room", {
      meetingCode,
      userId: authUser._id,
    });
    socket.disconnect();
    toast.success("You have left the meeting.");
    navigate("/");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socket.emit("send-message", {
      meetingCode,
      userId: authUser._id,
      fullName: authUser.fullName,
      message: messageInput,
    });
    setMessageInput("");
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      } else {
        toast.error("No microphone track available.");
      }
    }
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      } else {
        toast.error("No camera track available.");
      }
    }
  };

  // ─── Screen sharing ────────────────────────────────────────────────
  const stopScreenShare = useCallback(() => {
    // Stop the screen capture tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Restore the original camera track in all peer connections
    const camTrack = cameraTrackRef.current;
    if (camTrack) {
      Object.values(peerConnections.current).forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video" || s.track === null);
        if (videoSender) {
          videoSender.replaceTrack(camTrack).catch((err) =>
            console.warn("Error restoring camera track:", err)
          );
        }
      });
    }

    // Restore local preview to camera stream
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
    toast.success("Screen sharing stopped.");
  }, []);

  const toggleScreenShare = useCallback(async () => {
    // If already sharing, stop
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Remember the current camera track so we can restore it later
      const currentCamTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      cameraTrackRef.current = currentCamTrack;

      // Replace the video track on every peer connection sender
      Object.values(peerConnections.current).forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(screenTrack).catch((err) =>
            console.warn("Error replacing track with screen:", err)
          );
        }
      });

      // Show screen share in local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      // Handle browser's native "Stop sharing" button
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      toast.success("Screen sharing started.");
    } catch (err) {
      // User cancelled the picker — not an error
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        console.log("Screen share cancelled by user.");
        return;
      }
      console.error("Error starting screen share:", err);
      toast.error("Could not start screen sharing.");
    }
  }, [isScreenSharing, stopScreenShare]);

  // ─── Priority pinning ────────────────────────────────────────────
  const currentUserItem = participants.find((p) => p.userId === authUser?._id);
  const otherParticipants = participants.filter(
    (p) => p.userId !== authUser?._id
  );

  // ─── Mobile sidebar tab state ────────────────────────────────────
  const [sidebarTab, setSidebarTab] = useState("chat"); // "participants" | "chat"
  const [showSidebar, setShowSidebar] = useState(false);

  // Total video tiles (self + remote)
  const totalTiles = 1 + otherParticipants.length;

  // Compute responsive grid class based on tile count
  const getVideoGridClass = () => {
    if (totalTiles === 1) return "grid-cols-1 max-w-lg mx-auto";
    if (totalTiles === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
    if (totalTiles <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto";
    if (totalTiles <= 6)
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto";
  };

  return (
    <div className="flex flex-col h-[100dvh] text-white bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
        <h1 className="text-base sm:text-xl font-bold text-indigo-400">MeetFlow</h1>
        <div className="flex items-center gap-2">
          <p className="text-[11px] sm:text-sm bg-slate-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700">
            <span className="hidden sm:inline">Meeting: </span>
            <span className="font-mono font-bold text-amber-400">
              {meetingCode}
            </span>
          </p>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {showSidebar ? "✕" : "💬"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Core Stage Container — Video Grid */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
          <div
            className={`grid gap-2 sm:gap-3 lg:gap-4 h-full content-center ${getVideoGridClass()}`}
          >
            {/* Local Self Preview Frame */}
            <div className={`relative w-full border shadow-lg aspect-video bg-slate-900 rounded-lg sm:rounded-xl ${isScreenSharing ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : "border-slate-800"}`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full rounded-lg sm:rounded-xl ${isScreenSharing ? "object-contain" : "object-cover transform -scale-x-100"}`}
              />
              <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-slate-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-md text-indigo-300 font-semibold border border-slate-800">
                You {isMuted && "🎙️"} {isScreenSharing && "🖥️"}
              </div>
            </div>

            {/* Remote Active Stream Connections Grid */}
            {otherParticipants.map((participant) => (
              <div
                key={participant.socketId}
                className="relative w-full border shadow-lg aspect-video bg-slate-900 rounded-lg sm:rounded-xl border-slate-800"
              >
                <video
                  ref={(el) => {
                    remoteVideoRefs.current[participant.socketId] = el;
                    if (el && remoteStreams[participant.socketId]) {
                      if (
                        el.srcObject !== remoteStreams[participant.socketId]
                      ) {
                        el.srcObject = remoteStreams[participant.socketId];
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  className="object-cover w-full h-full rounded-lg sm:rounded-xl"
                />
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-slate-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-md text-slate-300 font-medium border border-slate-800">
                  {participant.fullName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Split Panel: Roster + Chat */}
        <div
          className={`
            ${showSidebar ? "flex" : "hidden"} md:flex
            fixed md:static inset-0 top-[49px] z-30
            md:z-auto
            w-full md:w-[320px] lg:w-[350px]
            border-t md:border-t-0 md:border-l border-slate-800
            bg-slate-950/95 md:bg-slate-900/20
            backdrop-blur-md md:backdrop-blur-none
            flex-col h-auto md:h-full overflow-hidden
          `}
        >
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden border-b border-slate-800 flex-shrink-0">
            <button
              onClick={() => setSidebarTab("participants")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sidebarTab === "participants"
                  ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-900/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Participants ({participants.length})
            </button>
            <button
              onClick={() => setSidebarTab("chat")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                sidebarTab === "chat"
                  ? "text-indigo-400 border-b-2 border-indigo-400 bg-slate-900/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Chat {messages.length > 0 && `(${messages.length})`}
            </button>
          </div>

          {/* SECTION 1: PARTICIPANTS ROSTER */}
          <div
            className={`
              ${sidebarTab === "participants" ? "flex" : "hidden"} md:flex
              flex-col flex-1 md:flex-initial md:max-h-[40%]
              p-3 sm:p-4 overflow-hidden
            `}
          >
            <h2 className="hidden md:flex items-center justify-between mb-3 text-sm font-semibold text-slate-300 flex-shrink-0">
              <span>Participants</span>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded font-bold">
                {participants.length}
              </span>
            </h2>

            <div className="flex-1 pr-1 space-y-2 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500/50">
              {/* Current user pinned */}
              {currentUserItem && (
                <div
                  key={currentUserItem.socketId}
                  className="flex items-center justify-between p-2 sm:p-2.5 border border-indigo-500/30 shadow-md rounded-xl bg-slate-950/80 shadow-indigo-950/20"
                >
                  <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 text-[10px] sm:text-xs font-bold text-indigo-400 uppercase border rounded-full w-6 h-6 sm:w-7 sm:h-7 bg-indigo-600/30 border-indigo-500/50">
                      {currentUserItem.fullName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-indigo-300 truncate flex items-center gap-1.5">
                        <span className="truncate">
                          {currentUserItem.fullName}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-normal flex-shrink-0">
                          (You)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              {currentUserItem && otherParticipants.length > 0 && (
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1 pt-1">
                  Other Attendees
                </div>
              )}

              {/* Other participants */}
              {otherParticipants.map((participant) => (
                <div
                  key={participant.socketId}
                  className="flex items-center justify-between p-2 sm:p-2.5 transition-colors border rounded-xl bg-slate-900 border-slate-800/80 hover:bg-slate-900/60"
                >
                  <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 text-[10px] sm:text-xs font-bold uppercase border rounded-full w-6 h-6 sm:w-7 sm:h-7 bg-slate-800 border-slate-700 text-slate-300">
                      {participant.fullName?.charAt(0) || "?"}
                    </div>
                    <span className="text-xs font-medium truncate text-slate-200">
                      {participant.fullName}
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {participants.length === 0 && (
                <p className="py-2 text-xs text-center text-slate-500">
                  No participants connected.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: LIVE CHAT WINDOW */}
          <div
            className={`
              ${sidebarTab === "chat" ? "flex" : "hidden"} md:flex
              flex-col flex-1 overflow-hidden border-t border-slate-800/40
            `}
          >
            <div className="p-2.5 sm:p-3 border-b border-slate-800/40 bg-slate-900/30 flex-shrink-0">
              <h3 className="text-xs font-bold tracking-wide uppercase text-slate-400">
                Meeting Chat
              </h3>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
                  <p className="text-xs">No messages yet.</p>
                  <p className="text-[11px] mt-0.5">
                    Type down below to say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.userId === authUser?._id;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isMe ? "You" : msg.fullName}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs break-words shadow-sm ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-tr-none"
                            : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Submission Bar */}
            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 p-2 sm:p-3 border-t border-slate-800 bg-slate-900/60 flex-shrink-0"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="flex justify-center items-center gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-t border-slate-800 bg-slate-900/60 flex-shrink-0">
        <button
          onClick={toggleMute}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 border rounded-lg transition-colors text-[11px] sm:text-xs font-semibold ${
            isMuted
              ? "bg-red-600/20 border-red-500 text-red-400"
              : "bg-slate-800 border-slate-700 text-slate-200"
          }`}
        >
          <span className="sm:hidden">{isMuted ? "🎙️" : "🎤"}</span>
          <span className="hidden sm:inline">{isMuted ? "Unmute Mic" : "Mute Mic"}</span>
        </button>
        <button
          onClick={toggleCamera}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 border rounded-lg transition-colors text-[11px] sm:text-xs font-semibold ${
            isCamOff
              ? "bg-red-600/20 border-red-500 text-red-400"
              : "bg-slate-800 border-slate-700 text-slate-200"
          }`}
        >
          <span className="sm:hidden">{isCamOff ? "📷" : "📹"}</span>
          <span className="hidden sm:inline">{isCamOff ? "Turn Cam On" : "Turn Cam Off"}</span>
        </button>
        <button
          onClick={toggleScreenShare}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 border rounded-lg transition-colors text-[11px] sm:text-xs font-semibold ${
            isScreenSharing
              ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
              : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <span className="sm:hidden">🖥️</span>
          <span className="hidden sm:inline">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
        </button>
        <button
          onClick={handleLeaveMeeting}
          className="px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800"
        >
          Leave
        </button>
      </footer>
    </div>
  );
};

export default MeetingRoomPage;
