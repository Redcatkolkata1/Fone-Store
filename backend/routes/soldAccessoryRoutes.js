// backend/routes/soldAccessoryRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const SoldAccessory = require("../models/SoldAccessory");
const Accessory = require("../models/Accessory");

const router = express.Router();

/**
 * POST /api/soldaccessories/accessory-bill
 * 🔒 SINGLE SOURCE OF TRUTH:
 * - Only accessories in TFB can be sold
 * - Inventory update MUST succeed before sale is recorded
 */
router.post("/accessory-bill", async (req, res) => {
  try {
    const {
      invoiceDate,
      customer,
      items = [],
      discount = 0,
      billingDate: bodyBillingDate,
      billingDateTimeIST,
    } = req.body;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid bill payload" });
    }

    const accessoryItems = items.filter(
      (it) => it.type === "accessory"
    );

    if (accessoryItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No accessory items found in bill" });
    }

    const discountNum = Number(discount || 0);
    const perItemDiscount =
      accessoryItems.length > 0
        ? discountNum / accessoryItems.length
        : 0;

    const billingDate =
      bodyBillingDate ||
      invoiceDate ||
      new Date().toISOString().slice(0, 10);

    const createdDocs = [];

    for (const item of accessoryItems) {
      if (!item.sku || !mongoose.Types.ObjectId.isValid(item.sku)) {
        throw new Error("Accessory SKU (ID) missing or invalid");
      }

      /**
       * 🔥 CRITICAL FIX
       * Update inventory ONLY if accessory is in TFB
       */
      const accessory = await Accessory.findOneAndUpdate(
        {
          _id: item.sku,
          status: "tfb", // 🔒 must be transferred for billing
        },
        {
          status: "sold",
          soldAt: new Date(),
        },
        { new: true }
      );

      if (!accessory) {
        throw new Error(
          `Accessory ${item.sku} not found in TFB stock`
        );
      }

      const retailerPrice =
        Number(accessory.retailerPrice ?? 0);

      const customerPrice =
        Number(accessory.customerPrice ?? item.price ?? 0);

      const sellingPrice =
        customerPrice - perItemDiscount;

      const sold = await SoldAccessory.create({
        customer: customer.name || "",
        phone: customer.phone || "",
        accessory: accessory.accessory,
        accessoryType: accessory.accessoryType || "",
        modelNumber: accessory.modelNumber || "",
        retailerPrice,
        customerPrice,
        discount: perItemDiscount,
        sellingPrice,
        billingDate,
        billingDateTimeIST: billingDateTimeIST || null,
      });

      createdDocs.push(sold);
    }

    return res.status(201).json({
      message: "Accessory bill saved and stock updated",
      sold: createdDocs,
    });
  } catch (err) {
    console.error("Error saving sold accessories:", err);
    return res.status(500).json({
      message: "Accessory billing failed",
      detail: err.message,
    });
  }
});

/**
 * GET /api/soldaccessories
 */
router.get("/", async (req, res) => {
  try {
    const rows = await SoldAccessory.find().sort({
      billingDate: -1,
      createdAt: -1,
    });
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sold accessories:", err);
    res.status(500).json({
      message: "Error fetching sold accessories",
    });
  }
});

module.exports = router;
