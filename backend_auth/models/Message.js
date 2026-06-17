const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", required: true },
    senderId:       { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole:     { type: String, enum: ["user", "doctor"], required: true },
    text:           { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
