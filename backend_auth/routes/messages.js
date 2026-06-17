const router       = require("express").Router();
const protect      = require("../middleware/auth");
const Message      = require("../models/Message");
const Consultation = require("../models/Consultation");

// ── Send a message ─────────────────────────────────────
router.post("/", protect(["user", "doctor"]), async (req, res) => {
  try {
    const { consultationId, text } = req.body;
    if (!consultationId || !text)
      return res.status(400).json({ message: "consultationId and text are required" });

    // Verify the sender is part of this consultation
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });

    const isUser   = req.user.role === "user"   && consultation.userId.toString()   === req.user.id;
    const isDoctor = req.user.role === "doctor" && consultation.doctorId?.toString() === req.user.id;

    if (!isUser && !isDoctor)
      return res.status(403).json({ message: "You are not part of this consultation" });

    const message = await Message.create({
      consultationId,
      senderId:   req.user.id,
      senderRole: req.user.role,
      text,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all messages for a consultation ────────────────
router.get("/:consultationId", protect(["user", "doctor"]), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.consultationId);
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });

    const isUser   = req.user.role === "user"   && consultation.userId.toString()   === req.user.id;
    const isDoctor = req.user.role === "doctor" && consultation.doctorId?.toString() === req.user.id;

    if (!isUser && !isDoctor)
      return res.status(403).json({ message: "Access denied" });

    const messages = await Message.find({ consultationId: req.params.consultationId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
