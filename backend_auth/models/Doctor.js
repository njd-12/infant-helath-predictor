const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true },
    phone:          { type: String, default: "" },
    specialization: { type: String, default: "General Physician" },
    licenseNumber:  { type: String, required: true },
    role:           { type: String, default: "doctor" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
