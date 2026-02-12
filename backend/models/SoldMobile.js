const mongoose = require("mongoose");

const SoldMobileSchema = new mongoose.Schema(
  {
    customer: String,
    phone: String,
    product: String,

    serialNumber: String,
    imei1: String,
    imei2: String,
    condition: String,

    // 🔒 SOURCE OF TRUTH — NO CALCULATION
    basicPrice: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    customerPrice: Number,
    sellingPrice: Number,

    billingDate: String,
    billingDateTimeIST: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("SoldMobile", SoldMobileSchema);
