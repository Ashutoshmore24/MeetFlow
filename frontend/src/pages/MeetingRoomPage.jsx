import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  const currentMeetingDoc = upcomingMeetings?.find(m => m.meetingCode === meetingCode);
  const hostId = currentMeetingDoc?.host?._id || currentMeetingDoc?.host;

  useEffect(() => {
    if (!authUser) return;

    socket.connect();

    socket.emit("join-room", {
      meetingCode,
      userId: authUser._id,
      fullName: authUser.fullName,
    });

    socket.on("participants-updated", (users) => {
      setParticipants(users);
    });

    // LISTEN FOR NEW MEMBER TOASTS
    socket.on("user-joined-alert", (data) => {
      toast.success(`${data.fullName} joined the meeting`, {
        style: {
          background: '#069948',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          
        }
      });
    });

    // LISTEN FOR DISCONNECT TOASTS
    socket.on("user-left-alert", (data) => {
      toast.error(`${data.fullName} left the meeting`, {
        style: { background: '#990606', color: '#f8fafc', border: '1px solid #1e293b' }
      });
    });

    // Clean up connection hooks correctly when leaving or unmounting
    return () => {
      socket.off("participants-updated");
      socket.off("user-joined-alert");
      socket.off("user-left-alert");
      socket.disconnect();
    };
  }, [meetingCode, authUser]);

  const handleLeaveMeeting = () => {
    socket.emit("leave-room", {
      meetingCode,
      userId: authUser._id,
    });
    socket.disconnect();
    toast.success("You have left the meeting.");
    navigate("/"); 
  };

  // --- PRIORITY PINNING COMPUTATION ---
  const currentUserItem = participants.find(p => p.userId === authUser?._id);
  const otherParticipants = participants.filter(p => p.userId !== authUser?._id);

  return (
    <div className="flex flex-col justify-between min-h-screen text-white bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/40">
        <h1 className="text-xl font-bold text-indigo-400">MeetFlow</h1>
        <p className="text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          Meeting: <span className="font-mono font-bold text-amber-400">{meetingCode}</span>
        </p>
      </header>

      {/* Main Container */}
      <main className="h-[80vh] flex flex-col md:flex-row">
        {/* Core Stage placeholder */}
        <div className="flex items-center justify-center flex-1 p-4">
          <div className="flex items-center justify-center w-full max-w-3xl border shadow-lg aspect-video bg-slate-900 rounded-xl border-slate-800 text-slate-400">
            Video Area (Phase 1 Sandbox)
          </div>
        </div>

        {/* Sidebar Roster panel */}
        <div className="w-full md:w-[300px] border-t md:border-t-0 md:border-l border-slate-800 p-4 bg-slate-900/20 flex flex-col">
          <h2 className="flex items-center justify-between mb-4 font-semibold text-slate-300">
            <span>Participants</span>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded font-bold">
              {participants.length}
            </span>
          </h2>

          <div className="flex-1 pr-1 space-y-2 overflow-y-auto">
            {/* 1. RENDER CURRENT USER AT THE ABSOLUTE TOP (PINNED) */}
            {currentUserItem && (
              <div key={currentUserItem.socketId} className="flex items-center justify-between p-3 border-2 shadow-md rounded-xl bg-slate-950/80 border-indigo-500/50 shadow-indigo-950/20" >
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400 uppercase border rounded-full w-7 h-7 bg-indigo-600/30 border-indigo-500/50">
                    {currentUserItem.fullName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-300 truncate flex items-center gap-1.5">
                      <span className="truncate">{currentUserItem.fullName}</span>
                      <span className="text-[10px] text-indigo-400 font-normal flex-shrink-0">(You)</span>
                    </p>
                  
                
                  </div>
                </div>
               
              </div>
            )}

            {/* Divider line if there are other participants below you */}
            {currentUserItem && otherParticipants.length > 0 && (
              <div className="border-t border-slate-800/60 my-2 pt-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">
                Other Attendees
              </div>
            )}

            {/* 2. RENDER THE REMAINING ACTIVE PARTICIPANTS LIST */}
            {otherParticipants.map((participant) => (
              <div key={participant.socketId} className="flex items-center justify-between p-3 transition-colors border rounded-xl bg-slate-900 border-slate-800/80 hover:bg-slate-900/60" >
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase border rounded-full w-7 h-7 bg-slate-800 border-slate-700 text-slate-300">
                    {participant.fullName?.charAt(0) || "?"}
                  </div>
                  <span className="text-sm font-medium truncate text-slate-200">
                    {participant.fullName}
                  </span>
                </div>
                
              </div>
            ))}

            {/* Empty state conditional renderer */}
            {participants.length === 0 && (
              <p className="py-4 text-xs text-center text-slate-500">No participants connected.</p>
            )}
          </div>
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="flex justify-center gap-4 p-4 border-t border-slate-800 bg-slate-900/60">
        <button disabled className="px-4 py-2 border rounded-lg opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700/40">Mic</button>
        <button disabled className="px-4 py-2 border rounded-lg opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700/40">Camera</button>
        <button disabled className="px-4 py-2 border rounded-lg opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700/40">Screen</button>
        <button onClick={handleLeaveMeeting} className="px-5 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800" >
          Leave
        </button>
      </footer>
    </div>
  );
};

export default MeetingRoomPage;
