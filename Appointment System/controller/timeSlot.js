import TimeSlot from "../models/timeSlotModel.js";
import User from "../models/user.js";

/* ===================== CREATE SLOT ===================== */
export const createTimeSlot = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Start & end time required" });
    }
 
    // Parse dates - handle both ISO strings and timestamps
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Check if end is after start
    if (start >= end) {
      return res.status(400).json({ 
        message: "End time must be after start time",
        debug: {
          startTime: start.toISOString(),
          endTime: end.toISOString()
        }
      });
    }

    // Check for overlapping slots
    const conflict = await TimeSlot.find({
      doctorId,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (conflict.length > 0) {
      return res.status(409).json({ message: "Slot overlap detected" });
    }

    const slot = await TimeSlot.create({ 
      doctorId, 
      startTime: start, 
      endTime: end 
    });

    await User.findByIdAndUpdate(doctorId, { $push: { slots: slot._id } });

    res.status(201).json(slot);
  } catch (error) {
    console.error("Create slot error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET AVAILABLE SLOTS ===================== */
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId required" });
    }

    let query = { doctorId };

    // If date is provided, filter by that date
    // Otherwise, return all slots for the doctor
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Return ALL slots (both booked and available) for the dashboard
    // If you want only available slots for patient booking, add: isBooked: false
    const slots = await TimeSlot.find(query).sort({ startTime: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET ONLY AVAILABLE (UNBOOKED) SLOTS ===================== */
// Add this new endpoint for patient booking
export const getUnbookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId required" });
    }

    let query = { 
      doctorId,
      isBooked: false // Only unbooked slots
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const slots = await TimeSlot.find(query).sort({ startTime: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Get unbooked slots error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===================== MARK SLOT BOOKED ===================== */
export const markSlotBooked = async (req, res) => {
  try {
    const slot = await TimeSlot.findOneAndUpdate(
      { _id: req.params.id, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({ message: "Slot already booked or not found" });
    }

    res.json(slot);
  } catch (err) {
    console.error("Mark slot booked error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===================== DELETE SLOT ===================== */
export const deleteSlot = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { id } = req.params;

    const slot = await TimeSlot.findById(id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    
    if (slot.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    if (slot.isBooked) {
      return res.status(409).json({ message: "Cannot delete a booked slot" });
    }

    await TimeSlot.findByIdAndDelete(id);
    
    // Remove slot reference from user
    await User.findByIdAndUpdate(doctorId, { $pull: { slots: id } });
    
    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Delete slot error:", error);
    res.status(500).json({ message: error.message });
  }
};