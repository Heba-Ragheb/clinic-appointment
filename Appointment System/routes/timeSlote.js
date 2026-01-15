import express from "express";
import {
  createTimeSlot,
  getAvailableSlots,
  deleteSlot,
  markSlotBooked,
} from "../controller/timeSlot.js";

import { authJwt } from "../middleware/auth.js";


const router = express.Router();
router.post("/create", authJwt, createTimeSlot);
router.get("/", getAvailableSlots);
router.patch("/:id/book", authJwt, markSlotBooked);

router.delete("/:id", authJwt, deleteSlot);

export default router;
