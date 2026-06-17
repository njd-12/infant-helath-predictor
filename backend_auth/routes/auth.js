const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Doctor  = require("../models/Doctor");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── User register ──────────────────────────────────────
router.post("/user/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email and password are required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, phone });

    const token = signToken({ id: user._id, role: "user", name: user.name, email: user.email });
    res.status(201).json({ token, user: { id: user._id, name, email, role: "user" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── User login ─────────────────────────────────────────
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id, role: "user", name: user.name, email: user.email });
    res.json({ token, user: { id: user._id, name: user.name, email, role: "user" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Doctor register ────────────────────────────────────
router.post("/doctor/register", async (req, res) => {
  try {
    const { name, email, password, phone, specialization, licenseNumber } = req.body;
    if (!name || !email || !password || !licenseNumber)
      return res.status(400).json({ message: "name, email, password and licenseNumber are required" });

    const exists = await Doctor.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const doctor = await Doctor.create({ name, email, password: hashed, phone, specialization, licenseNumber });

    const token = signToken({ id: doctor._id, role: "doctor", name: doctor.name, email: doctor.email });
    res.status(201).json({ token, user: { id: doctor._id, name, email, role: "doctor" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Doctor login ───────────────────────────────────────
router.post("/doctor/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, doctor.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: doctor._id, role: "doctor", name: doctor.name, email: doctor.email });
    res.json({ token, user: { id: doctor._id, name: doctor.name, email, role: "doctor" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
