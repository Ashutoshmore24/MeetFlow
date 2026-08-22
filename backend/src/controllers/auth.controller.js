import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import { sendVerificationEmail } from "../lib/mailer.js";

// ─── Helper: hash a raw token for safe DB storage ─────────────────────────
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Both fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    generateToken(user._id, res);
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role,
        isVerified: user.isVerified,
        personalRoomId: user.personalRoomId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in login controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const personalRoomId = `mf-${crypto.randomUUID()}`;

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = hashToken(rawToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      personalRoomId,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry,
    });

    await newUser.save();

    // Send verification email (non-blocking — don't fail signup if email fails)
    sendVerificationEmail(newUser.email, rawToken).catch((err) =>
      console.error("Failed to send verification email:", err)
    );

    generateToken(newUser._id, res);

    res.status(201).json({
      message: "Account created successfully. Please check your email to verify your account.",
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        role: newUser.role,
        isVerified: newUser.isVerified,
        personalRoomId: newUser.personalRoomId,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please request a new one.",
      });
    }

    // Mark verified and clear the token fields
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully! You can now use all features." });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Your email is already verified" });
    }

    // Rate-limit: only allow resend if previous token has been used or expired
    const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
    if (
      user.verificationTokenExpiry &&
      user.verificationTokenExpiry > new Date(Date.now() + 24 * 60 * 60 * 1000 - RESEND_COOLDOWN_MS)
    ) {
      return res.status(429).json({ message: "Please wait 1 minute before requesting another email." });
    }

    // Generate a fresh token
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = hashToken(rawToken);
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, rawToken);

    return res.status(200).json({ message: "Verification email sent! Please check your inbox." });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const logout = async (_, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("jwt", {
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const userProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      isVerified: user.isVerified,
      personalRoomId: user.personalRoomId,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.log("Error in userProfile controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePic } = req.body;
    const userId = req.user._id;

    if (!fullName && !profilePic) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updateData = {};
    if (fullName) {
      updateData.fullName = fullName;
    }

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { login, signup, logout, userProfile, updateProfile, verifyEmail, resendVerificationEmail };
