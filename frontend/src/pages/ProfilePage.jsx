import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, Hash, Check, Copy, User as UserIcon, Calendar, Activity, ShieldCheck, ArrowLeft, Loader2, X, Edit, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMeetingStore } from "../store/useMeetingStore";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile, isUpdatingProfile, resendVerification } = useAuthStore();
  const { historyMeetings } = useMeetingStore();
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(authUser?.fullName || "");
  const [copiedId, setCopiedId] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const fileInputRef = useRef(null);

  // Stats calculation
  const hostedMeetings = historyMeetings?.filter(m => m.host?._id === authUser?._id)?.length || 0;
  const totalMeetings = historyMeetings?.length || 0;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file format. Only JPEG, PNG and WEBP are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;

      if (base64Image === selectedImg) {
        toast.error("You have already selected this image");
        return;
      }

      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleNameSave = async () => {
    if (editedName.trim() === "") return;
    if (editedName === authUser?.fullName) {
      setIsEditingName(false);
      return;
    }

    await updateProfile({ fullName: editedName });
    setIsEditingName(false);
  };

  const copyPersonalRoomId = async () => {
    try {
      await navigator.clipboard.writeText(authUser?.personalRoomId);
      setCopiedId(true);
      toast.success("Personal Room ID copied!");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy ID");
    }
  };

  const handleProfileResendVerification = async () => {
    setIsResendingVerification(true);
    await resendVerification();
    // Clear the 24h localStorage dismiss so banner reappears once they reload
    localStorage.removeItem("mf_verify_banner_dismissed");
    setIsResendingVerification(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="h-screen text-white bg-[#0a0a0a] overflow-hidden relative flex flex-col">
      {/* Background Gradients — fixed so they don't scroll */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none z-0" />

      {/* Scrollable content wrapper — slim styled scrollbar */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-10"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(99,102,241,0.3) transparent",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-medium transition-colors text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar & Basic Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="p-8 text-center border shadow-2xl bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
                {/* Avatar Upload */}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-500 relative">
                    <img
                      src={selectedImg || authUser?.profilePic || "/avatar.png"}
                      alt="Profile"
                      onClick={() => setIsImageModalOpen(true)}
                      className="w-full h-full object-cover rounded-full bg-slate-900 cursor-pointer hover:opacity-90 transition-opacity"
                      onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(authUser?.fullName || "User") + "&background=random" }}
                    />
                    {isUpdatingProfile && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full m-1 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdatingProfile}
                    className={`absolute bottom-0 right-1 p-3 rounded-full bg-indigo-600 border border-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/30 ${isUpdatingProfile ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-500 hover:scale-110"}`}
                    title="Change Profile Picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Editable Name */}
                <div className="mb-2">
                  {isEditingName ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full px-3 py-1.5 text-center text-lg font-bold bg-slate-900 border border-indigo-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                        autoFocus
                      />
                      <button
                        onClick={handleNameSave}
                        disabled={isUpdatingProfile}
                        className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {authUser?.fullName}
                      </h2>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                        title="Edit Name"
                      >

                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm capitalize">
                    <ShieldCheck className="w-4 h-4 text-slateald-400" />
                    {authUser?.role || "User"}
                  </span>
                  <span className="text-slate-700">·</span>
                  {authUser?.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Details & Stats */}
            <div className="md:col-span-2 space-y-6">

              {/* Account Details */}
              <div className="p-6 border shadow-2xl bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-400" /> Account Details
                </h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Email Address</p>
                      <p className="text-slate-200 font-medium mt-0.5 truncate">{authUser?.email}</p>
                    </div>
                    {/* Verify button — only shown when unverified */}
                    {!authUser?.isVerified && (
                      <button
                        onClick={handleProfileResendVerification}
                        disabled={isResendingVerification}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                      >
                        {isResendingVerification ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        {isResendingVerification ? "Sending…" : "Verify Email"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Personal Room ID</p>
                      <p className="text-slate-200 font-mono font-bold mt-0.5">{authUser?.personalRoomId}</p>
                    </div>
                    <button
                      onClick={copyPersonalRoomId}
                      className="p-2 transition-colors rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                    <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Member Since</p>
                      <p className="text-slate-200 font-medium mt-0.5">{formatDate(authUser?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Stats */}
              <div className="p-6 border shadow-2xl bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" /> Meeting Statistics
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 text-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <p className="text-3xl font-extrabold text-white mb-1">{totalMeetings}</p>
                    <p className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">Total Meetings</p>
                  </div>
                  <div className="p-5 text-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <p className="text-3xl font-extrabold text-white mb-1">{hostedMeetings}</p>
                    <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">Meetings Hosted</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>{/* end scrollable wrapper */}

      {/* Full Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-2xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 right-0 md:-right-12 p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImg || authUser?.profilePic || "/avatar.png"}
              alt="Full Profile"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(authUser?.fullName || "User") + "&background=random" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
