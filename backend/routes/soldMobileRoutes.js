const express = require("express");
const mongoose = require("mongoose");
const SoldMobile = require("../models/SoldMobile");
const Mobile = require("../models/userSchema");

const router = express.Router();

/**
 * Build clean product name
 */
function buildProductName(mobile) {
  const brand = (mobile.brand || "").trim();
  const model = (mobile.model || "").trim();
  const variant = (mobile.variant || "").trim();

  let base = "";
  if (brand && model) {
    base = model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : `${brand} ${model}`;
  } else {
    base = model || brand;
  }

  return variant ? `${base} ${variant}`.trim() : base.trim();
}

/**
 * GET sold mobiles
 */
router.get("/", async (req, res) => {
  try {
    const rows = await SoldMobile.find().sort({
      billingDate: -1,
      createdAt: -1,
    });
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sold mobiles:", err);
    res.status(500).json({ message: "Error fetching sold mobiles" });
  }
});

/**
 * POST /api/soldmobiles/mobile-bill
 * 🔒 SINGLE SOURCE OF TRUTH:
 * - ONLY mobiles with status = "tfb" can be sold
 * - IMEI1 is the authoritative identifier
 */
router.post("/mobile-bill", async (req, res) => {
  try {
    const {
      customer,
      items = [],
      discount = 0,
      billingDate,
      billingDateTimeIST,
      basicPrice, // invoice-level basic price
    } = req.body;

    if (!customer || !items.length) {
      return res.status(400).json({ message: "Invalid bill payload" });
    }

    const invoiceBasicPrice = Number(basicPrice || 0);

    const mobileItems = items.filter((i) => i.type === "mobile");
    if (!mobileItems.length) {
      return res.status(400).json({ message: "No mobile items in bill" });
    }

    const discountPerItem =
      mobileItems.length > 0
        ? Number(discount || 0) / mobileItems.length
        : 0;

    const results = [];

    for (const item of mobileItems) {
      if (!item.imei1) {
        throw new Error("IMEI1 missing for mobile item");
      }

      /**
       * 🔥 CRITICAL FIX
       * Update inventory using ONLY:
       *  - imei1 (unique)
       *  - status must be "tfb"
       */
      const mobile = await Mobile.findOneAndUpdate(
        {
          imei1: item.imei1,
          status: "tfb", // 🔒 must be transferred for billing
        },
        { status: "sold" },
        { new: true }
      );

      if (!mobile) {
        throw new Error(
          `Mobile with IMEI ${item.imei1} not found in TFB stock`
        );
      }

      const sold = await SoldMobile.create({
        customer: customer.name,
        phone: customer.phone,
        product: buildProductName(mobile),

        serialNumber: mobile.serialNumber || "",
        imei1: mobile.imei1,
        imei2: mobile.imei2,
        condition: mobile.condition,

        // ✅ authoritative prices
        basicPrice: invoiceBasicPrice,
        discount: Number(discountPerItem || 0),
        customerPrice: Number(item.price || 0),
        sellingPrice:
          Number(item.price || 0) - Number(discountPerItem || 0),

        billingDate,
        billingDateTimeIST,
      });

      results.push(sold);
    }

    res.status(201).json({
      message: "Bill created successfully",
      sold: results,
    });
  } catch (err) {
    console.error("Mobile billing failed:", err);
    res.status(500).json({
      message: "Billing failed",
      detail: err.message,
    });
  }
});

module.exports = router;
