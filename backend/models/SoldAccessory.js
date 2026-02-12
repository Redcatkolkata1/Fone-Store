// backend/models/SoldAccessory.js
const mongoose = require("mongoose");

const SoldAccessorySchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    phone: { type: String, required: true },
    accessory: { type: String, required: true },      // product name
    accessoryType: { type: String, default: "" },
    modelNumber: { type: String, default: "" },

    retailerPrice: { type: Number, default: 0 },
    customerPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },

    billingDate: { type: String, required: true },     // YYYY-MM-DD     
    billingDateTimeIST: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SoldAccessory", SoldAccessorySchema);
