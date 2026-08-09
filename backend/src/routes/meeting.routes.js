import express from "express";
import { createInstantMeeting , joinMeeting, scheduleMeeting, getUpcommingMeetings, getHistoryMeetings, endMeeting, getPersonalRoom, joinPersonalRoom} from "../controllers/meeting.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protectRoute, createInstantMeeting);
router.post("/join", protectRoute, joinMeeting);
router.post("/schedule", protectRoute, scheduleMeeting);
router.get("/upcoming", protectRoute, getUpcommingMeetings);
router.get("/history", protectRoute, getHistoryMeetings);
router.patch("/:meetingId/end", protectRoute, endMeeting);

router.get("/personal-room", protectRoute, getPersonalRoom);  
router.post("/personal-room/join", protectRoute, joinPersonalRoom);  


export default router;