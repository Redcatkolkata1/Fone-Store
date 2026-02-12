// src/components/Billing.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import "./Billing.css";
import BRANDS from "../assets/db/brands";
import ACCESSORIES from "../assets/db/accessories";
import ACCTYPES from "../assets/db/acctypes";
import Bill from "./Bill";
import { StockContext } from "./StockContext";

/* small presentational inputs */
const Input = (props) => <input className="cust-input" {...props} />;
const Textarea = (props) => <textarea className="cust-textarea" {...props} />;

/* ProductSelector (Select Mobile) */
function ProductSelector({
  models,
  onLoadModels,
  onLoadVariants,
  selectedBrand,
  setSelectedBrand,
  selectedModel,
  setSelectedModel,
  selectedVariant,
  setSelectedVariant,
  variantName,
  setVariantName,
  variantSku,
  setVariantSku,
  setRetailerPrice,
  basicPrice,
  setBasicPrice,
  margin,
  setMargin,
  imei1,
  setImei1,
  imei2,
  setImei2,
  condition,
  setCondition,
  conditionOptions,
  serialNumber,
  setSerialNumber,
  qty,
  setQty,
  onAdd,
  onResetForm,
  onEditLast,
  isCartEmpty,
  selectedMobileId,
  setSelectedMobileId,
  mobileDiscount,
  setMobileDiscount,
  finalPrice,
  setFinalPrice,
  tfbMobiles,
  // tax rupee amounts
  cgstAmount,
  setCgstAmount,
  sgstAmount,
  setSgstAmount,
  igstAmount,
  setIgstAmount,
}) {
  const getVariantKeyLocal = (m) => {
    const v = (m.variant || "").trim();
    if (v) return v;
    const i1 = (m.imei1 || "").trim();
    if (i1) return i1;
    return `VAR-${m._id}`;
  };

  // rows (with tolerant serial text)
  const rows = useMemo(
    () =>
      Array.isArray(tfbMobiles)
        ? tfbMobiles.map((m) => {
          const extractSerialText = (obj) => {
            if (!obj || typeof obj !== "object") return "";
            const tryKeys = [
              "serialNumber",
              "serial_no",
              "serial",
              "SerialNumber",
              "serialnumber",
              "serialNo",
              "sn",
              "sno",
              "serial_no_str",
            ];
            for (const k of tryKeys) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const v = obj[k];
                if (v !== undefined && v !== null) {
                  const s = String(v).trim();
                  if (s !== "" && s !== "Not Applicable") return s;
                }
              }
            }
            // fallback: look for any string-like non-empty field that looks like a serial
            const scan = (o) => {
              if (!o || typeof o !== "object") return "";
              for (const k of Object.keys(o)) {
                const v = o[k];
                if (v == null) continue;
                if (typeof v === "string" || typeof v === "number") {
                  const vs = String(v).trim();
                  if (!vs || vs === "Not Applicable") continue;
                  if (/^[A-Za-z0-9\-_.]{4,}$/.test(vs)) return vs;
                } else if (typeof v === "object") {
                  const nested = scan(v);
                  if (nested) return nested;
                }
              }
              return "";
            };
            return scan(obj) || "";
          };

          return {
            ...m,
            serialNumberText:
              (m.serialNumber && String(m.serialNumber).trim()) ||
              (m.serial_no && String(m.serial_no).trim()) ||
              extractSerialText(m) ||
              "Not Applicable",
          };
        })
        : [],
    [tfbMobiles]
  );

  // tolerant read numeric helper
  const toNum = (v) => {
    if (v === undefined || v === null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Try to extract rupee tax amounts from a row (no percent conversion)
  const extractTaxAmountsFromRow = (row) => {
    // possible field names to try for direct rupee amounts
    const cgCandidates = [
      row.cgstAmount,
      row.mobileCGSTAmount,
      row.cgstamt,
      row.cgstAmt,
      row.mobileCGST,
      row.cgst,
    ];
    const sgCandidates = [
      row.sgstAmount,
      row.mobileSGSTAmount,
      row.sgstamt,
      row.sgstAmt,
      row.mobileSGST,
      row.sgst,
    ];
    const igCandidates = [row.igstAmount, row.igstAmt, row.igst];

    const cg = cgCandidates.find((c) => c !== undefined && c !== null && c !== "");
    const sg = sgCandidates.find((c) => c !== undefined && c !== null && c !== "");
    const ig = igCandidates.find((c) => c !== undefined && c !== null && c !== "");

    return {
      cg: toNum(cg),
      sg: toNum(sg),
      ig: toNum(ig),
    };
  };

  // When user picks a serial by id
  const handleSelectSerialById = (rowId) => {
    if (!rowId) {
      // clear
      setSelectedMobileId("");
      setSerialNumber("");
      setImei1("");
      setImei2("");
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedVariant("");
      setVariantName("");
      setBasicPrice("");
      setFinalPrice(Number(row.finalPrice || 0));
      setMobileDiscount("");
      setMargin("");
      setCondition("");
      setCgstAmount(0);
      setSgstAmount(0);
      setIgstAmount(0);
      return;
    }

    const row = rows.find((r) => String(r._id) === String(rowId));
    if (!row) return;

    setSelectedMobileId(String(row._id || ""));
    setSelectedBrand(row.brand || "");
    setSelectedModel(row.model || "");
    const vkey = getVariantKeyLocal(row);
    setSelectedVariant(vkey);
    setVariantName(row.variant || row.imei1 || "");

    setImei1(row.imei1 || "");
    setImei2(row.imei2 || "");

    const serial =
      (row.serialNumber && String(row.serialNumber).trim() !== "" && String(row.serialNumber).trim()) ||
      (row.serial_no && String(row.serial_no).trim() !== "" && String(row.serial_no).trim()) ||
      row.serialNumberText ||
      "Not Applicable";
    setSerialNumber(serial);

    const bp =
      row.basicPrice ??
      row.mobileBasicPrice ??
      row.retailerPrice ??
      row.customerPrice ??
      "";
    setBasicPrice(bp === null || bp === undefined ? "" : String(bp));

    const marginVal = row.marginAmount ?? row.mobileMargin ?? row.margin ?? 0;
    setMargin(marginVal === 0 ? "" : String(marginVal));

    const fp = row.finalPrice ?? row.mobileFinalPrice ?? row.customerPrice ?? "";
    setFinalPrice(fp === null || fp === undefined ? "" : String(fp));

    setMobileDiscount(row.discountAmount ?? row.discount ?? "");

    // extract rupee tax amounts directly; do NOT compute from percentages
    const { cg, sg, ig } = extractTaxAmountsFromRow(row);
    setCgstAmount(cg);
    setSgstAmount(sg);
    setIgstAmount(ig);

    setCondition(row.condition || "");

    // optionally load models/variants for UI
    onLoadModels && onLoadModels(row.brand || "");
    onLoadVariants && onLoadVariants(row.model || "");
  };

  const handleAdd = () => {
    if (!variantName) {
      alert("Please enter or select a variant name.");
      return;
    }
    const sellingPrice = Number(finalPrice || basicPrice || 0);
    if (!sellingPrice || sellingPrice <= 0) {
      alert("Please select a mobile that has a valid Basic/Final Price.");
      return;
    }

    const payload = {
      brand: selectedBrand || "",
      modelId: selectedModel || "",
      sku: variantSku || selectedVariant || `MAN-${Date.now()}`,
      variant: variantName,
      price: sellingPrice,
      basicPrice: Number(basicPrice) || 0,
      imei1: imei1 || "",
      imei2: imei2 || "",
      qty: Number(qty) || 1,
      margin: Number(margin || 0),
      condition: condition || "",
      serialNumber: serialNumber || "Not Applicable",
      mobileId: selectedMobileId || null,
    };
    onAdd(payload);

    // reset product selection fields (but preserve cgst/sgst as they belong to mobile row)
    setSelectedVariant("");
    setVariantSku("");
    setRetailerPrice("");
    setBasicPrice("");
    setFinalPrice("");
    setVariantName("");
    setMargin("");
    setImei1("");
    setImei2("");
    setCondition("");
    setSerialNumber("");
    setMobileDiscount("");
    setQty(1);
    setSelectedMobileId("");
    setSelectedBrand("");
    setSelectedModel("");
    // Do NOT clear cgst/sgst here (they represent fields coming with the mobile row)
  };

  return (
    <div className="box product-box">
      <h4>Select Mobile</h4>

      <div className="row">
        <input
          className="sku-select"
          list="serial-options"
          placeholder="Serial Number"
          value={serialNumber || ""}
          onChange={(e) => {
            const val = e.target.value;
            setSerialNumber(val);

            // If typed serial matches an existing row, auto-select it
            const matched = rows.find(
              (r) => String(r.serialNumberText).toLowerCase() === val.toLowerCase()
            );

            if (matched) {
              handleSelectSerialById(matched._id);
            }
          }}
        />

        <datalist id="serial-options">
          {rows.map((r) => (
            <option key={r._id} value={r.serialNumberText} />
          ))}
        </datalist>


        <input className="sku-select" placeholder="IMEI1" value={imei1 || ""} readOnly aria-label="IMEI1" />
        <input className="sku-select" placeholder="IMEI 2" value={imei2 || ""} readOnly />
        <input className="sku-select" placeholder="Serial Number" value={serialNumber || ""} readOnly aria-label="Serial Number" />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="Brand" value={selectedBrand || ""} readOnly />
        <input className="sku-select" placeholder="Model" value={(models.find((m) => String(m.id) === String(selectedModel))?.name || selectedModel) || ""} readOnly />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="Variant" value={variantName || selectedVariant || ""} readOnly />
        <input className="sku-select" placeholder="Condition" value={condition || ""} readOnly />
      </div>

      <div className="row">
        <input type="text" className="sku-select" placeholder="Basic Price" value={basicPrice || ""} readOnly />
        {/* CGST / SGST are rupee amounts (display as-is) */}
        <input type="text" className="sku-select" placeholder="CGST (₹)" value={cgstAmount !== undefined ? String(cgstAmount) : ""} readOnly aria-label="CGST rupee amount" />
        <input type="text" className="sku-select" placeholder="SGST (₹)" value={sgstAmount !== undefined ? String(sgstAmount) : ""} readOnly aria-label="SGST rupee amount" />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="Discount (mobile)" value={mobileDiscount || ""} readOnly />
        <input className="sku-select" placeholder="Final Price" value={finalPrice || ""} readOnly />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="Margin (from TFB)" value={margin === "" ? "" : margin} readOnly />
        <input className="sku-select" placeholder="Quantity" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          className="btn-clear"
          onClick={() => {
            if (!onEditLast) {
              alert("Edit not available.");
              return;
            }
            if (isCartEmpty) {
              alert("Add a product to cart first to edit it.");
              return;
            }
            onEditLast();
          }}
        >
          Edit
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button className="btn-add" onClick={handleAdd}>
          Add
        </button>
        <button
          className="btn-clear"
          onClick={() => {
            onResetForm();
            setRetailerPrice("");
            setBasicPrice("");
            setFinalPrice("");
            setMargin("");
            setImei1("");
            setImei2("");
            setCondition("");
            setSerialNumber("");
            setMobileDiscount("");
            setSelectedBrand("");
            setSelectedModel("");
            setSelectedVariant("");
            setVariantName("");
            setSelectedMobileId("");
            setCgstAmount(0);
            setSgstAmount(0);
            setIgstAmount(0);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* AccessorySelector — unchanged (copied from your original) */
function AccessorySelector({
  accessoryName,
  setAccessoryName,
  accessoryType,
  setAccessoryType,
  accessoryModel,
  setAccessoryModel,
  accessoryPrice,
  setAccessoryPrice,
  accessoryQty,
  setAccessoryQty,

  // ✅ NEW
  accessoryBasicPrice,
  setAccessoryBasicPrice,
  accessoryDiscount,
  setAccessoryDiscount,
  accessoryCGST,
  setAccessoryCGST,
  accessorySGST,
  setAccessorySGST,
  accessoryFinalPrice,
  setAccessoryFinalPrice,

  selectedAccessoryId,
  setSelectedAccessoryId,

  onAddAccessory,
  onResetAccessory,
  onEditLast,
  isCartEmpty,
  tfbAccessories,
}) {


  const typeOptionsForSelectedAccessory = useMemo(() => {
    if (!accessoryName) return [];

    const name = accessoryName.toLowerCase().trim();

    return tfbAccessories
      .filter((a) => (a.accessory || "").toLowerCase().trim() === name)
      .map((a) => ({
        id: a._id,
        label: a.accessoryType,
      }));
  }, [accessoryName, tfbAccessories]);

  const handleAddAccessory = () => {
    const priceNum = Number(accessoryPrice || 0);
    const qtyNum = Number(accessoryQty || 0) || 1;

    if (!accessoryName.trim()) {
      alert("Please select an accessory.");
      return;
    }
    if (!priceNum || priceNum <= 0) {
      alert("Please enter a valid accessory price.");
      return;
    }

    const selectedRow = tfbAccessories.find(
      (a) => String(a._id) === String(selectedAccessoryId)
    );

    onAddAccessory({
      name: accessoryName.trim(),
      type: selectedRow?.accessoryType || "",
      modelNumber: selectedRow?.modelNumber || "",
      price: priceNum,
      qty: qtyNum,

      // 🔑 CRITICAL: MongoDB _id
      sku: selectedAccessoryId,
    });


    setAccessoryName("");
    setAccessoryType("");
    setAccessoryModel("");
    setAccessoryPrice("");
    setAccessoryQty(1);
    setSelectedAccessoryId("");
  };

  return (
    <div className="box product-box">
      <h4>Select Accessory</h4>

      <div className="row">
        <select
          className="sku-select"
          value={selectedAccessoryId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedAccessoryId(id);

            const selected = tfbAccessories.find(
              (a) => String(a._id) === String(id)
            );

            if (!selected) {
              setAccessoryName("");
              setAccessoryType("");
              setAccessoryModel("");
              setAccessoryPrice("");

              setAccessoryBasicPrice("");
              setAccessoryDiscount("");
              setAccessoryCGST("");
              setAccessorySGST("");
              setAccessoryFinalPrice("");
              return;
            }

            setAccessoryName(selected.accessory || "");
            setAccessoryType(selected.accessoryType || "");
            setAccessoryModel(selected.modelNumber || "");

            // ✅ NEW autofill fields
            setAccessoryBasicPrice(
              selected.basicPrice != null ? String(selected.basicPrice) : ""
            );

            setAccessoryDiscount(
              selected.discount != null ? String(selected.discount) : ""
            );

            setAccessoryCGST(
              selected.cgst != null ? String(selected.cgst) : ""
            );

            setAccessorySGST(
              selected.sgst != null ? String(selected.sgst) : ""
            );

            setAccessoryFinalPrice(
              selected.finalPrice != null ? String(selected.finalPrice) : ""
            );

            // ✅ Your old "Price" field should show Final Price now
            setAccessoryPrice(
              selected.finalPrice != null ? String(selected.finalPrice) : ""
            );
          }}

        >
          <option value="">Select Model Number</option>

          {tfbAccessories.map((a) => (
            <option key={a._id} value={a._id}>
              {a.modelNumber}
            </option>
          ))}
        </select>


      </div>

      <div className="row">
        <input className="sku-select" placeholder="Accessory Name" value={accessoryName} readOnly />
        <input className="sku-select" placeholder="Accessory Type" value={accessoryType} readOnly />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="Basic Price" value={accessoryBasicPrice} readOnly />
        <input className="sku-select" placeholder="Discount" value={accessoryDiscount} readOnly />
        <input className="sku-select" placeholder="CGST" value={accessoryCGST} readOnly />
      </div>

      <div className="row">
        <input className="sku-select" placeholder="SGST" value={accessorySGST} readOnly />
        <input className="sku-select" placeholder="Final Price" value={accessoryFinalPrice} readOnly />
        <input className="sku-select" placeholder="Price" value={accessoryPrice} readOnly />
      </div>




      <div className="row">
        <input type="number" min="1" className="sku-select" placeholder="Quantity" value={accessoryQty} onChange={(e) => setAccessoryQty(e.target.value)} />
      </div>

      <div style={{ marginTop: 10 }}>
        <button className="btn-clear" onClick={() => {
          if (!onEditLast) { alert("Edit not available."); return; }
          if (isCartEmpty) { alert("Add a product or accessory to cart first to edit it."); return; }
          onEditLast();
        }}>
          Edit
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button className="btn-add" onClick={handleAddAccessory}>Add</button>
        <button className="btn-clear" onClick={() => { onResetAccessory(); }}>Reset</button>
      </div>
    </div>
  );
}

// ---- Invoice helpers (TOP of Billing.jsx) ----
// ---------- Invoice Number Helpers ----------

// Example output: FS1-25-26-001
const getCurrentFinancialSession = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Jan = 0

  // Financial year starts in April
  if (month >= 4) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  } else {
    return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  }
};

const generateInvoiceNumber = (type = "mobile") => {
  const session = getCurrentFinancialSession();

  const prefix = type === "accessory" ? "FS1/A" : "FS1";

  const key = `${prefix}-INVOICE-COUNT-${session}`;
  const lastCount = Number(localStorage.getItem(key) || 0);
  const nextCount = lastCount + 1;

  localStorage.setItem(key, nextCount);

  const padded = String(nextCount).padStart(3, "0");
  return `${prefix}-${session}-${padded}`;
};




/* BillingPreview — shows tax amounts (rupee) and uses finalPrice as authoritative total */
/* BillingPreview — cart-driven, GST-safe, no legacy logic */
function BillingPreview({
  invoiceNumber,
  invoiceDate,
  cart,
  subtotal,
  discount,
  onChangeDiscount,
  onClearCart,
  onPay,
  customer,
  onOpenEdit,
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  upiDetails,
  setUpiDetails,
  showUpiQr,
  setShowUpiQr,
  cgstAmount,
  sgstAmount,
  igstAmount,
  basicPrice,
  finalPrice,
}) {
  const discountNum = Number(discount || 0);

  const previewItem = cart.length > 0 ? cart[cart.length - 1] : null;

  // ---- TAX (rupee amounts from cart) ----
  const totalTax = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.cgstAmount || 0) +
        Number(item.sgstAmount || 0) +
        Number(item.igstAmount || 0)) *
      (Number(item.qty) || 1),
    0
  );

  // ---- TOTAL AMOUNT ----
  const computedTotal = Math.max(
    0,
    Math.round((subtotal - discountNum) * 100) / 100
  );


  const finalPriceNum = Number(finalPrice || 0);

  const total =
    finalPriceNum > 0
      ? finalPriceNum
      : computedTotal;

  return (
    <div className="box billing-box">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h4 style={{ margin: 0 }}>Billing Details</h4>
        <button className="btn-clear" onClick={onOpenEdit}>Edit</button>
      </div>

      {/* CUSTOMER */}
      {customer && (
        <div style={{ marginTop: 12 }}>
          <div><strong>Name:</strong> {customer.name}</div>
          <div><strong>Phone:</strong> {customer.phone}</div>
          <div><strong>Address:</strong> {customer.address}</div>
          <div>
            <strong>Invoice:</strong>{" "}
            {invoiceNumber || "—"} | {invoiceDate}
          </div>

        </div>
      )}

      <hr />

      {/* LAST ADDED ITEM */}
      {previewItem ? (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Last Added Item
          </div>

          {/* REQUIRED FIELDS — THIS WAS MISSING */}
          {previewItem.type === "mobile" && (
            <div style={{ marginBottom: 8 }}>
              <div><strong>Brand:</strong> {previewItem.brand || "-"}</div>
              <div><strong>Model:</strong> {previewItem.model || "-"}</div>
              <div><strong>Variant:</strong> {previewItem.variant || "-"}</div>
              <div><strong>Condition:</strong> {previewItem.condition || "-"}</div>
              <div><strong>Serial Number:</strong> {previewItem.serialNumber || "Not Applicable"}</div>
              <div>
                <strong>IMEI:</strong>{" "}
                {previewItem.imei1 || "-"}
                {previewItem.imei2 ? ` / ${previewItem.imei2}` : ""}
              </div>
            </div>
          )}

          <div><strong>Qty:</strong> {previewItem.qty || 1}</div>
          <div><strong>Price:</strong> ₹{previewItem.price?.toFixed(2)}</div>
        </div>
      ) : (
        <div>No product added</div>
      )}

      <hr />

      {/* SUMMARY */}
      <div className="summary-field">
        <div className="label">Subtotal</div>
        <div className="value">₹{subtotal.toFixed(2)}</div>
      </div>

      <div className="summary-field">
        <div className="label">Discount (₹)</div>
        <div className="value">
          <input
            className="small-input"
            type="number"
            value={discount}
            onChange={(e) => onChangeDiscount(e.target.value)}
          />
        </div>
      </div>

      <div className="summary-field">
        <div className="label">Total Tax (₹)</div>
        <div className="value">₹{totalTax.toFixed(2)}</div>
      </div>

      <div className="summary-field big">
        <div className="label">Total Amount</div>
        <div className="value total-amt">₹{total.toFixed(2)}</div>
      </div>

      {/* PAYMENT */}
      <div style={{ marginTop: 12 }}>
        <label>
          <input type="radio" value="cash" checked={paymentMethod === "cash"} onChange={(e) => setPaymentMethod(e.target.value)} />
          Cash
        </label>
        <label>
          <input type="radio" value="card" checked={paymentMethod === "card"} onChange={(e) => setPaymentMethod(e.target.value)} />
          Card
        </label>
        <label>
          <input type="radio" value="upi" checked={paymentMethod === "upi"} onChange={(e) => setPaymentMethod(e.target.value)} />
          UPI
        </label>
      </div>

      <div className="action-row" style={{ marginTop: 12 }}>
        <button className="btn-clear" onClick={onClearCart}>Clear</button>
        <button className="btn-pay" onClick={() => onPay(total, { totalTax })}>
          Generate Bill
        </button>
      </div>
    </div>
  );
}



