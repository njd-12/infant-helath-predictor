require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express       = require("express");
const cors          = require("cors");
const connectDB     = require("./config/db");

const authRoutes          = require("./routes/auth");
const reportRoutes        = require("./routes/reports");
const consultationRoutes  = require("./routes/consultations");
const messageRoutes       = require("./routes/messages");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/auth",          authRoutes);
app.use("/reports",       reportRoutes);
app.use("/consultations", consultationRoutes);
app.use("/messages",      messageRoutes);

// ── Health check ───────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "Auth API running ✓" }));

// ── 404 handler ────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`✓ Auth server running on http://localhost:${PORT}`));
