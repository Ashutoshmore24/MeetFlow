import express from "express";
import { login, signup, logout, userProfile, updateProfile, verifyEmail, resendVerificationEmail } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection); // Apply Arcjet protection to all routes

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);

router.get("/me", protectRoute, userProfile);
router.put("/update-profile", protectRoute, updateProfile);

// Email verification routes
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protectRoute, resendVerificationEmail);

export default router;