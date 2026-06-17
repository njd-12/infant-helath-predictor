const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null },
    reportId:     { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    patientNote:  { type: String, default: "" },          // patient's initial note
    prescription: { type: String, default: "" },          // doctor's prescription
    status: {
      type: String,
      enum: ["pending", "active", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);
