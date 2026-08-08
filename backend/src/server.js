import express from "express";
import ENV from "./lib/env.js";
import connectDB from "./config/db.js";

const app = express();

const PORT = ENV.PORT;

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

