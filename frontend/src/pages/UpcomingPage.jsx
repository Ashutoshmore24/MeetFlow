import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMeetingStore } from "../store/useMeetingStore";
import ShareMeetingModal from "../components/dashboard/ShareMeetingModal";
import calendarIcon from "../assets/upcomming1.png";
import { ArrowLeft, Copy, Video, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const CountdownBadge = ({ scheduledFor }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(scheduledFor).getTime();
      const diff = target - now;
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduledFor]);

  if (timeLeft === null) return null;
  if (timeLeft <= 0) return <span className="text-xs font-bold text-green-400 animate-pulse">Starting now...</span>;

  const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isUrgent = timeLeft < 5 * 60 * 1000;
  return (
    <span className={`text-xs font-mono font-bold ${isUrgent ? "text-amber-400 animate-pulse" : "text-slate-400"}`}>
      {d > 0 ? `${d}d ` : ""}{h.toString().padStart(2, "0")}:{m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
    </span>
  );
};

const UpcomingPage = () => {
  const navigate = useNavigate();
  const { upcomingMeetings, fetchUpcomingMeetings, isFetchingMeetings } = useMeetingStore();

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    if (fetchUpcomingMeetings) fetchUpcomingMeetings();
  }, [fetchUpcomingMeetings]);

  const formatMeetingTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Date unavailable";
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Meeting code ${code} copied!`);
  };

  return (
    <div className="min-h-screen p-10 text-white relative bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors text-slate-400 hover:text-indigo-400"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Upcoming Meetings</h1>
          </div>
          <span className="px-4 py-1.5 text-sm font-semibold text-indigo-300 border rounded-full bg-indigo-500/10 border-indigo-500/20 backdrop-blur-md">
            {upcomingMeetings?.length || 0} Scheduled
          </span>
        </div>

        <div className="p-8 border shadow-2xl bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
          {isFetchingMeetings ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">Loading all scheduled sessions...</div>
          ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id || meeting._id}
                  className="flex flex-col items-start justify-between gap-4 p-6 transition-all border group sm:flex-row sm:items-center bg-white/5 border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-white/10"
                >
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{meeting.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <img src={calendarIcon} alt="Calendar" className="object-contain w-5 h-5 opacity-80" />
                        <p className="text-sm font-medium text-indigo-300">{formatMeetingTime(meeting.scheduledFor)}</p>
                      </div>
                      <CountdownBadge scheduledFor={meeting.scheduledFor} />
                    </div>
                  </div>

                  <div className="flex w-full gap-3 sm:w-auto">
                    <button
                      onClick={() => copyToClipboard(meeting.meetingCode)}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-lg sm:flex-initial bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white"
                    >
                      <Copy className="w-4 h-4" /> Code
                    </button>
                    <button
                      onClick={() => { setSelectedMeeting(meeting); setShowShareModal(true); }}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-lg sm:flex-initial bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                      onClick={() => navigate(`/meeting/${meeting.meetingCode}`)}
                      className="flex items-center justify-center flex-1 gap-2 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 rounded-lg shadow-lg sm:flex-initial bg-gradient-to-r from-green-600 to-green-600 hover:from-green-500 hover:to-green-500 shadow-green-500/25 hover:-translate-y-0.5"
                    >
                      <Video className="w-4 h-4" /> Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-base text-slate-400">You have no upcoming sessions scheduled.</p>
            </div>
          )}
        </div>
      </div>

      <ShareMeetingModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setSelectedMeeting(null); }}
        meetingCode={selectedMeeting?.meetingCode}
        title={selectedMeeting?.title}
        scheduledFor={selectedMeeting?.scheduledFor}
      />
    </div>
  );
};

export default UpcomingPage;
