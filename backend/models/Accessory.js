const mongoose = require("mongoose");

const accessorySchema = new mongoose.Schema(
  {
    accessory: String,
    accessoryType: String,
    modelNumber: String,

    basicPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },

    status: { type: String, default: "ready" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Accessory", accessorySchema);
