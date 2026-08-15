import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/useMeetingStore';
import { ArrowLeft, History } from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  
  // Destructures history state and fetcher directly from your Zustand store
  const { historyMeetings, isLoadingHistory, getHistoryMeetings } = useMeetingStore();

  useEffect(() => {
    if (getHistoryMeetings) {
      getHistoryMeetings();
    }
  }, [getHistoryMeetings]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status, scheduledFor) => {
    const lowerStatus = status?.toLowerCase();
    const isPastScheduled = lowerStatus === 'scheduled' && new Date(scheduledFor) < new Date();

    if (lowerStatus === 'cancelled') {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-red-400 border border-red-500/30">Cancelled</span>;
    }
    if (lowerStatus === 'ended' || isPastScheduled) {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-800 text-slate-400 border border-slate-700">Ended</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">{status}</span>;
  };

  // Uses your store's isLoadingHistory flag
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 text-white bg-slate-950">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-emerald-500"></div>
        <p className="text-sm font-medium text-slate-400">Loading your past meetings...</p>
      </div>
    );
  }

  const getGroupedMeetings = () => {
    if (!historyMeetings || historyMeetings.length === 0) return {};

    // Sort descending (newest first)
    const sorted = [...historyMeetings].sort(
      (a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor)
    );

    // Group by formatted date
    const grouped = {};
    sorted.forEach((meeting) => {
      const dateObj = new Date(meeting.scheduledFor);
      if (isNaN(dateObj)) return; // skip invalid dates
      
      const dateKey = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meeting);
    });

    return grouped;
  };

  const groupedMeetings = getGroupedMeetings();
  const groupKeys = Object.keys(groupedMeetings);

  return (
    <div className="min-h-screen p-10 text-white relative bg-[#0a0a0a] overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Back Navigation Header */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-slate-400 hover:text-emerald-400"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              <History className="w-8 h-8 text-emerald-400" /> Past Meetings
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Review records of your finished, cancelled, or passed sessions.
            </p>
          </div>
          <span className="inline-flex items-center px-4 py-1.5 mt-3 text-sm font-semibold text-emerald-300 border rounded-full bg-emerald-500/10 border-emerald-500/20 backdrop-blur-md sm:mt-0">
            Total: {historyMeetings?.length || 0}
          </span>
        </div>
        
        {!historyMeetings || historyMeetings.length === 0 ? (
          <div className="p-6 py-16 text-center border border-dashed shadow-2xl bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
            <p className="text-base font-medium text-slate-300">No meeting history found</p>
            <p className="mt-2 text-sm text-slate-500">You don't have any past or cancelled sessions registered.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  {dateKey}
                </h3>
                <div className="overflow-hidden border shadow-xl bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl">
                  <ul className="divide-y divide-white/10">
                    {groupedMeetings[dateKey].map((meeting) => (
                      <li key={meeting._id || meeting.id} className="flex items-center justify-between p-6 transition-colors hover:bg-white/10 gap-x-4 group">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold truncate text-slate-100 group-hover:text-emerald-300 transition-colors">
                            {meeting.title || 'Untitled Meeting'}
                          </h2>
                          <div className="flex flex-wrap items-center mt-2 text-sm gap-x-2 text-slate-400">
                            <time dateTime={meeting.scheduledFor}>{formatDate(meeting.scheduledFor)}</time>
                            <span className="text-white/20">•</span>
                            <span className="truncate">Hosted by <span className="font-medium text-slate-300">{meeting.host?.fullName || 'Unknown'}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          {getStatusBadge(meeting.status, meeting.scheduledFor)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
