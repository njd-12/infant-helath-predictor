const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    modelScore:  { type: Number, required: true },
    riskOfDeath: { type: Number, required: true },
    prediction:  { type: String, required: true },   // Low / Moderate / High Risk
    topFactors:  { type: Array,  default: [] },
    formData:    { type: Object, default: {} },       // raw input fields
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
