import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/me");

      set({
        authUser: res.data,
      });
      toast.success(`Welcome back, ${res.data.fullName}!`);
    } catch (error) {
      set({
        authUser: null,
      });
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },

  signup: async (formData) => {
    try {
      set({ isSigningUp: true });

      const res = await axiosInstance.post(
        "/auth/signup",
        formData
      );

      set({
        authUser: res.data.user,
      });

        toast.success(`Welcome, ${res.data.user.fullName}! Your account has been created.`);
    
      return {
        success: true,
        };
        
    
    } catch (error) {
        toast.error("Signup failed. Please try again.");
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Signup failed",
        };
        
    } finally {
      set({
        isSigningUp: false,
      });
    }
  },

  login: async (formData) => {
    try {
      set({ isLoggingIn: true });

      const res = await axiosInstance.post(
        "/auth/login",
        formData
      );

      set({
        authUser: res.data.user,
      });

        toast.success("Logged in successfully.");
      return {
        success: true,
      };
    } catch (error) {
        toast.error("Login failed. Please try again.");
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Login failed",
      };
    } finally {
      set({
        isLoggingIn: false,
      });
    }
  },

  logout: async () => {
    try {
      set({
        isLoggingOut: true,
      });

      await axiosInstance.post("/auth/logout");

      set({
        authUser: null,
      });
        
        toast.success("Logged out successfully.");
    } catch (error) {
        console.error(error);
        toast.error("Logout failed. Please try again.");
    } finally {
      set({
        isLoggingOut: false,
      });
    }
  },
}));