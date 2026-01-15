import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import userRouter from "./routes/user.js";
//import googleAuthRouter from "./routes/passport.js";
import appointmentRouter from "./routes/appointment.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./controller/passport.js"; // Configure passport strategies
import cors from "cors";
import paymentRouter from "./routes/paymob.js";

import slotRouter from"./routes/timeSlote.js"

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Initialize passport WITHOUT sessions (we use JWT instead)
app.use(passport.initialize());
// REMOVED: app.use(passport.session()); - Not needed for JWT auth

// Routes
app.use("/api/user", userRouter);

app.use("/api/appointments", appointmentRouter);
app.use("/api/timeSlot", slotRouter);

// Connect to MongoDB and start server
mongoose.connect(process.env.DB_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    const port = process.env.PORT;
    if (!port) {
      console.error("❌ PORT is not defined in environment variables");
      process.exit(1);
    }
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log("✅ Database connected");
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
  });