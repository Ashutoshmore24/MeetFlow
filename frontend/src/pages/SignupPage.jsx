import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isSigningUp } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signup(formData);
    if (result.success) {
      navigate("/");
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950">
      <div className="w-full max-w-md p-8 sm:p-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join MeetFlow to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-slate-600"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fullName: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full p-3 text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-slate-600"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 text-white bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-slate-600"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              required
            />
          </div>

          <button
            disabled={isSigningUp}
            className="w-full p-3.5 mt-2 font-semibold text-white transition-colors bg-green-600 rounded-xl hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningUp ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;