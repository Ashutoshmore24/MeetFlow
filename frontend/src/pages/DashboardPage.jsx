import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useMeetingStore } from "../store/useMeetingStore";
import JoinMeetingModal from "../components/dashboard/JoinMeetingModal";
import ScheduleMeetingModal from "../components/dashboard/ScheduleMeetingModal";
import ShareMeetingModal from "../components/dashboard/ShareMeetingModal";
import { History, Plus, Users, Calendar, Video, LogOut, Mail, X } from 'lucide-react';

const DashboardPage = () => {
  const { authUser, logout, resendVerification } = useAuthStore();
  const navigate = useNavigate();
  const { createInstantMeeting, isCreatingMeeting, upcomingMeetings, fetchUpcomingMeetings,historyMeetings,getHistoryMeetings } = useMeetingStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState(null);
 
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    // Re-show banner after 24h even if previously dismissed
    const dismissed = localStorage.getItem("mf_verify_banner_dismissed");
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < twentyFourHours;
  });
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (fetchUpcomingMeetings) {
      fetchUpcomingMeetings();
    }
    if (getHistoryMeetings) getHistoryMeetings();
  }, [fetchUpcomingMeetings, getHistoryMeetings]);

  const handleNewMeeting = async () => {
    const result = await createInstantMeeting();
    if (result.success) {
      setCreatedMeeting(result.meeting);
      setShowShareModal(true);
    } else {
      alert(result.message);
    }
  };

  const handleJoinCreatedMeeting = () => {
    if (createdMeeting?.meetingCode) {
      setShowShareModal(false);
      navigate(`/meeting/${createdMeeting.meetingCode}`);
    }
  };

  const handlePersonalRoomClick = () => {
    if (authUser?.personalRoomId) {
      navigate(`/meeting/${authUser.personalRoomId}`);
    } else {
      alert("Personal Room ID not found");
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    await resendVerification();
    setIsResending(false);
  };

  const handleDismissBanner = () => {
    localStorage.setItem("mf_verify_banner_dismissed", Date.now().toString());
    setBannerDismissed(true);
  };

  const showVerifyBanner = authUser && authUser.isVerified === false && !bannerDismissed;
  return (
    <div className="min-h-screen text-white relative bg-[#0a0a0a] overflow-hidden">
      {/* Unverified Email Banner */}
      {showVerifyBanner && (
        <div className="relative z-50 flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200 truncate">
              <span className="font-semibold">Verify your email</span>
              <span className="hidden sm:inline text-amber-300/80"> — check your inbox for the verification link we sent to </span>
              <span className="hidden sm:inline font-mono text-amber-300">{authUser.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-xs font-semibold text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 px-3 py-1 rounded-lg transition-all disabled:opacity-50"
            >
              {isResending ? "Sending…" : "Resend"}
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1 text-amber-400/60 hover:text-amber-300 transition-colors rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-10">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{authUser?.fullName}</span></h1>
            <p className="mt-2 text-slate-400">Manage your meetings and schedule from your dashboard.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full border border-indigo-500/40 p-0.5 overflow-hidden hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
            >
              <img 
                src={authUser?.profilePic || "https://ui-avatars.com/api/?name=" + encodeURIComponent(authUser?.fullName || "User") + "&background=random"} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full bg-slate-800"
              />
            </button>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all border rounded-lg text-slate-300 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>


        {/* Main Action Grid */}
        <div className="grid grid-cols-1 gap-5 mt-10 sm:grid-cols-2 md:grid-cols-4">
          <div
            onClick={handleNewMeeting}
            className="flex flex-col justify-between p-6 transition-all duration-300 cursor-pointer bg-gradient-to-br from-orange-500/90 to-red-600/90 rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25 border border-white/10 group"
          >
            <div className="p-3 mb-4 transition-transform bg-white/20 rounded-xl w-fit group-hover:scale-110">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isCreatingMeeting ? "Creating..." : "New Meeting"}
            </h2>
            <p className="mt-1 text-sm text-white/80">Start an instant meeting</p>
          </div>

          <div
            onClick={() => setShowJoinModal(true)}
            className="flex flex-col justify-between p-6 transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-500/90 to-indigo-600/90 rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 border border-white/10 group"
          >
            <div className="p-3 mb-4 transition-transform bg-white/20 rounded-xl w-fit group-hover:scale-110">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Join Meeting</h2>
            <p className="mt-1 text-sm text-white/80">Join using a code</p>
          </div>

          <div
            onClick={() => setShowScheduleModal(true)}
            className="flex flex-col justify-between p-6 transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-500/90 to-fuchsia-600/90 rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 border border-white/10 group"
          >
            <div className="p-3 mb-4 transition-transform bg-white/20 rounded-xl w-fit group-hover:scale-110">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Schedule</h2>
            <p className="mt-1 text-sm text-white/80">Plan your meeting</p>
          </div>

          <div
            onClick={handlePersonalRoomClick}
            className="flex flex-col justify-between p-6 transition-all duration-300 cursor-pointer bg-gradient-to-br from-teal-500/90 to-emerald-600/90 rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/25 border border-white/10 group"
          >
            <div className="p-3 mb-4 transition-transform bg-white/20 rounded-xl w-fit group-hover:scale-110">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Personal Room</h2>
            <p className="mt-1 text-sm text-white/80">Use your permanent link</p>
          </div>
        </div>

        {/* Navigation Row Container */}
        <div className="grid grid-cols-1 gap-5 mt-8 md:grid-cols-2">
          {/* Upcoming Meetings Link */}
          <div
            onClick={() => navigate("/upcoming")}
            className="flex items-center justify-between p-6 transition-all border cursor-pointer backdrop-blur-md bg-white/5 hover:bg-white/10 border-white/10 rounded-2xl hover:border-indigo-500/50 group"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 transition-colors rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Upcoming Meetings</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {upcomingMeetings?.length > 0
                    ? `You have ${upcomingMeetings.length} sessions scheduled`
                    : "No upcoming sessions listed"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold transition-transform text-indigo-400 group-hover:translate-x-1">
              View All →
            </span>
          </div>

          {/* History Meetings Link */}
          <div
            onClick={() => navigate("/history")}
            className="flex items-center justify-between p-6 transition-all border cursor-pointer backdrop-blur-md bg-white/5 hover:bg-white/10 border-white/10 rounded-2xl hover:border-emerald-500/50 group"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 transition-colors rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Meeting History</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {historyMeetings?.length > 0 
                    ? `You have ${historyMeetings.length} past sessions recorded` 
                    : "No historic sessions listed"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold transition-transform text-emerald-400 group-hover:translate-x-1">
              Review →
            </span>
          </div>
        </div>
      </div>{/* end relative z-10 max-w-6xl */}
      </div>{/* end p-10 wrapper */}

      <JoinMeetingModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <ScheduleMeetingModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} />
      <ShareMeetingModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setCreatedMeeting(null); }}
        meetingCode={createdMeeting?.meetingCode}
        title={createdMeeting?.title}
        showJoinButton={true}
        onJoinClick={handleJoinCreatedMeeting}
      />
    </div>
  );
};

export default DashboardPage;
