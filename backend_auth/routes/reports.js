const router  = require("express").Router();
const protect = require("../middleware/auth");
const Report  = require("../models/Report");

// Save a report after prediction (user only)
router.post("/", protect(["user"]), async (req, res) => {
  try {
    const { modelScore, riskOfDeath, prediction, topFactors, formData } = req.body;
    const report = await Report.create({
      userId:      req.user.id,
      modelScore,
      riskOfDeath,
      prediction,
      topFactors:  topFactors || [],
      formData:    formData   || {},
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reports for the logged-in user
router.get("/my", protect(["user"]), async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single report (user must own it)
router.get("/:id", protect(["user", "doctor"]), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("userId", "name email phone");
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
