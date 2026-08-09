import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import ENV from "./lib/env.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import cors from "cors";

const app = express();

const PORT = ENV.PORT;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log("Server is not running due to database connection error");
  }
}

startServer();

