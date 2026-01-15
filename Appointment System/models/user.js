import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        googleId: { type: String },
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["Patient", "Doctor", "Nurse", "Admin"], required: true },
        specialty: { type: String },
        bio: { type: String },
        phone: { type: String },
        appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }],
        slots: [{ type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" }]
    }, { timestamps: true }
)
const User = mongoose.model("User", userSchema);
export default User