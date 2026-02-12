const express = require("express");
const mongoose = require("mongoose");
const Accessory = require("../models/Accessory");

const router = express.Router();

/* ----------------------------------------------------
   POST — Add accessory
---------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };

    payload.status = payload.status || "ready";

    const item = await Accessory.create(payload);
    res.status(201).json(item);
  } catch (err) {
    console.error("Add accessory failed:", err);
    res.status(500).json({ message: "Failed to add accessory" });
  }
});

/* ----------------------------------------------------
   GET — Fetch accessories (filtered by status)
   IMPORTANT: sold items are excluded by default
---------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    } else {
      // Default behavior: DO NOT return sold accessories
      query.status = { $ne: "sold" };
    }

    const accessories = await Accessory.find(query).sort({ createdAt: -1 });
    res.json(accessories);
  } catch (err) {
    console.error("Fetch accessories failed:", err);
    res.status(500).json({ message: "Failed to fetch accessories" });
  }
});

/* ----------------------------------------------------
   PATCH — Transfer accessory for billing (READY → TFB)
---------------------------------------------------- */
router.patch("/:id/transfer", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid accessory ID" });
    }

    const item = await Accessory.findOneAndUpdate(
      { _id: id, status: "ready" },
      { status: "tfb" },
      { new: true }
    );

    if (!item) {
      return res
        .status(404)
        .json({ message: "Accessory not found or not in READY state" });
    }

    res.json(item);
  } catch (err) {
    console.error("Transfer for billing failed:", err);
    res.status(500).json({ message: "Failed to transfer accessory" });
  }
});

/* ----------------------------------------------------
   PATCH — Cancel transfer (TFB → READY)
---------------------------------------------------- */
router.patch("/:id/cancel-transfer", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid accessory ID" });
    }

    const item = await Accessory.findOneAndUpdate(
      { _id: id, status: "tfb" },
      { status: "ready" },
      { new: true }
    );

    if (!item) {
      return res
        .status(404)
        .json({ message: "Accessory not found or not in TFB state" });
    }

    res.json(item);
  } catch (err) {
    console.error("Cancel transfer failed:", err);
    res.status(500).json({ message: "Failed to cancel transfer" });
  }
});

/* ----------------------------------------------------
   PATCH — Mark accessory as SOLD (TFB → SOLD)
---------------------------------------------------- */
router.patch("/:id/mark-sold", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid accessory ID" });
    }

    const accessory = await Accessory.findOneAndUpdate(
      { _id: id, status: "tfb" },
      {
        status: "sold",
        soldAt: new Date(),
      },
      { new: true }
    );

    if (!accessory) {
      return res.status(404).json({
        message: "Accessory not found or already sold",
      });
    }

    res.json(accessory);
  } catch (err) {
    console.error("Mark sold failed:", err);
    res.status(500).json({ message: "Failed to mark accessory as sold" });
  }
});

/* ----------------------------------------------------
   DELETE — Permanently delete accessory
---------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid accessory ID" });
    }

    const deleted = await Accessory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Accessory not found" });
    }

    res.json({ message: "Accessory deleted successfully" });
  } catch (err) {
    console.error("Delete accessory failed:", err);
    res.status(500).json({ message: "Failed to delete accessory" });
  }
});

module.exports = router;