/* MAIN Billing component */
export default function Billing({ sidebarWidth = 64 }) {
  const {
    refreshMobileStock,
    refreshAccessoryStock,
    stockRefreshTrigger
  } = useContext(StockContext);

  // invoice meta
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const handleStartBilling = (type = "mobile") => {
    setInvoiceNumber((prev) => {
      if (prev) return prev; // prevent regeneration
      return generateInvoiceNumber(type);
    });
  };


  // customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // summary fields
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // payment details
  const [cardDetails, setCardDetails] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upiDetails, setUpiDetails] = useState({ upi: "", ref: "" });
  const [showUpiQr, setShowUpiQr] = useState(false);

  // datasets
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);

  // accessory dropdown datasets
  const [accessoryOptions, setAccessoryOptions] = useState([]);
  const [accTypeOptions, setAccTypeOptions] = useState([]);

  // cart
  const [cart, setCart] = useState([]);
  const [tfbMobiles, setTfbMobiles] = useState([]);
  const [tfbAccessories, setTfbAccessories] = useState([]);

  // Select Product state
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [retailerPrice, setRetailerPrice] = useState("");
  const [basicPrice, setBasicPrice] = useState("");
  const [margin, setMargin] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [condition, setCondition] = useState("");
  const [conditionOptions, setConditionOptions] = useState([]);
  const [serialNumber, setSerialNumber] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedMobileId, setSelectedMobileId] = useState("");

  // Select Accessory state
  const [accessoryName, setAccessoryName] = useState("");
  const [accessoryType, setAccessoryType] = useState("");
  const [accessoryModel, setAccessoryModel] = useState("");
  const [accessoryPrice, setAccessoryPrice] = useState("");
  const [accessoryBasicPrice, setAccessoryBasicPrice] = useState("");
  const [accessoryDiscount, setAccessoryDiscount] = useState("");
  const [accessoryCGST, setAccessoryCGST] = useState("");
  const [accessorySGST, setAccessorySGST] = useState("");
  const [accessoryFinalPrice, setAccessoryFinalPrice] = useState("");
  const [accessoryQty, setAccessoryQty] = useState(1);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState("");

  // mobile-level placeholders filled from TFB row
  const [mobileDiscount, setMobileDiscount] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

  // Tax rupee amounts (per your request: direct rupee amounts, not percent)
  const [cgstAmount, setCgstAmount] = useState(0);
  const [sgstAmount, setSgstAmount] = useState(0);
  const [igstAmount, setIgstAmount] = useState(0);

  // billing edit
  const [billingEditMode, setBillingEditMode] = useState(false);
  const [billingEditProduct, setBillingEditProduct] = useState(null);
  const [billingEditCustomer, setBillingEditCustomer] = useState(null);

  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editVariant, setEditVariant] = useState("");

  // bill dialog
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [billData, setBillData] = useState(null);

  // helper to derive "variant key" from a mobile row
  const getVariantKey = (m) => {
    const v = (m.variant || "").trim();
    if (v) return v;
    const i1 = (m.imei1 || "").trim();
    if (i1) return i1;
    return `VAR-${m._id}`;
  };

  useEffect(() => {
    const fetchTfbMobiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mobiles?status=tfb");
        const data = await res.json();

        // 🔒 SAFETY: Billing sees ONLY what TFBMobile sees
        const clean = Array.isArray(data)
          ? data.filter((m) => m.status === "tfb")
          : [];

        setTfbMobiles(clean);
      } catch (e) {
        console.error("Failed to fetch TFB mobiles", e);
        setTfbMobiles([]);
      }
    };

    fetchTfbMobiles();
  }, [stockRefreshTrigger]); // ✅ THIS IS THE KEY

  useEffect(() => {
    const fetchTfbAccessories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/accessories?status=tfb");
        if (!res.ok) throw new Error("Failed to fetch TFB accessories for billing");
        const data = await res.json();
        setTfbAccessories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching TFB accessories for billing:", err);
        setTfbAccessories([]);
      }
    };
    fetchTfbAccessories();
  }, []);

  // derive brands from tfb if available else fallback to static
  useEffect(() => {
    if (Array.isArray(tfbMobiles) && tfbMobiles.length > 0) {
      const uniqueBrands = [...new Set(tfbMobiles.map((m) => m.brand).filter(Boolean))];
      setBrands(uniqueBrands.map((b) => ({ id: String(b), name: String(b) })));
      return;
    }
    try {
      const raw = BRANDS?.default ?? BRANDS;
      const arr = Array.isArray(raw) ? raw : [];
      const normalized = arr.map((b) => ({ id: String(b.name), name: b.name, logoUrl: b.logoUrl }));
      setBrands(normalized);
    } catch {
      setBrands([]);
    }
  }, [tfbMobiles]);

  useEffect(() => {
    try {
      const raw = ACCESSORIES?.default ?? ACCESSORIES;
      const arr = Array.isArray(raw) ? raw : [];
      const normalized = arr.map((a, idx) => (typeof a === "string" ? { id: `acc-${idx}`, name: a } : { id: a.id ?? a.value ?? a.name ?? `acc-${idx}`, name: a.name ?? a.label ?? a.value ?? "" })).filter(Boolean);
      setAccessoryOptions(normalized);
    } catch {
      setAccessoryOptions([]);
    }

    try {
      const rawT = ACCTYPES?.default ?? ACCTYPES;
      const arrT = Array.isArray(rawT) ? rawT : [];
      const normalizedT = arrT.map((t, idx) => (typeof t === "string" ? { id: `type-${idx}`, name: t } : { id: t.id ?? t.value ?? t.name ?? `type-${idx}`, name: t.name ?? t.label ?? t.value ?? "" })).filter(Boolean);
      setAccTypeOptions(normalizedT);
    } catch {
      setAccTypeOptions([]);
    }
  }, []);

  const loadModelsForBrand = (brandName) => {
    setModels([]);
    setVariants([]);
    if (!brandName) return;
    const mobilesForBrand = tfbMobiles.filter((m) => String(m.brand) === String(brandName));
    if (!mobilesForBrand.length) return;
    const uniqueModels = [...new Set(mobilesForBrand.map((m) => m.model).filter(Boolean))];
    const normalized = uniqueModels.map((modelName) => {
      const mobilesForModel = mobilesForBrand.filter((m) => String(m.model) === String(modelName));
      const grouped = {};
      mobilesForModel.forEach((m) => {
        const key = getVariantKey(m);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      });
      const variantsForModel = Object.entries(grouped).map(([key, list]) => {
        const first = list[0];
        const price = first.basicPrice != null ? Number(first.basicPrice) : first.customerPrice != null ? Number(first.customerPrice) : first.retailerPrice != null ? Number(first.retailerPrice) : null;
        return {
          id: key,
          sku: "",
          name: key,
          price,
          retailerPrice: first.retailerPrice != null ? Number(first.retailerPrice) : null,
          customerPrice: first.customerPrice != null ? Number(first.customerPrice) : null,
        };
      });
      return { id: String(modelName), name: String(modelName), imageUrl: "", variants: variantsForModel };
    });
    setModels(normalized);
  };

  const loadVariantsForModel = (modelId) => {
    setVariants([]);
    if (!modelId) return;
    const modelObj = models.find((m) => String(m.id) === String(modelId));
    if (!modelObj) return;
    const normalizedVariants = (modelObj.variants || []).map((v, idx) => ({ id: v.id ?? String(idx), sku: v.sku ?? "", name: v.name ?? `Variant ${idx + 1}`, price: v.price ?? null, retailerPrice: v.retailerPrice ?? null, customerPrice: v.customerPrice ?? null }));
    setVariants(normalizedVariants);
  };


  // derive condition options for the selected variant (keeps serial preservation)
  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedVariant) {
      setConditionOptions([]);
      setCondition("");
      setSelectedMobileId("");
      return;
    }
    const modelName = models.find((m) => String(m.id) === String(selectedModel))?.name || selectedModel;
    const variantKey = selectedVariant;
    const possible = tfbMobiles.filter((m) => {
      if (String(m.brand) !== String(selectedBrand)) return false;
      if (String(m.model) !== String(modelName)) return false;
      return getVariantKey(m) === variantKey;
    });
    const conds = [...new Set(possible.map((m) => (m.condition || "").trim()).filter((c) => c !== ""))];
    setConditionOptions(conds);
    setCondition(conds[0] || "");
    setSelectedMobileId("");
  }, [selectedBrand, selectedModel, selectedVariant, models, tfbMobiles]);

  useEffect(() => {
    if (!selectedBrand || !selectedModel || !selectedVariant || !condition) {
      setSelectedMobileId("");
      setImei1("");
      setImei2("");
      setBasicPrice("");
      setMargin("");
      setFinalPrice("");
      setMobileDiscount("");
      // Do NOT clear serialNumber here
      return;
    }

    const modelName = models.find((m) => String(m.id) === String(selectedModel))?.name || selectedModel;
    const variantKey = selectedVariant;

    const matched = tfbMobiles.find((m) => {
      if (String(m.brand) !== String(selectedBrand)) return false;
      if (String(m.model) !== String(modelName)) return false;
      if (getVariantKey(m) !== variantKey) return false;
      return (m.condition || "").trim() === condition.trim();
    });

    if (!matched) {
      setSelectedMobileId("");
      setImei1("");
      setImei2("");
      setRetailerPrice("");
      setBasicPrice("");
      setMargin("");
      setFinalPrice("");
      setMobileDiscount("");
      return;
    }

    // populate placeholders from the first matched row but do NOT override serialNumber if user already chose it
    setSelectedMobileId("");
    setImei2(matched.imei2 || "");
    const bp = matched.basicPrice != null ? String(matched.basicPrice) : matched.mobileBasicPrice != null ? String(matched.mobileBasicPrice) : matched.customerPrice != null ? String(matched.customerPrice) : matched.retailerPrice != null ? String(matched.retailerPrice) : "";
    setBasicPrice(bp);
    const marginVal = matched.marginAmount != null ? Number(matched.marginAmount) : matched.mobileMargin != null ? Number(matched.mobileMargin) : matched.margin != null ? Number(matched.margin) : 0;
    setMargin(marginVal === 0 ? "" : marginVal);
    const fp = matched.finalPrice != null ? String(matched.finalPrice) : matched.mobileFinalPrice != null ? String(matched.mobileFinalPrice) : "";
    setFinalPrice(fp);
    setMobileDiscount(matched.discountAmount != null ? String(matched.discountAmount) : matched.discount != null ? String(matched.discount) : "");

    // set cgst/sgst rupee amounts (no percent conversion)
    const tryCg = matched.cgstAmount ?? matched.mobileCGST ?? matched.cgst ?? 0;
    const trySg = matched.sgstAmount ?? matched.mobileSGST ?? matched.sgst ?? 0;
    const tryIg = matched.igstAmount ?? matched.igst ?? 0;
    setCgstAmount(Number(tryCg || 0));
    setSgstAmount(Number(trySg || 0));
    setIgstAmount(Number(tryIg || 0));
  }, [selectedBrand, selectedModel, selectedVariant, condition, models, tfbMobiles]);

  const addToCart = (payload) => {
    // ✅ Mobile bills => FS1-xx-xx-xxx
    handleStartBilling("mobile");

    const hasAccessoryItems = cart.some((it) => it.type === "accessory");
    if (hasAccessoryItems) {
      alert(
        "This invoice already contains accessory items. Generate the bill or clear the cart before adding mobiles."
      );
      return;
    }

    const modelName = payload.modelId
      ? models.find((m) => String(m.id) === String(payload.modelId))?.name ||
      payload.modelId
      : "";

    const qtyNum = Number(payload.qty) || 1;

    const item = {
      id: Date.now().toString(),
      type: "mobile",

      // 🔑 identity
      sku: payload.mobileId || payload.sku,
      variant: payload.variant,

      // 🔍 REQUIRED for Billing Details
      brand: payload.brand || "",
      model: modelName || "",
      condition: payload.condition || "",
      serialNumber: payload.serialNumber || "Not Applicable",
      imei1: payload.imei1 || "",
      imei2: payload.imei2 || "",

      // 💰 pricing
      price: Number(payload.price) || 0,
      qty: qtyNum,
      basePrice: Number(payload.basicPrice) || 0,

      // 🧾 tax
      cgstAmount: Number(cgstAmount) || 0,
      sgstAmount: Number(sgstAmount) || 0,
      igstAmount: Number(igstAmount) || 0,

      // 📈 margin
      margin: Number(payload.margin) || 0,
    };

    // ✅ Safety check
    if (!item.sku) {
      alert("Mobile not selected properly (SKU missing). Please re-select.");
      return;
    }

    setCart((prev) => {
      // ✅ IMPORTANT: prevent adding SAME mobile again
      const alreadyExists = prev.find(
        (c) =>
          c.type === "mobile" &&
          String(c.sku) === String(item.sku) &&
          String(c.imei1 || "") === String(item.imei1 || "")
      );

      if (alreadyExists) {
        alert("This mobile is already added in the cart.");
        return prev;
      }

      return [...prev, item];
    });
  };


