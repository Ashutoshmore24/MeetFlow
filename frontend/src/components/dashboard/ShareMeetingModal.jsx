import { useState } from "react";
import { Copy, Share2, Check, Link, Hash, X } from "lucide-react";
import toast from "react-hot-toast";

const ShareMeetingModal = ({ isOpen, onClose, meetingCode, title, scheduledFor, showJoinButton, onJoinClick }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !meetingCode) return null;

  const meetingLink = `https://meetflow-49z7.onrender.com/meeting/${meetingCode}`;

  const formatScheduledTime = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const formattedTime = formatScheduledTime(scheduledFor);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopiedLink(true);
      toast.success("Meeting link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);
      setCopiedCode(true);
      toast.success("Meeting code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error("Sharing not supported on this browser");
      return;
    }

    try {
      await navigator.share({
        title: title || "MeetFlow Meeting",
        text: `Join my meeting${title ? `: ${title}` : ""}${formattedTime ? ` on ${formattedTime}` : ""}\nMeeting Code: ${meetingCode}`,
        url: meetingLink,
      });
    } catch (err) {
      // User cancelled the share — not an error
      if (err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md text-white duration-200 border shadow-2xl backdrop-blur-xl bg-[#0a0a0a]/90 border-white/10 rounded-2xl animate-in fade-in zoom-in-95 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <button
            onClick={onClose}
            className="absolute p-1.5 transition-colors rounded-lg top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20">
              <Share2 className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Share Meeting
            </h2>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="px-8 pb-5">
          {title && (
            <p className="text-base font-semibold text-slate-200">{title}</p>
          )}
          {formattedTime && (
            <p className="mt-1 text-sm text-indigo-300/80">📅 {formattedTime}</p>
          )}
        </div>

        {/* Sharing Options */}
        <div className="px-8 pb-6 space-y-3">
          {/* Copy Meeting Link */}
          <div className="flex items-center gap-3 p-3.5 transition-all border rounded-xl bg-white/5 border-white/10 group hover:border-indigo-500/30 hover:bg-white/[0.07]">
            <div className="p-2 rounded-lg bg-indigo-500/15">
              <Link className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Meeting Link</p>
              <p className="mt-0.5 text-sm font-mono text-slate-300 truncate">{meetingLink}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all rounded-lg shrink-0 ${
                copiedLink
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:text-white"
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Copy Meeting Code */}
          <div className="flex items-center gap-3 p-3.5 transition-all border rounded-xl bg-white/5 border-white/10 group hover:border-purple-500/30 hover:bg-white/[0.07]">
            <div className="p-2 rounded-lg bg-purple-500/15">
              <Hash className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Meeting Code</p>
              <p className="mt-0.5 text-lg font-mono font-bold tracking-widest text-slate-200">{meetingCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all rounded-lg shrink-0 ${
                copiedCode
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:text-white"
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-8">
          <div className="flex gap-3">
            {/* Native Share */}
            {supportsNativeShare && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-semibold transition-all border rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}

            {/* Join Button (shown after creating/scheduling) */}
            {showJoinButton && onJoinClick && (
              <button
                onClick={onJoinClick}
                className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
              >
                Join Now →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareMeetingModal;
