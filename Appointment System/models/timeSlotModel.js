
import mongoose from "mongoose"
const timeSlotSchema = new mongoose.Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
   startTime: {
  type: Date,
  required: true,
},
endTime: {
  type: Date,
  required: true,
},

     isBooked: {
    type: Boolean,
    default: false,
  },
})
export default mongoose.model("TimeSlot", timeSlotSchema);