const addAccessoryToCart = ({ name, type, modelNumber, price, qty, sku }) => {
  handleStartBilling("accessory"); // ✅ FS1/A

  const timestamp = Date.now();
  const finalSku = sku;

  const item = {
    id: `ACC-${timestamp}`,
    type: "accessory",
    sku: finalSku,
    variant: type || "Accessory",

    price: Number(price) || 0,
    basePrice: Number(accessoryBasicPrice || price) || 0,

    // ✅ add these tax fields so BillingPreview can calculate Total Tax
    cgstAmount: Number(accessoryCGST || 0),
    sgstAmount: Number(accessorySGST || 0),
    igstAmount: 0,

    imei1: "",
    imei2: "",
    qty: Number(qty) || 1,
    brand: name || "Accessory",
    model: modelNumber || "",
    margin: 0,
  };

  setCart((prev) => [...prev, item]);
};



  const removeItem = (id) => setCart((prev) => prev.filter((it) => it.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = useMemo(() => cart.reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  const openBillingEdit = () => {
    const last = cart.length > 0 ? cart[cart.length - 1] : null;
    setBillingEditProduct(last ? { ...last } : null);
    setBillingEditCustomer({ name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress });

    if (last) {
      setEditBrand(last.brand || "");
      if (last.brand) {
        loadModelsForBrand(last.brand);
        const maybeModelId = models.find((m) => String(m.name) === String(last.model))?.id || "";
        setEditModel(maybeModelId);

        setTimeout(() => {
          if (maybeModelId) {
            const modelObj = models.find((m) => String(m.id) === String(maybeModelId)) || {};
            const normalizedVariants = (modelObj.variants || []).map((v, idx) => ({ id: v.id ?? String(idx), sku: v.sku ?? "", name: v.name ?? `Variant ${idx + 1}`, price: v.price ?? null }));
            setVariants(normalizedVariants);
            const vCandidate = normalizedVariants.find((v) => String(v.name) === String(last.variant));
            setEditVariant(vCandidate ? vCandidate.id : "");
          } else {
            setEditVariant("");
          }
        }, 120);
      }
    } else {
      setEditBrand("");
      setEditModel("");
      setEditVariant("");
    }

    setBillingEditMode(true);
  };

  const applyBillingEdit = () => {
    if (billingEditCustomer) {
      setCustomerName(billingEditCustomer.name || "");
      setCustomerPhone(billingEditCustomer.phone || "");
      setCustomerEmail(billingEditCustomer.email || "");
      setCustomerAddress(billingEditCustomer.address || "");
    }

    if (billingEditProduct) {
      setCart((prev) =>
        prev.map((it) => {
          if (it.id !== billingEditProduct.id) return it;

          const modelName = editModel ? models.find((m) => String(m.id) === String(editModel))?.name || editModel : it.model;
          const variantObj = variants.find((v) => String(v.id) === String(editVariant)) || null;
          const variantNameVal = variantObj ? variantObj.name : billingEditProduct.variant;

          return {
            ...it,
            brand: editBrand || it.brand,
            model: modelName || it.model,
            variant: variantNameVal || it.variant,
            imei1: billingEditProduct.imei1 || it.imei1,
            imei2: billingEditProduct.imei2 || it.imei2,
            price: Number(billingEditProduct.price) || it.price,
            qty: Number(billingEditProduct.qty) || it.qty,
          };
        })
      );
    }

    setBillingEditMode(false);
  };

  useEffect(() => {
    if (!editBrand) {
      setModels([]);
      setVariants([]);
      setEditModel("");
      setEditVariant("");
      return;
    }
    loadModelsForBrand(editBrand);
    setEditModel("");
    setEditVariant("");
  }, [editBrand]);

  useEffect(() => {
    if (!editModel) {
      setVariants([]);
      setEditVariant("");
      return;
    }
    const modelObj = models.find((m) => String(m.id) === String(editModel));
    if (!modelObj) {
      setVariants([]);
      setEditVariant("");
      return;
    }
    const normalizedVariants = (modelObj.variants || []).map((v, idx) => ({ id: v.id ?? String(idx), sku: v.sku ?? "", name: v.name ?? `Variant ${idx + 1}`, price: v.price ?? null }));
    setVariants(normalizedVariants);
    setEditVariant("");
  }, [editModel]);

  // handlePay - uses finalPrice as authoritative total (do not add tax to finalPrice)
  const handlePay = async (totalOverride, extra) => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Please fill customer details before generating the bill.");
      return;
    }
    if (cart.length === 0) {
      alert("Add at least one product before generating the bill.");
      return;
    }

    if (paymentMethod === "card") {
      if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
        alert("Please fill card details before generating bill.");
        return;
      }
    }
    if (paymentMethod === "upi") {
      if (!upiDetails.upi) {
        alert("Please enter a UPI ID before generating the bill.");
        return;
      }
      if (!upiDetails.upi.includes("@")) {
        alert("Please enter a valid UPI ID (example: name@bank).");
        return;
      }
    }

    const invoiceMargin = cart.reduce((sum, item) => sum + Number(item.margin || 0), 0);
    const discountNum = Number(discount || 0);

    // Keep same basicTotal definition as used in the preview:
    const basicTotal = (() => {
      const bpNum = Number(basicPrice || 0);
      return bpNum && !isNaN(bpNum) ? bpNum : subtotal;
    })();

    const discountedPrice = Math.max(0, Math.round((basicTotal - discountNum) * 100) / 100);

    const isAccessoryBill = cart.length > 0 && cart[0].type && cart[0].type === "accessory";
    const taxBase = isAccessoryBill ? discountedPrice : invoiceMargin;

    const taxAmount = cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.cgstAmount || 0) +
          Number(item.sgstAmount || 0) +
          Number(item.igstAmount || 0)) *
        (Number(item.qty) || 1),
      0
    );

    const cgAmt = cart.reduce(
      (s, i) => s + Number(i.cgstAmount || 0) * (i.qty || 1),
      0
    );

    const sgAmt = cart.reduce(
      (s, i) => s + Number(i.sgstAmount || 0) * (i.qty || 1),
      0
    );

    const igAmt = cart.reduce(
      (s, i) => s + Number(i.igstAmount || 0) * (i.qty || 1),
      0
    );


    const finalPriceNum = Number(finalPrice || 0);
    const total =
      finalPriceNum && finalPriceNum > 0
        ? finalPriceNum
        : Math.round((subtotal - discountNum) * 100) / 100;


    const now = new Date();
    const billingDate = now.toISOString().slice(0, 10);

    const istFormatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const istString = istFormatter.format(now);
    const storeLocation = "India";
    const billingDateTimeIST = `${istString} IST, ${storeLocation}`;

    const payload = {
      invoiceNumber,
      invoiceDate,
      billingDate,
      billingDateTimeIST,
      customer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
      items: cart,
      subtotal,
      basicPrice: basicPrice || "",
      discount: discountNum,
      margin: invoiceMargin,
      discountedPrice,
      taxBase,
      cgstAmount: cgAmt,
      sgstAmount: sgAmt,
      igstAmount: igAmt,
      taxAmount,
      total,
      paymentMethod,
    };

    console.log("INVOICE PAYLOAD (for Bill dialog):", payload);

    const hasMobileItems = cart.some((it) => it.type === "mobile");
    const hasAccessoryItems = cart.some((it) => it.type === "accessory");

    try {
      if (hasMobileItems) {
        // 1) Save mobile bill
        const res = await fetch("http://localhost:5000/api/soldmobiles/mobile-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Mobile billing failed (status ${res.status})`);
        }

        // 2) Mark all billed mobiles as sold in main Mobile collection
        const mobilesToMark = cart.filter((it) => it.type === "mobile");
        // 3) Refresh mobile stock (so TFBMobile stops showing them)
        await refreshMobileStock();
      }

      if (hasAccessoryItems) {
        const res = await fetch("http://localhost:5000/api/soldaccessories/accessory-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || "Failed to save accessory bill / update stock");
        }
        await refreshAccessoryStock?.();
      }
    } catch (err) {
      console.error("Billing API error:", err);
      alert(err?.message || "Bill generated locally, but updating inventory failed.");
    }

    setBillData(payload);
    setShowBillDialog(true);
  };

  const handleBillClose = () => {
    setShowBillDialog(false);

    clearCart();
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setInvoiceNumber("");
    setRetailerPrice("");
    setBasicPrice("");
    setMargin("");
    setCondition("");
    setConditionOptions([]);
    setSerialNumber("");
    setDiscount("");
    setCgstAmount(0);
    setSgstAmount(0);
    setIgstAmount(0);
    setSelectedMobileId("");
    setFinalPrice("");
    setMobileDiscount("");

    setCardDetails({ number: "", name: "", expiry: "", cvv: "" });
    setUpiDetails({ upi: "", ref: "" });
    setShowUpiQr(false);

    setAccessoryName("");
    setAccessoryType("");
    setAccessoryModel("");
    setAccessoryPrice("");
    setAccessoryQty(1);
  };

  const customerFilled = customerName.trim() && customerPhone.trim() && customerAddress.trim();
  const productSelected = cart.length > 0;
  const showBillingDetails = customerFilled && productSelected;

  return (
    <div className="billing-shell" style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}>
      <div className="billing-container">
        <header className="billing-header">
          <div className="billing-left">
            <h2>Billing</h2>
            <div className="billing-sub">Create bill · Cash / Card / UPI</div>
          </div>
        </header>

        <main className="billing-body">
          <section className="left-col">
            <div className="box customer-box">
              <h4>Customer Details</h4>
              <div className="grid-ct">
                <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                <Input placeholder="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                <input type="date" className="cust-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                <Textarea placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
              </div>

              <div style={{ marginTop: 10 }}>
                <button className="btn-clear" onClick={() => { setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setCustomerAddress(""); }}>
                  Edit / Clear
                </button>
              </div>
            </div>

            <ProductSelector
              models={models}
              onLoadModels={loadModelsForBrand}
              onLoadVariants={loadVariantsForModel}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
              variantName={variantName}
              setVariantName={setVariantName}
              variantSku={variantSku}
              setVariantSku={setVariantSku}
              setRetailerPrice={setRetailerPrice}
              basicPrice={basicPrice}
              setBasicPrice={setBasicPrice}
              margin={margin}
              setMargin={setMargin}
              imei1={imei1}
              setImei1={setImei1}
              imei2={imei2}
              setImei2={setImei2}
              condition={condition}
              setCondition={setCondition}
              conditionOptions={conditionOptions}
              serialNumber={serialNumber}
              setSerialNumber={setSerialNumber}
              qty={qty}
              setQty={setQty}
              onAdd={addToCart}
              onResetForm={() => {
                setSelectedBrand("");
                setSelectedModel("");
                setSelectedVariant("");
                setVariantName("");
                setVariantSku("");
                setRetailerPrice("");
                setBasicPrice("");
                setMargin("");
                setImei1("");
                setImei2("");
                setCondition("");
                setConditionOptions([]);
                setSerialNumber("");
                setQty(1);
                setSelectedMobileId("");
                setFinalPrice("");
                setMobileDiscount("");
                loadModelsForBrand("");
                loadVariantsForModel("");
                setCgstAmount(0);
                setSgstAmount(0);
                setIgstAmount(0);
              }}
              onEditLast={openBillingEdit}
              isCartEmpty={cart.length === 0}
              selectedMobileId={selectedMobileId}
              setSelectedMobileId={setSelectedMobileId}
              mobileDiscount={mobileDiscount}
              setMobileDiscount={setMobileDiscount}
              finalPrice={finalPrice}
              setFinalPrice={setFinalPrice}
              tfbMobiles={tfbMobiles}
              cgstAmount={cgstAmount}
              setCgstAmount={setCgstAmount}
              sgstAmount={sgstAmount}
              setSgstAmount={setSgstAmount}
              igstAmount={igstAmount}
              setIgstAmount={setIgstAmount}
            />

            <AccessorySelector
              accessoryName={accessoryName}
              setAccessoryName={setAccessoryName}
              accessoryType={accessoryType}
              setAccessoryType={setAccessoryType}
              accessoryModel={accessoryModel}
              setAccessoryModel={setAccessoryModel}

              accessoryPrice={accessoryPrice}
              setAccessoryPrice={setAccessoryPrice}

              accessoryQty={accessoryQty}
              setAccessoryQty={setAccessoryQty}

              // ✅ NEW props
              accessoryBasicPrice={accessoryBasicPrice}
              setAccessoryBasicPrice={setAccessoryBasicPrice}
              accessoryDiscount={accessoryDiscount}
              setAccessoryDiscount={setAccessoryDiscount}
              accessoryCGST={accessoryCGST}
              setAccessoryCGST={setAccessoryCGST}
              accessorySGST={accessorySGST}
              setAccessorySGST={setAccessorySGST}
              accessoryFinalPrice={accessoryFinalPrice}
              setAccessoryFinalPrice={setAccessoryFinalPrice}

              selectedAccessoryId={selectedAccessoryId}
              setSelectedAccessoryId={setSelectedAccessoryId}

              onAddAccessory={addAccessoryToCart}
              onResetAccessory={() => {
                setAccessoryName("");
                setAccessoryType("");
                setAccessoryModel("");
                setAccessoryPrice("");
                setAccessoryQty(1);
                setSelectedAccessoryId("");

                // ✅ reset new ones too
                setAccessoryBasicPrice("");
                setAccessoryDiscount("");
                setAccessoryCGST("");
                setAccessorySGST("");
                setAccessoryFinalPrice("");
              }}
              onEditLast={openBillingEdit}
              isCartEmpty={cart.length === 0}
              tfbAccessories={tfbAccessories}
            />


          </section>

          <aside className="right-col">
            {showBillingDetails ? (
              <BillingPreview
                invoiceNumber={invoiceNumber}
                invoiceDate={invoiceDate}
                cart={cart}
                subtotal={subtotal}
                discount={discount}
                onChangeDiscount={setDiscount}
                onClearCart={clearCart}
                onPay={handlePay}
                customer={{ name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress }}
                onOpenEdit={openBillingEdit}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cardDetails={cardDetails}
                setCardDetails={setCardDetails}
                upiDetails={upiDetails}
                setUpiDetails={setUpiDetails}
                showUpiQr={showUpiQr}
                setShowUpiQr={setShowUpiQr}
                cgstAmount={cgstAmount}
                sgstAmount={sgstAmount}
                igstAmount={igstAmount}
                basicPrice={cart.reduce((s, it) => s + ((Number(it.basePrice) || Number(it.price) || 0) * (Number(it.qty) || 1)), 0)}
                finalPrice={finalPrice}
              />
            ) : (
              <div className="box billing-box">
                <h4>Billing Details</h4>
                <div style={{ color: "rgba(0,0,0,0.6)" }}>
                  <p><strong>Complete Customer Details</strong> and <strong>add at least one product (click Add)</strong> to enable billing details.</p>
                  <ul style={{ marginTop: 6, color: "rgba(0,0,0,0.6)" }}>
                    {!customerFilled && <li>Fill Customer Details.</li>}
                    {!productSelected && <li>Select and fill your Product Details (click Add).</li>}
                  </ul>
                </div>
              </div>
            )}

            {billingEditMode ? (<div style={{ marginTop: 12 }}>{/* inline edit UI if needed */}</div>) : null}
          </aside>
        </main>

        <Bill open={showBillDialog} onClose={handleBillClose} invoice={billData} />
      </div>
    </div>
  );
}
