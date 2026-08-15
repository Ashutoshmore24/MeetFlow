import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMeetingStore } from "../../store/useMeetingStore";

const JoinMeetingModal = ({ isOpen, onClose }) => {
  const [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();
  const { joinMeeting, isJoiningMeeting } = useMeetingStore();

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    // Prevent default form submission reload if wrapped in a form
    if (e) e.preventDefault(); 
    
    if (!meetingCode.trim()) return;

    const result = await joinMeeting(meetingCode);
    if (result.success) {
      navigate(`/meeting/${result.meeting.meetingCode}`);
      onClose();
    } else {
      alert(result.message);
    }
  };

  return (
    // Backdrop click closes the modal
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* e.stopPropagation() prevents clicks inside the card from closing the modal */}
      <form 
        onSubmit={handleJoin}
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-md p-8 text-white duration-200 border shadow-2xl backdrop-blur-xl bg-[#0a0a0a]/90 border-white/10 rounded-2xl animate-in fade-in zoom-in-95"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Join Meeting</h2>
          <p className="mt-1 text-sm text-slate-400">Enter your meeting code to join instantly.</p>
        </div>
        
        <input
          type="text"
          placeholder="e.g. abc-defg-hij"
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          disabled={isJoiningMeeting}
          className="w-full p-3.5 transition-all border rounded-xl bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 placeholder:text-slate-500"
          autoFocus
        />

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 font-semibold transition-all rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isJoiningMeeting || !meetingCode.trim()}
            className="flex-1 py-3 font-semibold text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {isJoiningMeeting ? "Joining..." : "Join Meeting"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinMeetingModal;
