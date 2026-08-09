import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Meeting",
    },

    meetingCode: {
      type: String,
      required: true,
      unique: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    meetingType: {
      type: String,
      enum: ["instant", "scheduled", "personal"],
      default: "instant",
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["scheduled", "active", "ended", "cancelled"],
      default: "scheduled",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
