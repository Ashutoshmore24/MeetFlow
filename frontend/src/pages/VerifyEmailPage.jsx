import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuthUserVerified, resendVerification } = useAuthStore();

  // "loading" | "success" | "error"
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        await axiosInstance.get(`/auth/verify-email/${token}`);
        setStatus("success");
        // Update the Zustand store so the dashboard banner disappears
        setAuthUserVerified();
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err.response?.data?.message ||
            "This verification link is invalid or has expired."
        );
      }
    };

    if (token) verify();
    else setStatus("error");
  }, [token, setAuthUserVerified]);

  const handleResend = async () => {
    setIsResending(true);
    await resendVerification();
    setIsResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {/* MeetFlow brand */}
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-8">
            MeetFlow
          </h1>

          {/* ── Loading ── */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              <p className="text-slate-300 font-medium">Verifying your email…</p>
              <p className="text-slate-500 text-sm">This will only take a moment.</p>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Email Verified! 🎉</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your email has been successfully verified. You now have full access to all MeetFlow features.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25"
              >
                Go to Dashboard →
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Link Expired</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{errorMsg}</p>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {isResending ? "Sending…" : "Resend Verification Email"}
              </button>
              <button
                onClick={() => navigate("/")}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
