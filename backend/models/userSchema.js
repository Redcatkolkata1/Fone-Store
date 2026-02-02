// backend/models/userSchema.js
const mongoose = require("mongoose");

const mobileSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, default: "", trim: true },
    condition: { type: String, default: "", trim: true },

    basicPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    marginAmount: { type: Number, default: 0, min: 0 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },

    // ✅ STORED AS PROVIDED
    finalPrice: { type: Number, required: true, min: 0 },

    serialNumber: { type: String, trim: true, default: "" },

    imei1: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{15}$/, "IMEI must be 15 digits"],
    },

    imei2: {
      type: String,
      trim: true,
      default: "",
      match: [/^\d{15}$/, "IMEI must be 15 digits"],
    },

    status: {
      type: String,
      enum: ["ready", "tfb", "sold"],
      default: "ready",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mobile", mobileSchema);