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
 
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

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

    const slot = await TimeSlot.create({ doctorId, startTime: start, endTime: end });

    await User.findByIdAndUpdate(doctorId, { $push: { slots: slot._id } });

    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== GET AVAILABLE SLOTS ===================== */
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) return res.status(400).json({ message: "doctorId required" });

    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await TimeSlot.find({
      doctorId,
      isBooked: false,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: 1 });

    res.json(slots);
  } catch (error) {
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
    res.status(500).json({ message: err.message });
  }
};

/* ===================== DELETE SLOT ===================== */
export const deleteSlot = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { id } = req.params;

    const slot = await TimeSlot.findById(id);

    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.doctorId.toString() !== doctorId.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (slot.isBooked)
      return res.status(409).json({ message: "Cannot delete a booked slot" });

    await TimeSlot.findByIdAndDelete(id);
    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
