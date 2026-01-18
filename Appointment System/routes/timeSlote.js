import express from "express";
import {
  createTimeSlot,
  getAvailableSlots,
  deleteSlot,
  markSlotBooked,
  getUnbookedSlots,
} from "../controller/timeSlot.js";
import { authJwt } from "../middleware/auth.js";

const router = express.Router();

// Doctor creates slot
router.post("/create", authJwt, createTimeSlot);

// Get available slots (anyone)
router.get("/", getAvailableSlots);

// Book slot (patient/admin)
router.patch("/:id/book", authJwt, markSlotBooked);

// Delete slot (doctor only)
router.delete("/:id", authJwt, deleteSlot);
router.get("/available", authJwt, getUnbookedSlots);

export default router;
