// controller/appointmentController.js
import mongoose from "mongoose";
import User from "../models/user.js";
import Appointment from "../models/appointmentModel.js";
import TimeSlot from "../models/timeSlotModel.js";
import dotenv from "dotenv";
import emailService from "../Mail/emailService.js";
import { invalidateCache } from "../helpers/invalidateCache.js";
import { errorHandler } from "../helpers/errorHandler.js";

dotenv.config();

export const store = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const patientId = req.user._id;
    const { slotId } = req.body;

    // Fetch slot
    const slot = await TimeSlot.findById(slotId).session(session);
    if (!slot || slot.isBooked) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Slot not available" });
    }

    const doctorId = slot.doctor;

    if (patientId.toString() === doctorId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cannot book yourself" });
    }

    // Create appointment
    const appointment = await Appointment.create(
      [
        {
          patientId: patientId,
          doctorId: doctorId,
          timeSlotId: slotId,
          status: "confirmed",
        },
      ],
      { session }
    );

    // Mark slot as booked
    slot.isBooked = true;
    await slot.save({ session });

    // Link appointment to users
    await User.findByIdAndUpdate(
      patientId,
      { $push: { appointments: appointment[0]._id } },
      { session }
    );

    await User.findByIdAndUpdate(
      doctorId,
      { $push: { appointments: appointment[0]._id } },
      { session }
    );

    await session.commitTransaction();
    await invalidateCache(["/api/appointments", "/api/slots"]);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: appointment[0],
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Failed to book appointment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const deleteAppointUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const appointment = await Appointment.findById(req.params.id).session(session);

    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not allowed" });
    }

    // Free the slot
    await TimeSlot.findByIdAndUpdate(
      appointment.timeSlotId,
      { isBooked: false },
      { session }
    );

    // Update appointment status to cancelled
    await Appointment.findByIdAndUpdate(
      appointment._id,
      { status: "cancelled" },
      { session }
    );

    await session.commitTransaction();
    await invalidateCache(["/api/appointments"]);

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteAppointDoctor = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const role = req.user.role;
    const appointmentId = req.params.id;

    // Check if user is authorized
    if (role === "Patient") {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not authorized" });
    }

    const appointment = await Appointment.findById(appointmentId).session(session);

    if (!appointment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if doctor owns this appointment
    if (
      role === "Doctor" &&
      appointment.doctorId.toString() !== req.user._id.toString()
    ) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not allowed" });
    }

    // Free the slot
    await TimeSlot.findByIdAndUpdate(
      appointment.timeSlotId,
      { isBooked: false },
      { session }
    );

    // Update appointment status to cancelled
    await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { session }
    );

    // Send email to patient
    const patient = await User.findById(appointment.patientId);
    if (patient && patient.email) {
      await emailService.sendAppointmentDeletion(
        patient.email,
        appointment.createdAt
      );
    }

    await session.commitTransaction();
    await invalidateCache([
      `/api/appointments/${appointmentId}`,
      `/api/appointments`,
    ]);

    res.json({ message: "Appointment cancelled successfully", data: [] });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      message: "An error occurred while cancelling the appointment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const update = async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check authorization
    if (
      req.user.role === "Patient" &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    appointment.status = status;
    await appointment.save();

    await invalidateCache(["/api/appointments"]);

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update appointment",
      error: error.message,
    });
  }
};

export const index = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    // Build filter based on role
    let filter = {};
    if (role === "Doctor") {
      filter = { doctorId: userId };
    } else if (role === "Nurse") {
      filter = { nurseId: userId };
    } else if (role === "Patient") {
      filter = { patientId: userId };
    }
    // Admin sees all appointments (no filter)

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch appointments with proper population
    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email phone")
      .populate("doctorId", "name email specialty")
      .populate("timeSlotId", "startTime endTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAppointments = await Appointment.countDocuments(filter);

    // ✅ RETURN EMPTY ARRAY INSTEAD OF 404
    res.status(200).json({
      message: appointments.length > 0 
        ? "Appointments retrieved successfully" 
        : "No appointments found",
      data: appointments,
      totalAppointments: totalAppointments,
      currentPage: page,
      totalPages: Math.ceil(totalAppointments / limit),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      message: "An error occurred while fetching appointments",
      error: error.message,
    });
  }
};

export const show = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = req.user;

    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email phone")
      .populate("doctorId", "name email specialty")
      .populate("timeSlotId", "startTime endTime");

    if (!appointment) {
      return next(errorHandler(404, "Appointment not found"));
    }

    // Check authorization
    if (
      user.role !== "Admin" &&
      user.role !== "Nurse" &&
      user._id.toString() !== appointment.patientId._id.toString() &&
      user._id.toString() !== appointment.doctorId._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized operation",
      });
    }

    res.status(200).json({
      message: "Appointment retrieved successfully",
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to retrieve appointment",
      error: error.message,
    });
  }
};