const router       = require("express").Router();
const protect      = require("../middleware/auth");
const Consultation = require("../models/Consultation");
const Report       = require("../models/Report");
const Message      = require("../models/Message");
const PDFDocument  = require("pdfkit");

// ── Patient: request a consultation ───────────────────
router.post("/request", protect(["user"]), async (req, res) => {
  try {
    const { reportId, note } = req.body;
    if (!reportId) return res.status(400).json({ message: "reportId is required" });

    // Verify report belongs to user
    const report = await Report.findOne({ _id: reportId, userId: req.user.id });
    if (!report) return res.status(404).json({ message: "Report not found" });

    const consultation = await Consultation.create({
      userId:      req.user.id,
      reportId,
      patientNote: note || "",
    });
    res.status(201).json(consultation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Patient: get own consultations ────────────────────
router.get("/my", protect(["user"]), async (req, res) => {
  try {
    const list = await Consultation.find({ userId: req.user.id })
      .populate("doctorId", "name email specialization")
      .populate("reportId", "prediction riskOfDeath createdAt")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Doctor: get all pending + active + closed consultations ────
router.get("/dashboard", protect(["doctor"]), async (req, res) => {
  try {
    const list = await Consultation.find({
      $or: [
        { status: "pending" },
        { doctorId: req.user.id },   // active + closed ones assigned to this doctor
      ],
    })
      .populate("userId",   "name email phone")
      .populate("reportId", "prediction riskOfDeath topFactors createdAt")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Doctor: accept a consultation ─────────────────────
router.patch("/:id/accept", protect(["doctor"]), async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { doctorId: req.user.id, status: "active" },
      { new: true }
    );
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Doctor: send prescription and close ───────────────
router.patch("/:id/prescribe", protect(["doctor"]), async (req, res) => {
  try {
    const { prescription } = req.body;
    if (!prescription) return res.status(400).json({ message: "prescription is required" });

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user.id },
      { prescription, status: "closed" },
      { new: true }
    );
    if (!consultation) return res.status(404).json({ message: "Consultation not found or not yours" });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get single consultation detail ────────────────────
router.get("/:id", protect(["user", "doctor"]), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("userId",   "name email phone")
      .populate("doctorId", "name email specialization")
      .populate("reportId");
    if (!consultation) return res.status(404).json({ message: "Not found" });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Generate Prescription PDF ─────────────────────────
router.get("/:id/prescription-pdf", protect(["user", "doctor"]), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("userId",   "name email phone")
      .populate("doctorId", "name email specialization licenseNumber phone")
      .populate("reportId", "prediction riskOfDeath topFactors createdAt");

    if (!consultation) return res.status(404).json({ message: "Not found" });
    if (!consultation.prescription)
      return res.status(400).json({ message: "No prescription issued yet" });

    const isUser   = req.user.role === "user"   && consultation.userId._id.toString()   === req.user.id;
    const isDoctor = req.user.role === "doctor" && consultation.doctorId?._id.toString() === req.user.id;
    if (!isUser && !isDoctor)
      return res.status(403).json({ message: "Access denied" });

    const doc    = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="prescription_${consultation._id}.pdf"`);
      res.send(pdf);
    });

    const doctor  = consultation.doctorId;
    const patient = consultation.userId;
    const report  = consultation.reportId;
    const date    = new Date(consultation.updatedAt).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const PW = doc.page.width;   // 595
    const PH = doc.page.height;  // 842
    const L  = 45;               // left margin
    const R  = PW - 45;          // right edge
    const W  = R - L;            // usable width = 505

    // ── HEADER BAND ───────────────────────────────────
    doc.rect(0, 0, PW, 75).fill("#1d4ed8");
    doc.fillColor("white").fontSize(18).font("Helvetica-Bold")
       .text("InfantCare AI  -  Medical Prescription", L, 18, { width: W });
    doc.fontSize(9).font("Helvetica")
       .text("Infant Mortality Risk Assessment & Consultation Platform", L, 44, { width: W });

    // ── DOCTOR BLOCK ──────────────────────────────────
    doc.rect(L, 85, W, 62).fill("#eff6ff");
    doc.fillColor("#1e3a5f").fontSize(12).font("Helvetica-Bold")
       .text(`Dr. ${doctor?.name || "N/A"}`, L + 10, 92);
    doc.fontSize(9).font("Helvetica").fillColor("#374151")
       .text(`Specialization : ${doctor?.specialization || "General Physician"}`, L + 10, 108)
       .text(`License No     : ${doctor?.licenseNumber  || "N/A"}`,               L + 10, 121)
       .text(`Email : ${doctor?.email || "N/A"}`,  L + 260, 108)
       .text(`Phone : ${doctor?.phone || "N/A"}`,  L + 260, 121);

    // ── DIVIDER ───────────────────────────────────────
    doc.moveTo(L, 158).lineTo(R, 158).strokeColor("#bfdbfe").lineWidth(0.8).stroke();

    // ── PATIENT + DATE ROW ────────────────────────────
    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold")
       .text("Patient :", L, 166)
       .text("Date    :", L + 300, 166);
    doc.font("Helvetica").fillColor("#374151")
       .text(patient?.name  || "N/A", L + 55,  166)
       .text(date,                    L + 345,  166);

    doc.font("Helvetica-Bold").fillColor("#111827")
       .text("Email   :", L, 180)
       .text("Phone   :", L + 300, 180);
    doc.font("Helvetica").fillColor("#374151")
       .text(patient?.email || "N/A", L + 55,  180)
       .text(patient?.phone || "N/A", L + 345, 180);

    // ── RISK SUMMARY BAR ──────────────────────────────
    if (report) {
      const riskScore = Math.round(report.riskOfDeath * 100);
      const riskBg   = report.prediction === "High Risk"     ? "#fef2f2"
                     : report.prediction === "Moderate Risk" ? "#fefce8" : "#f0fdf4";
      const riskClr  = report.prediction === "High Risk"     ? "#991b1b"
                     : report.prediction === "Moderate Risk" ? "#854d0e" : "#166534";
      doc.rect(L, 198, W, 26).fill(riskBg);
      doc.fillColor(riskClr).fontSize(9).font("Helvetica-Bold")
         .text(
           `Risk Assessment : ${report.prediction}   |   Risk Score : ${riskScore}%`,
           L + 10, 207, { width: W - 20 }
         );
    }

    // ── Rx LABEL ──────────────────────────────────────
    const rxY = report ? 236 : 198;

    doc.rect(L, rxY, 32, 20).fill("#1d4ed8");
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold")
       .text("Rx", L + 7, rxY + 4);

    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
       .text("Prescription & Medical Advice", L + 40, rxY + 4);

    doc.moveTo(L, rxY + 24).lineTo(R, rxY + 24)
       .strokeColor("#93c5fd").lineWidth(0.8).stroke();

    // ── PRESCRIPTION BOX ──────────────────────────────
    // Fixed height box — truncate to fit single page
    const boxTop = rxY + 32;
    const boxH   = 165;  // fixed height, fits any prescription on one page

    doc.rect(L, boxTop, W, boxH).fill("#f8fafc").stroke("#e2e8f0");
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica")
       .text(consultation.prescription, L + 10, boxTop + 10, {
         width: W - 20,
         height: boxH - 18,
         lineGap: 3,
         ellipsis: false,
       });

    // ── RISK FACTORS (compact, single line each) ──────
    if (report?.topFactors?.length > 0) {
      const fTop = boxTop + boxH + 12;
      doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold")
         .text("Key Risk Factors:", L, fTop);

      // Show max 3 factors in one row to save space
      report.topFactors.slice(0, 3).forEach((f, i) => {
        const fx    = L + i * 170;
        const color = f.direction === "Increased Risk" ? "#dc2626" : "#16a34a";
        const arrow = f.direction === "Increased Risk" ? "(+)" : "(-)";
        doc.fillColor(color).fontSize(8.5).font("Helvetica")
           .text(`${arrow} ${f.feature}`, fx, fTop + 13, { width: 160 });
      });
    }

    // ── SIGNATURE BLOCK ───────────────────────────────
    // Fixed at y=690 so it never moves regardless of content above
    const sigY = 685;

    doc.moveTo(L, sigY).lineTo(R, sigY)
       .strokeColor("#cbd5e1").lineWidth(0.8).dash(4, { space: 3 }).stroke();
    doc.undash();

    // Signature line — right aligned
    doc.moveTo(R - 175, sigY + 48).lineTo(R, sigY + 48)
       .strokeColor("#374151").lineWidth(0.8).stroke();

    doc.fillColor("#111827").fontSize(9).font("Helvetica-Bold")
       .text(`Dr. ${doctor?.name || ""}`, R - 175, sigY + 52, { width: 175, align: "center" });
    doc.fillColor("#374151").fontSize(8).font("Helvetica")
       .text(doctor?.specialization || "General Physician", R - 175, sigY + 64, { width: 175, align: "center" })
       .text(`Lic. No: ${doctor?.licenseNumber || ""}`,     R - 175, sigY + 75, { width: 175, align: "center" });

    // Left side — date of issue
    doc.fillColor("#374151").fontSize(8).font("Helvetica")
       .text(`Date of Issue: ${date}`, L, sigY + 52);

    // Disclaimer
    doc.fillColor("#9ca3af").fontSize(7.5).font("Helvetica")
       .text(
         "This prescription was issued via InfantCare AI. Always follow prescribed dosage and consult your doctor for any concerns.",
         L, sigY + 95, { width: W, align: "center" }
       );

    // ── FOOTER BAND ───────────────────────────────────
    doc.rect(0, PH - 28, PW, 28).fill("#1d4ed8");
    doc.fillColor("white").fontSize(8).font("Helvetica")
       .text("InfantCare AI  |  Confidential Medical Document", 0, PH - 18, {
         width: PW, align: "center",
       });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
