import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useMeetingStore = create((set) => ({
  upcomingMeetings: [],
  historyMeetings: [],

  isCreatingMeeting: false,
  isJoiningMeeting: false,
  isLoadingUpcoming: false,
  isLoadingHistory: false,
  isSchedulingMeeting: false,
  isFetchingMeetings: false,

  createInstantMeeting: async () => {
    try {
      set({ isCreatingMeeting: true });

      const res = await axiosInstance.post("/meetings/create");

      toast.success("Meeting created successfully!");
      return {
        success: true,
        meeting: res.data.meeting || res.data.populatedMeeting,
      };
    } catch (error) {
      toast.error("Failed to create meeting");
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create meeting",
      };
    } finally {
      set({ isCreatingMeeting: false });
    }
  },

  joinMeeting: async (meetingCode) => {
    try {
      set({ isJoiningMeeting: true });

      const res = await axiosInstance.post("/meetings/join", { meetingCode });

      toast.success("Joined meeting successfully!");
      return {
        success: true,
        meeting: res.data.meeting,
      };
    } catch (error) {
      toast.error("Failed to join meeting");
      return {
        success: false,
        message: error.response?.data?.message || "Failed to join meeting",
      };
    } finally {
      set({ isJoiningMeeting: false });
    }
  },

  getUpcomingMeetings: async () => {
    try {
      set({ isLoadingUpcoming: true });

      const res = await axiosInstance.get("/meetings/upcoming");

      set({
        upcomingMeetings: res.data.meetings || [],
      });
      toast.success("Upcoming meetings fetched successfully!");
    } catch (error) {
      toast.error("Failed to fetch upcoming meetings");
      console.error(error);
    } finally {
      set({ isLoadingUpcoming: false });
    }
  },

  getHistoryMeetings: async () => {
    try {
      set({ isLoadingHistory: true });

      const res = await axiosInstance.get("/meetings/history");

      set({
        historyMeetings: res.data.meetings || [],
      });

    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  scheduleMeeting: async (meetingData) => {
    try {
      set({ isSchedulingMeeting: true });

      const res = await axiosInstance.post("/meetings/schedule", meetingData);

        toast.success("Meeting scheduled successfully!");
      return {
        success: true,
        meeting: res.data.meeting,
      };
    } catch (error) {
        toast.error("Failed to schedule meeting");
      return {
        success: false,
        message: error.response?.data?.message || "Failed to schedule meeting",
      };
    } finally {
      set({ isSchedulingMeeting: false });
    }
    },
  
    fetchUpcomingMeetings: async () => {
        set({ isFetchingMeetings: true });
        try {
          const res = await axiosInstance.get("/meetings/upcoming"); 
          if (res.data.success) {
            set({ upcomingMeetings: res.data.meetings });
          }
        } catch (error) {
          console.error("Error fetching meetings:", error);
        } finally {
          set({ isFetchingMeetings: false });
        }
      },
}));
