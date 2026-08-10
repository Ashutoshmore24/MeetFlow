import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useMeetingStore } from "../store/useMeetingStore";
import JoinMeetingModal from "../components/dashboard/JoinMeetingModal";
import ScheduleMeetingModal from "../components/dashboard/ScheduleMeetingModal";
import { History } from 'lucide-react';

const DashboardPage = () => {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const { createInstantMeeting, isCreatingMeeting, upcomingMeetings, fetchUpcomingMeetings,historyMeetings,getHistoryMeetings } = useMeetingStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (fetchUpcomingMeetings) {
      fetchUpcomingMeetings();
    }
    if (getHistoryMeetings) getHistoryMeetings();
  }, [fetchUpcomingMeetings, getHistoryMeetings]);

  const handleNewMeeting = async () => {
    const result = await createInstantMeeting();
    if (result.success) {
      navigate(`/meeting/${result.meeting.meetingCode}`);
    } else {
      alert(result.message);
    }
  };

  const handlePersonalRoomClick = () => {
    if (authUser?.personalRoomId) {
      navigate(`/meeting/${authUser.personalRoomId}`);
    } else {
      alert("Personal Room ID not found");
    }
  };

  return (
    <div className="min-h-screen p-10 text-white bg-slate-950">
      <h1 className="mb-8 text-4xl font-bold">Welcome {authUser?.fullName}</h1>
      <div className="space-y-3">
        <p>Email: {authUser?.email}</p>
        <p>Personal Room: {authUser?.personalRoomId}</p>

        {/* Main Action Grid */}
        <div className="grid grid-cols-2 gap-5 mt-10 md:grid-cols-4">
          <div
            onClick={handleNewMeeting}
            className="p-6 transition bg-orange-500 cursor-pointer rounded-xl hover:scale-105"
          >
            <h2 className="font-semibold">
              {isCreatingMeeting ? "Creating..." : "New Meeting"}
            </h2>
          </div>

          <div
            onClick={() => setShowJoinModal(true)}
            className="p-6 transition bg-blue-500 cursor-pointer rounded-xl hover:scale-105"
          >
            <h2 className="font-semibold">Join Meeting</h2>
            <p className="text-sm opacity-80">Join using meeting code</p>
          </div>

          <div
            onClick={() => setShowScheduleModal(true)}
            className="p-6 transition bg-purple-500 cursor-pointer rounded-xl hover:scale-105"
          >
            <h2 className="font-semibold">Schedule Meeting</h2>
          </div>

          <div
            onClick={handlePersonalRoomClick}
            className="p-6 transition bg-yellow-500 cursor-pointer rounded-xl hover:scale-105 text-slate-950"
          >
            <h2 className="font-bold">Personal Room</h2>
          </div>
        </div>

        {/* Navigation Row Container */}
        <div className="grid max-w-4xl grid-cols-1 gap-4 mt-8 md:grid-cols-2">
          {/* Upcoming Meetings Link */}
          <div
            onClick={() => navigate("/upcoming")}
            className="flex items-center justify-between p-5 transition-all border cursor-pointer bg-slate-900 hover:bg-slate-900/80 border-slate-800 rounded-xl hover:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 text-xl text-purple-400 bg-purple-600/20 rounded-xl">
                📅
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Upcoming Meetings</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {upcomingMeetings?.length > 0
                    ? `You have ${upcomingMeetings.length} sessions scheduled`
                    : "No upcoming sessions listed"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              View All →
            </span>
          </div>

          {/* History Meetings Link */}
          <div
            onClick={() => navigate("/history")}
            className="flex items-center justify-between p-5 transition-all border cursor-pointer bg-slate-900 hover:bg-slate-900/80 border-slate-800 rounded-xl hover:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 text-emerald-400 bg-emerald-600/20 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Meeting History</h3>
                <p className="text-xs text-slate-400 mt-0.5">
        {historyMeetings?.length > 0 
          ? `You have ${historyMeetings.length} past sessions recorded` 
          : "No historic sessions listed"}
      </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              Review →
            </span>
          </div>
        </div>

        <button onClick={logout} className="px-5 py-2 mt-6 bg-red-600 rounded-lg">
          Logout
        </button>
      </div>

      <JoinMeetingModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <ScheduleMeetingModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} />
    </div>
  );
};

export default DashboardPage;
