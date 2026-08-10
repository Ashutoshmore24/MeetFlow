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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* e.stopPropagation() prevents clicks inside the card from closing the modal */}
      <form 
        onSubmit={handleJoin}
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-md p-6 text-white duration-200 border shadow-xl bg-slate-900 rounded-xl border-slate-800 animate-in fade-in zoom-in-95"
      >
        <h2 className="mb-4 text-xl font-bold">Join Meeting</h2>
        
        <input
          type="text"
          placeholder="Enter meeting code"
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          disabled={isJoiningMeeting}
          className="w-full p-3 border rounded-lg bg-slate-800 border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          autoFocus
        />

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 font-medium transition rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isJoiningMeeting || !meetingCode.trim()}
            className="flex-1 py-2 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoiningMeeting ? "Joining..." : "Join"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinMeetingModal;
