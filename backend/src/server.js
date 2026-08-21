import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import ENV from "./lib/env.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import cors from "cors";
import http from "http";
import { initializeSocket } from "./socket/socket.js";

const app = express();
const server = http.createServer(app);

const PORT = ENV.PORT;

// Initialize Socket.IO
initializeSocket(server);

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());


app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// Serve frontend in production — Render builds the frontend into backend/dist
if (ENV.NODE_ENV === "production") {
  const __dirname = import.meta.dirname;
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
} else {
  // Dev-only health check route
  app.get("/", (req, res) => {
    res.send("Hello from the backend!");
  });
}

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log("Server is not running due to database connection error");
  }
}

startServer();

