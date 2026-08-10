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

  return (
    <div className="min-h-screen p-10 text-white bg-slate-950">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation Header */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-sm transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-bold">
              <History className="w-8 h-8 text-orange-400" /> Past Meetings
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Review records of your finished, cancelled, or passed sessions.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 mt-3 text-xs font-medium text-yellow-400 rounded-md bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 sm:mt-0">
            Total: {historyMeetings?.length || 0}
          </span>
        </div>
        
        {!historyMeetings || historyMeetings.length === 0 ? (
          <div className="p-6 py-12 text-center border bg-slate-900 border-slate-800 rounded-xl">
            <p className="text-sm font-medium text-slate-300">No meeting history found</p>
            <p className="mt-1 text-sm text-slate-500">You don't have any past or cancelled sessions registered.</p>
          </div>
        ) : (
          <div className="overflow-hidden border shadow-2xl bg-slate-900 border-slate-800 rounded-xl">
            <ul className="divide-y divide-slate-800">
              {historyMeetings.map((meeting) => (
                <li key={meeting._id} className="flex items-center justify-between p-5 transition-colors hover:bg-slate-900/60 gap-x-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold truncate text-slate-200">
                      {meeting.title || 'Untitled Meeting'}
                    </h2>
                    <div className="flex flex-wrap items-center mt-1 text-xs gap-x-2 text-slate-400">
                      <time dateTime={meeting.scheduledFor}>{formatDate(meeting.scheduledFor)}</time>
                      <span className="text-red-700">•</span>
                      <span className="truncate">Hosted by {meeting.host?.fullName || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 ">
                    {getStatusBadge(meeting.status, meeting.scheduledFor)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
