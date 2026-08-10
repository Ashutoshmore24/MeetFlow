import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMeetingStore } from "../store/useMeetingStore";
import calendarIcon from "../assets/upcomming1.png";

const UpcomingPage = () => {
  const navigate = useNavigate();
  const { upcomingMeetings, fetchUpcomingMeetings, isFetchingMeetings } = useMeetingStore();

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
    alert(`Meeting code ${code} copied!`);
  };

  return (
    <div className="min-h-screen p-10 text-white bg-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate("/")} 
              className="block mb-2 text-xs text-purple-400 hover:underline"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold tracking-wide">Upcoming Meetings</h1>
          </div>
          <span className="px-3 py-1 text-xs font-semibold text-purple-400 border rounded-full bg-purple-600/20 border-purple-500/30">
            {upcomingMeetings?.length || 0} Scheduled
          </span>
        </div>

        {/* Full Meetings Container */}
        <div className="p-6 border bg-slate-900 border-slate-800 rounded-2xl">
          {isFetchingMeetings ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">Loading all scheduled sessions...</div>
          ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id || meeting._id} 
                  className="flex flex-col items-start justify-between gap-4 p-5 transition border sm:flex-row sm:items-center bg-slate-950 border-slate-800/80 rounded-xl hover:border-purple-500/40"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{meeting.title}</h3>
                    
                    {/* UPDATED: Aligned and integrated the custom PNG graphic */}
                    <div className="flex items-center gap-2 mt-1">
                      <img 
                        src={calendarIcon} 
                        alt="Calendar" 
                        className="object-contain w-4 h-4" 
                      />
                      <p className="text-sm font-medium text-purple-400">
                        {formatMeetingTime(meeting.scheduledFor)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button 
                      onClick={() => copyToClipboard(meeting.meetingCode)} 
                      className="flex-1 px-4 py-2 text-xs font-medium transition rounded-lg sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      Copy Code
                    </button>
                    <button 
                      onClick={() => navigate(`/meeting/${meeting.meetingCode}`)} 
                      className="flex-1 px-5 py-2 text-xs font-semibold text-white transition bg-purple-600 rounded-lg shadow-lg sm:flex-initial hover:bg-purple-500 shadow-purple-600/10"
                    >
                      Start Meeting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <p className="text-base text-slate-500">You have no upcoming sessions scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingPage;
