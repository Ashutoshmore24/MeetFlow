import express from "express";
import { login, signup, logout , userProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection); // Apply Arcjet protection to all routes

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);

router.get("/me",protectRoute, userProfile); 

export default router;