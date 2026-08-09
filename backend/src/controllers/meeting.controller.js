import Meeting from "../models/Meeting.js";
import User from "../models/User.js";
import generateMeetingCode from "../lib/generateMeetingCode.js";

const createInstantMeeting = async (req, res) => {
  try {
    let meetingCode;
    let existingMeeting;
    do {
      meetingCode = generateMeetingCode();
      existingMeeting = await Meeting.findOne({ meetingCode });
    } while (existingMeeting);

    const meeting = await Meeting.create({
      title: "Instant Meeting",
      meetingCode,
      host: req.user._id,
      meetingType: "instant",
      status: "active",
      startedAt: new Date(),
      participants: [req.user._id],
    });

    const populatedMeeting = await meeting.populate([
      { path: "host", select: "fullName email profilePic" },
      { path: "participants", select: "fullName email profilePic" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Instant meeting created successfully",
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error("Error creating instant meeting:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create instant meeting",
    });
  }
};

const joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;
    if (!meetingCode) {
      return res.status(400).json({
        success: false,
        message: "Meeting code is required",
      });
    }

    const meeting = await Meeting.findOne({ meetingCode });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    if (meeting.status === "ended") {
      return res.status(400).json({
        success: false,
        message: "Meeting has ended",
      });
    }

    const populatedMeeting = await Meeting.findOneAndUpdate(
      { meetingCode },
      { $addToSet: { participants: req.user._id } }, // $addToSet prevents duplicates automatically
      { new: true } // Returns the updated document
    )
      .populate("host", "fullName email profilePic")
      .populate("participants", "fullName email profilePic");

    return res.status(200).json({
      success: true,
      message: "Joined meeting successfully",
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error("Join Meeting Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const scheduleMeeting = async (req, res) => {
  try {
    const { title, scheduledFor } = req.body;

    // 1. Validation checks
    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date and time are required",
      });
    }

    const meetingDate = new Date(scheduledFor);

    // validate the date format
    if (isNaN(meetingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    // Ensure the scheduled date is in the future
    if (meetingDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    // 2. Generate a unique meeting code
    let meetingCode;
    let existingMeeting;
    do {
      meetingCode = generateMeetingCode();
      existingMeeting = await Meeting.findOne({ meetingCode });
    } while (existingMeeting);

    // 3. Create the meeting matching your exact schema fields
    const meeting = await Meeting.create({
      title: title?.trim() || "Untitled Meeting",
      meetingCode,
      host: req.user._id,
      meetingType: "scheduled",
      status: "scheduled",
      scheduledFor: new Date(scheduledFor),
      participants: [req.user._id],
      startedAt: null, // Left null until the meeting actually starts
      endedAt: null,
    });

    // 4. Populate and return response
    const populatedMeeting = await meeting.populate([
      { path: "host", select: "fullName email profilePic" },
      { path: "participants", select: "fullName email profilePic" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Meeting scheduled successfully",
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error("Schedule Meeting Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getUpcommingMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      host: req.user._id,
      meetingType: "scheduled",
      status: "scheduled",
      scheduledFor: { $gt: new Date() },
    })
      .populate("host", "fullName email profilePic")
      .populate("participants", "fullName email profilePic")
      .sort({ scheduledFor: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Get Upcoming Meetings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getHistoryMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDateTime = new Date();

    // Finds meetings where the user is either the host or a participant
    // AND the meeting is explicitly ended/cancelled OR a scheduled meeting's time has passed
    const historyMeetings = await Meeting.find({
      $and: [
        {
          $or: [
            { host: userId },
            { participants: userId }
          ]
        },
        {
          $or: [
            { status: { $in: ["ended", "cancelled"] } },
            {
              status: "scheduled",
              scheduledFor: { $lt: currentDateTime }
            }
          ]
        }
      ]
    })
    .populate("host", "fullName email profilePic")
    .populate("participants", "fullName email profilePic")
    .sort({ scheduledFor: -1  }); // most recent meetings first

    return res.status(200).json({
      success: true,
      message: "History meetings retrieved successfully",
      count: historyMeetings.length,
      meetings: historyMeetings,
    });
  } catch (error) {
    console.error("Get History Meetings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const endMeeting = async (req, res) => {
  try {
      const { meetingId } = req.params;
  
      const meeting = await Meeting.findById(meetingId);
  
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }
  
      // Only host can end meeting
      if (meeting.host.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to end this meeting",
        });
      }
  
      // Prevent ending already ended meeting
      if (meeting.status === "ended") {
        return res.status(400).json({
          success: false,
          message: "Meeting is already ended",
        });
      }
  
      meeting.status = "ended";
      meeting.endedAt = new Date();
  
      await meeting.save();
  
      const populatedMeeting = await Meeting.findById(meeting._id)
        .populate("host", "fullName email profilePic")
        .populate("participants", "fullName email profilePic");
  
      return res.status(200).json({
        success: true,
        message: "Meeting ended successfully",
        meeting: populatedMeeting,
      });
  } catch (error) {
    console.error("End Meeting Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getPersonalRoom = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      room: {
        personalRoomId: req.user.personalRoomId,
        roomLink: `/personal/${req.user.personalRoomId}`,
        host: {
          _id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          profilePic: req.user.profilePic,
        },
      },
    });
  } catch (error) {
    console.error("Get Personal Room Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const joinPersonalRoom = async (req, res) => {
  try {
    const { personalRoomId } = req.body;

    const owner = await User.findOne({
      personalRoomId,
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Personal room not found",
      });
    }

    let meeting = await Meeting.findOne({
      host: owner._id,
      meetingType: "personal",
      status: "active",
    });

    if (!meeting) {
      meeting = await Meeting.create({
        title: `${owner.fullName}'s Personal Room`,
        meetingCode: generateMeetingCode(),
        host: owner._id,
        meetingType: "personal",
        status: "active",
        participants: [owner._id],
        startedAt: new Date(),
      });
    }

    await Meeting.findByIdAndUpdate(
      meeting._id,
      {
        $addToSet: {
          participants: req.user._id,
        },
      },
      { new: true }
    );

    const populatedMeeting = await Meeting.findById(
      meeting._id
    )
      .populate(
        "host",
        "fullName email profilePic"
      )
      .populate(
        "participants",
        "fullName email profilePic"
      );

    return res.status(200).json({
      success: true,
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error("Join Personal Room Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export {
  createInstantMeeting,
  joinMeeting,
  scheduleMeeting,
  getUpcommingMeetings,
  getHistoryMeetings,
  endMeeting,
  getPersonalRoom,
  joinPersonalRoom
};
