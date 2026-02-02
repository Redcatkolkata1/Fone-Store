// backend/routes/router.js

const express = require("express");
const mongoose = require("mongoose");
const Mobile = require("../models/userSchema");

const router = express.Router();

/* ==================== Utility Helpers ==================== */

const toNum = (v, def = 0) => {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

/**
 * FINAL PRICE FORMULA (AUTHORITATIVE)
 * Final Price = Basic Price + CGST + SGST + Margin − Discount
 */
function computeFinalPrice(
  basicPrice = 0,
  marginAmount = 0,
  cgstAmount = 0,
  sgstAmount = 0,
  discountAmount = 0
) {
  const final =
    Number(basicPrice || 0) +
    Number(marginAmount || 0) +
    Number(cgstAmount || 0) +
    Number(sgstAmount || 0) -
    Number(discountAmount || 0);

  return Math.max(Number(final.toFixed(2)), 0);
}

/* ==================== ROUTES ==================== */

/**
 * POST /api/mobiles
 * Add new mobile stock
 */
router.post("/", async (req, res) => {
  try {
    const payload = {
      brand: String(req.body.brand || "").trim(),
      model: String(req.body.model || "").trim(),
      variant: String(req.body.variant || "").trim(),
      condition: String(req.body.condition || "").trim(),

      basicPrice: toNum(req.body.basicPrice),
      discountAmount: toNum(req.body.discountAmount),
      marginAmount: toNum(req.body.marginAmount),
      cgstAmount: toNum(req.body.cgstAmount),
      sgstAmount: toNum(req.body.sgstAmount),

      // ✅ TRUST FRONTEND / EXCEL
      finalPrice: toNum(req.body.finalPrice),

      serialNumber: String(req.body.serialNumber || "").trim(),
      imei1: String(req.body.imei1 || "").trim(),
      imei2: String(req.body.imei2 || "").trim(),

      status: req.body.status || "ready",
    };

    if (!payload.brand || !payload.model || !payload.imei1) {
      return res.status(400).json({ message: "brand, model, imei1 required" });
    }

    if (!payload.finalPrice || payload.finalPrice <= 0) {
      return res.status(400).json({ message: "finalPrice is required" });
    }

    const mobile = await Mobile.create(payload);
    res.status(201).json(mobile);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.code === 11000) {
      return res.status(409).json({ message: "IMEI already exists" });
    }

    console.error("Insert error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/mobiles
 */
router.get("/", async (req, res) => {
  try {
    const { status, brand, model, variant } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (brand) filter.brand = brand;
    if (model) filter.model = model;
    if (variant) filter.variant = variant;

    const mobiles = await Mobile.find(filter).sort({ createdAt: -1 });
    res.json(mobiles);
  } catch (error) {
    console.error("Error fetching mobiles:", error);
    res.status(500).json({
      message: "Error fetching mobiles",
    });
  }
});

/**
 * PATCH /api/mobiles/:id/transfer
 */
router.patch("/:id/transfer", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const mobile = await Mobile.findByIdAndUpdate(
      id,
      { $set: { status: "tfb" } },
      { new: true }
    );

    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    console.error("Error transferring mobile:", error);
    res.status(500).json({
      message: "Error transferring mobile",
    });
  }
});

/**
 * PATCH /api/mobiles/mark-sold
 */
router.patch("/mark-sold", async (req, res) => {
  try {
    const { imei1 } = req.body;

    if (!imei1) {
      return res.status(400).json({ message: "imei1 is required" });
    }

    const mobile = await Mobile.findOneAndUpdate(
      { imei1 },
      { status: "sold" },
      { new: true }
    );

    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    console.error("Error marking mobile sold:", error);
    res.status(500).json({
      message: "Error marking mobile sold",
    });
  }
});

/**
 * PATCH /api/mobiles/:id/cancel
 */
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { imei1: id };

    const mobile = await Mobile.findOneAndUpdate(
      query,
      { status: "ready" },
      { new: true }
    );

    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    console.error("Cancel transfer error:", error);
    res.status(500).json({
      message: "Error canceling billing transfer",
    });
  }
});

/**
 * DELETE /api/mobiles/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const deleted = await Mobile.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json({
      message: "Mobile deleted successfully",
      mobile: deleted,
    });
  } catch (error) {
    console.error("Delete mobile error:", error);
    res.status(500).json({
      message: "Error deleting mobile",
    });
  }
});

module.exports = router;