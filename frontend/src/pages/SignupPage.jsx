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
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-full max-w-md p-8 border bg-slate-900 rounded-xl border-slate-800">
        <h1 className="mb-6 text-3xl font-bold text-center text-white">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 text-white rounded-lg bg-slate-800"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 text-white rounded-lg bg-slate-800"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 text-white rounded-lg bg-slate-800"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />

          <button
            disabled={isSigningUp}
            className="w-full p-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {isSigningUp ? "Creating..." : "Create Account"}
          </button>

        </form>

        <p className="mt-5 text-center text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-500"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;