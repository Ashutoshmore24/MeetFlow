import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import crypto from "crypto";

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

    generateToken(user._id, res); // Generate token and send it in the response
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

    // Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Personal Room ID
    const personalRoomId = `mf-${crypto.randomUUID()}`;

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      personalRoomId,
    });

    await newUser.save();

    generateToken(newUser._id, res); // Generate token and send it in the response

    res.status(201).json({
      message: "Account created successfully",
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
    const user = req.user; // Get the user from the request object (set by protectRoute middleware)
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
    });
  } catch (error) {
    console.log("Error in userProfile controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export { login, signup, logout, userProfile };
