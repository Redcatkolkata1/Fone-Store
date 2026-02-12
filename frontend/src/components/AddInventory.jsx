// src/components/AddInventory.jsx
import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import brandModelsData from "../assets/db/brandModels";
import accessoriesData from "../assets/db/accessories";
import accTypesData from "../assets/db/acctypes";
import "./AddInventory.css";

const brands = brandModelsData?.brandModels ?? brandModelsData ?? [];
const accessoryOptions = accessoriesData ?? [];
const accTypeGroups = accTypesData ?? [];

// ✅ normalize string values safely
const norm = (v) => (typeof v === "string" ? v.trim() : v ?? "");

// ✅ Robust number parser (handles "", undefined, commas, etc.)
const toNum = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim().replace(/,/g, "");
  if (s === "") return "";
  const n = Number(s);
  return Number.isFinite(n) ? n : "";
};

// ✅ Normalize excel row keys: "CGST " => "cgst"
const normalizeRow = (row) => {
  const out = {};
  for (const k of Object.keys(row || {})) {
    out[String(k).trim().toLowerCase()] = row[k];
  }
  return out;
};

// ✅ Get a value from excel row by trying multiple possible header names
const getVal = (row, keys = []) => {
  for (const k of keys) {
    const key = String(k).trim().toLowerCase();
    const val = row?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
  }
  return "";
};

export default function AddInventory({ sidebarWidth = 64 }) {
  // form state
  const [addMobile, setAddMobile] = useState(true);
  const [addAccessories, setAddAccessories] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [condition, setCondition] = useState("");

  // Mobile pricing
  const [mobileBasicPrice, setMobileBasicPrice] = useState("");
  const [mobileDiscount, setMobileDiscount] = useState("");
  const [mobileMargin, setMobileMargin] = useState("");
  const [mobileCGST, setMobileCGST] = useState("");
  const [mobileSGST, setMobileSGST] = useState("");
  const [mobileFinalPrice, setMobileFinalPrice] = useState("");

  const [serialNumber, setSerialNumber] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");

  // ✅ Accessories state (UPDATED)
  const [accessoryName, setAccessoryName] = useState("");
  const [accessoryType, setAccessoryType] = useState("");
  const [accessoryModel, setAccessoryModel] = useState("");

  const [accessoryBasicPrice, setAccessoryBasicPrice] = useState("");
  const [accessoryDiscount, setAccessoryDiscount] = useState("");
  const [accessoryCGST, setAccessoryCGST] = useState("");
  const [accessorySGST, setAccessorySGST] = useState("");
  const [accessoryFinalPrice, setAccessoryFinalPrice] = useState("");

  // inventory list
  const [inventory, setInventory] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // last Excel upload type
  const [lastUploadType, setLastUploadType] = useState(null); // "mobile" | "accessory" | null
  const [uploadedFromExcel, setUploadedFromExcel] = useState(false);

  // derived lists for mobile
  const brandObj = useMemo(
    () => brands.find((b) => b.name === selectedBrand) ?? null,
    [selectedBrand]
  );
  const models = brandObj?.models ?? [];
  const variants = models.find((m) => m.name === selectedModel)?.variants ?? [];

  // derived list for accessory types
  const selectedAccGroup = useMemo(
    () => accTypeGroups.find((g) => g.name === accessoryName) ?? null,
    [accessoryName]
  );
  const typeOptions = selectedAccGroup?.types ?? [];

  // global locking
  const hasAnyMobile = inventory.some((it) => it.addMobile);
  const hasAnyAccessory = inventory.some((it) => it.addAccessories);

  const inventoryMode =
    hasAnyMobile && !hasAnyAccessory
      ? "mobile"
      : hasAnyAccessory && !hasAnyMobile
      ? "accessory"
      : null;

  const mobileLockedFromExcel =
    uploadedFromExcel && lastUploadType === "accessory";
  const accessoryLockedFromExcel =
    uploadedFromExcel && lastUploadType === "mobile";

  const mobileLocked = inventoryMode === "accessory" || mobileLockedFromExcel;
  const accessoryLocked =
    inventoryMode === "mobile" || accessoryLockedFromExcel;

  // duplicate check for mobiles
  const checkDuplicateInInventory = (imeiA, imeiB, serial, ignoreId = null) => {
    const i1 = norm(imeiA);
    const i2 = norm(imeiB);
    const s = norm(serial);

    let imeiFound = false;
    let serialFound = false;

    for (const it of inventory) {
      if (!it.addMobile) continue;
      if (ignoreId && it.id === ignoreId) continue;

      const existingI1 = norm(it.imei1);
      const existingI2 = norm(it.imei2);
      const existingSerial = norm(it.serialNumber);

      if (i1) {
        if (existingI1 && existingI1 === i1) imeiFound = true;
        if (existingI2 && existingI2 === i1) imeiFound = true;
      }

      if (i2) {
        if (existingI1 && existingI1 === i2) imeiFound = true;
        if (existingI2 && existingI2 === i2) imeiFound = true;
      }

      if (s) {
        if (existingSerial && existingSerial === s) serialFound = true;
      }

      if (imeiFound || serialFound) break;
    }

    return {
      found: imeiFound || serialFound,
      imei: imeiFound,
      serial: serialFound,
    };
  };

  // toggle mobile
  const handleToggleMobile = (checked) => {
    if (checked && mobileLocked) {
      alert(
        "You cannot add mobiles while accessory inventory is present. Please submit or clear the accessory inventory first."
      );
      return;
    }

    setAddMobile(checked);
    if (checked) {
      setAddAccessories(false);

      setAccessoryName("");
      setAccessoryType("");
      setAccessoryModel("");
      setAccessoryBasicPrice("");
      setAccessoryDiscount("");
      setAccessoryCGST("");
      setAccessorySGST("");
      setAccessoryFinalPrice("");
    }
  };

  // toggle accessories
  const handleToggleAccessories = (checked) => {
    if (checked && accessoryLocked) {
      alert(
        "You cannot add accessories while mobile inventory is present. Please submit or clear the mobile inventory first."
      );
      return;
    }

    setAddAccessories(checked);
    if (checked) {
      setAddMobile(false);

      setSelectedBrand("");
      setSelectedModel("");
      setSelectedVariant("");
      setCondition("");
      setMobileBasicPrice("");
      setMobileDiscount("");
      setMobileMargin("");
      setMobileCGST("");
      setMobileSGST("");
      setMobileFinalPrice("");
      setSerialNumber("");
      setImei1("");
      setImei2("");
    }
  };

  // Add to local inventory list
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!addMobile && !addAccessories) {
      alert("Please select 'Add Mobile' or 'Add Accessories'.");
      return;
    }

    if (addMobile && mobileLocked) {
      alert("Mobiles are locked while accessory inventory exists.");
      return;
    }

    if (addAccessories && accessoryLocked) {
      alert("Accessories are locked while mobile inventory exists.");
      return;
    }

    if (addMobile && (!selectedBrand || !selectedModel)) {
      alert("Please select Brand and Model.");
      return;
    }

    if (addMobile) {
      const dup = checkDuplicateInInventory(
        imei1,
        imei2,
        serialNumber,
        editingId
      );
      if (dup.found) {
        if (dup.imei) alert("IMEI already exists");
        else if (dup.serial) alert("Serial Number already exists");
        else alert("Duplicate IMEI or Serial Number found");
        return;
      }
    }

    const payload = {
      id: editingId ?? Date.now().toString(),
      addMobile,
      addAccessories,

      // mobile
      brand: selectedBrand,
      model: selectedModel,
      variant: selectedVariant,
      condition,
      mobileBasicPrice,
      mobileDiscount,
      mobileMargin,
      mobileCGST,
      mobileSGST,
      mobileFinalPrice,
      serialNumber: norm(serialNumber),
      imei1: norm(imei1),
      imei2: norm(imei2),

      // accessories
      accessoryName,
      accessoryType,
      accessoryModel,
      accessoryBasicPrice,
      accessoryDiscount,
      accessoryCGST,
      accessorySGST,
      accessoryFinalPrice,
    };

    if (editingId) {
      setInventory((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, ...payload } : it))
      );
      setEditingId(null);
    } else {
      setInventory((prev) => [payload, ...prev]);
    }

    handleReset();
  };

  const handleEdit = (id) => {
    const it = inventory.find((x) => x.id === id);
    if (!it) return;

    setEditingId(id);

    setAddMobile(it.addMobile ?? true);
    setAddAccessories(it.addAccessories ?? false);

    // mobile
    setSelectedBrand(it.brand ?? "");
    setSelectedModel(it.model ?? "");
    setSelectedVariant(it.variant ?? "");
    setCondition(it.condition ?? "");
    setMobileBasicPrice(it.mobileBasicPrice ?? "");
    setMobileDiscount(it.mobileDiscount ?? "");
    setMobileMargin(it.mobileMargin ?? "");
    setMobileCGST(it.mobileCGST ?? "");
    setMobileSGST(it.mobileSGST ?? "");
    setMobileFinalPrice(it.mobileFinalPrice ?? "");
    setSerialNumber(it.serialNumber ?? "");
    setImei1(it.imei1 ?? "");
    setImei2(it.imei2 ?? "");

    // accessories
    setAccessoryName(it.accessoryName ?? "");
    setAccessoryType(it.accessoryType ?? "");
    setAccessoryModel(it.accessoryModel ?? "");
    setAccessoryBasicPrice(it.accessoryBasicPrice ?? "");
    setAccessoryDiscount(it.accessoryDiscount ?? "");
    setAccessoryCGST(it.accessoryCGST ?? "");
    setAccessorySGST(it.accessorySGST ?? "");
    setAccessoryFinalPrice(it.accessoryFinalPrice ?? "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    setInventory((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) {
      setEditingId(null);
      handleReset();
    }
  };

  const handleReset = () => {
    setAddMobile(true);
    setAddAccessories(false);

    // mobile
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedVariant("");
    setCondition("");
    setMobileBasicPrice("");
    setMobileDiscount("");
    setMobileMargin("");
    setMobileCGST("");
    setMobileSGST("");
    setMobileFinalPrice("");
    setSerialNumber("");
    setImei1("");
    setImei2("");

    // accessories
    setAccessoryName("");
    setAccessoryType("");
    setAccessoryModel("");
    setAccessoryBasicPrice("");
    setAccessoryDiscount("");
    setAccessoryCGST("");
    setAccessorySGST("");
    setAccessoryFinalPrice("");
  };

  const clearAllInventoryState = () => {
    setInventory([]);
    setEditingId(null);
    setLastUploadType(null);
    setUploadedFromExcel(false);
    handleReset();
  };

  const handleClearInventory = () => {
    if (!window.confirm("Clear all inventory items?")) return;
    clearAllInventoryState();
  };

  // ✅ Final submit: send to backend
  const handleFinalSubmit = async () => {
    if (!inventory.length) {
      alert("No inventory items to submit.");
      return;
    }

    const mobilesToSend = inventory.filter((it) => it.addMobile);
    const accessoriesToSend = inventory.filter((it) => it.addAccessories);

    for (const item of mobilesToSend) {
      if (!item.mobileFinalPrice || Number(item.mobileFinalPrice) <= 0) {
        alert(`Final Price missing for IMEI ${item.imei1 || "(blank IMEI)"}`);
        return;
      }
    }

    for (const item of accessoriesToSend) {
      if (!item.accessoryFinalPrice || Number(item.accessoryFinalPrice) <= 0) {
        alert(
          `Final Price missing for Accessory Model ${item.accessoryModel || "(blank model)"}`
        );
        return;
      }
    }

    try {
      // mobiles
      if (mobilesToSend.length) {
        await Promise.all(
          mobilesToSend.map((item) =>
            fetch("http://localhost:5000/api/mobiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brand: item.brand,
                model: item.model,
                variant: item.variant,
                condition: item.condition,

                basicPrice: Number(item.mobileBasicPrice || 0),
                discountAmount: Number(item.mobileDiscount || 0),
                marginAmount: Number(item.mobileMargin || 0),
                cgstAmount: Number(item.mobileCGST || 0),
                sgstAmount: Number(item.mobileSGST || 0),
                finalPrice: Number(item.mobileFinalPrice),

                serialNumber: item.serialNumber || "",
                imei1: item.imei1 || "",
                imei2: item.imei2 || "",
                status: "ready",
              }),
            })
          )
        );
      }

      // accessories
      if (accessoriesToSend.length) {
        await Promise.all(
          accessoriesToSend.map((item) =>
            fetch("http://localhost:5000/api/accessories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessory: item.accessoryName,
                accessoryType: item.accessoryType,
                modelNumber: item.accessoryModel,

                basicPrice: Number(item.accessoryBasicPrice || 0),
                discount: Number(item.accessoryDiscount || 0),
                cgst: Number(item.accessoryCGST || 0),
                sgst: Number(item.accessorySGST || 0),
                finalPrice: Number(item.accessoryFinalPrice || 0),

                status: "ready",
              }),
            })
          )
        );
      }

      alert(`Submitted ${inventory.length} item(s) successfully.`);
      clearAllInventoryState();
    } catch (err) {
      console.error("Submit Failed:", err);
      alert("Error submitting inventory");
    }
  };

  // ✅ Excel upload handler (UPDATED & DEBUG FRIENDLY)
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows.length) throw new Error("Sheet has no rows");

        const firstRow = normalizeRow(rawRows[0]);
        const headers = Object.keys(firstRow);

        // ✅ Detect mobile vs accessory
        const hasBrandModel = headers.includes("brand") && headers.includes("model");

        const hasAccessoryCols =
          headers.includes("accessory") ||
          headers.includes("accessory type") ||
          headers.includes("model number");

        if (hasBrandModel && hasAccessoryCols) {
          throw new Error("Excel contains both mobile and accessory columns.");
        }

        let fileType = null;
        if (hasBrandModel) fileType = "mobile";
        else if (hasAccessoryCols) fileType = "accessory";

        if (!fileType) {
          throw new Error(
            `Unknown Excel format. Headers found: ${headers.join(", ")}`
          );
        }

        if (lastUploadType && lastUploadType !== fileType) {
          throw new Error(
            "Upload Conflict: cannot mix mobiles & accessories in same inventory session."
          );
        }

        const ts = Date.now();

        const newItems = rawRows.map((r, idx) => {
          const row = normalizeRow(r);

          if (fileType === "mobile") {
            const brand = norm(getVal(row, ["brand"]));
            const model = norm(getVal(row, ["model"]));

            if (!brand || !model)
              throw new Error(`Missing Brand/Model at Excel row ${idx + 2}`);

            return {
              id: `excel-mobile-${ts}-${idx}`,
              addMobile: true,
              addAccessories: false,

              brand,
              model,
              variant: norm(getVal(row, ["variant"])),
              condition: norm(getVal(row, ["condition"])),

              serialNumber: norm(
                getVal(row, ["serial number", "serial no", "serial", "serialnumber"])
              ),
              imei1: norm(getVal(row, ["imei1", "imei 1", "imei no.1", "imei no 1"])),
              imei2: norm(getVal(row, ["imei2", "imei 2", "imei no.2", "imei no 2"])),

              mobileBasicPrice: toNum(getVal(row, ["basic price", "base price", "price"])),
              mobileDiscount: toNum(getVal(row, ["discount"])),
              mobileMargin: toNum(getVal(row, ["margin"])),
              mobileCGST: toNum(getVal(row, ["cgst"])),
              mobileSGST: toNum(getVal(row, ["sgst"])),
              mobileFinalPrice: toNum(getVal(row, ["final price", "finalprice"])),

              accessoryName: "",
              accessoryType: "",
              accessoryModel: "",
              accessoryBasicPrice: "",
              accessoryDiscount: "",
              accessoryCGST: "",
              accessorySGST: "",
              accessoryFinalPrice: "",
            };
          }

          // accessory mapping
          const accessoryName = norm(getVal(row, ["accessory"]));
          if (!accessoryName)
            throw new Error(`Missing Accessory at Excel row ${idx + 2}`);

          return {
            id: `excel-accessory-${ts}-${idx}`,
            addMobile: false,
            addAccessories: true,

            brand: "",
            model: "",
            variant: "",
            condition: "",
            serialNumber: "",
            imei1: "",
            imei2: "",
            mobileBasicPrice: "",
            mobileDiscount: "",
            mobileMargin: "",
            mobileCGST: "",
            mobileSGST: "",
            mobileFinalPrice: "",

            accessoryName,
            accessoryType: norm(getVal(row, ["accessory type"])),
            accessoryModel: norm(getVal(row, ["model number", "model no", "model"])),

            accessoryBasicPrice: toNum(getVal(row, ["basic price", "base price", "price"])),
            accessoryDiscount: toNum(getVal(row, ["discount"])),
            accessoryCGST: toNum(getVal(row, ["cgst"])),
            accessorySGST: toNum(getVal(row, ["sgst"])),
            accessoryFinalPrice: toNum(getVal(row, ["final price", "finalprice"])),
          };
        });

        // ✅ Duplicate check inside Excel + inventory
        if (fileType === "mobile") {
          const seenIMEI = new Set();
          const seenSerial = new Set();

          for (let i = 0; i < newItems.length; i++) {
            const it = newItems[i];
            const rowIndex = i + 2;

            if (it.imei1) {
              if (seenIMEI.has(it.imei1))
                throw new Error(`Duplicate IMEI1 inside Excel at row ${rowIndex}`);
              seenIMEI.add(it.imei1);
            }
            if (it.serialNumber) {
              if (seenSerial.has(it.serialNumber))
                throw new Error(
                  `Duplicate Serial Number inside Excel at row ${rowIndex}`
                );
              seenSerial.add(it.serialNumber);
            }

            const dup = checkDuplicateInInventory(
              it.imei1,
              it.imei2,
              it.serialNumber,
              null
            );
            if (dup.found) {
              if (dup.imei)
                throw new Error(
                  `IMEI already exists in Inventory (Excel row ${rowIndex})`
                );
              if (dup.serial)
                throw new Error(
                  `Serial already exists in Inventory (Excel row ${rowIndex})`
                );
              throw new Error(`Duplicate found (Excel row ${rowIndex})`);
            }
          }
        }

        setInventory((prev) => [...newItems, ...prev]);
        setLastUploadType(fileType);
        setUploadedFromExcel(true);

        if (fileType === "mobile") {
          setAddMobile(true);
          setAddAccessories(false);
        } else {
          setAddMobile(false);
          setAddAccessories(true);
        }

        alert("Upload Successful ✅");
      } catch (err) {
        console.error("Excel upload failed:", err);
        alert("Upload Error ❌: " + (err?.message || "Unknown error"));
      } finally {
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="add-inv-shell" style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}>
      <div className="add-inv-container">
        <div className="add-inv-row">
          {/* LEFT: Add Inventory form */}
          <section className="add-inv-card add-inv-form">
            <header className="add-inv-card-header">
              {editingId ? "Edit Inventory" : "Add Inventory"}
            </header>

            <form className="add-inv-form-body" onSubmit={handleSubmit}>
              {/* Add Mobile */}
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addMobile}
                    onChange={(e) => handleToggleMobile(e.target.checked)}
                    disabled={mobileLocked}
                  />
                  <span>Add Mobile</span>
                </label>
              </div>

              {/* Brand */}
              <label className="field-label">
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel("");
                    setSelectedVariant("");
                  }}
                  disabled={!addMobile || mobileLocked}
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Model */}
              <label className="field-label">
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    setSelectedVariant("");
                  }}
                  disabled={!addMobile || mobileLocked}
                >
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Variant */}
              <label className="field-label">
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                >
                  <option value="">Select Variant</option>
                  {variants.map((v, i) => (
                    <option key={i} value={v.variant ?? v}>
                      {v.variant ?? v}
                    </option>
                  ))}
                </select>
              </label>

              {/* Condition */}
              <label className="field-label">
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                >
                  <option value="">Select Condition</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </label>

              {/* Serial */}
              <label className="field-label">
                <input
                  type="text"
                  placeholder="Serial Number (optional)"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              {/* IMEI */}
              <label className="field-label">
                <input
                  type="text"
                  placeholder="IMEI No.1"
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="text"
                  placeholder="IMEI No.2"
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              {/* Mobile pricing */}
              <label className="field-label">
                <input
                  type="number"
                  placeholder="Basic Price (₹)"
                  value={mobileBasicPrice}
                  onChange={(e) => setMobileBasicPrice(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Discount (₹)"
                  value={mobileDiscount}
                  onChange={(e) => setMobileDiscount(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Margin"
                  value={mobileMargin}
                  onChange={(e) => setMobileMargin(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="CGST (₹)"
                  value={mobileCGST}
                  onChange={(e) => setMobileCGST(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="SGST (₹)"
                  value={mobileSGST}
                  onChange={(e) => setMobileSGST(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Final Price (₹)"
                  value={mobileFinalPrice}
                  onChange={(e) => setMobileFinalPrice(e.target.value)}
                  disabled={!addMobile || mobileLocked}
                />
              </label>

              {/* Add Accessories */}
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addAccessories}
                    onChange={(e) => handleToggleAccessories(e.target.checked)}
                    disabled={accessoryLocked}
                  />
                  <span>Add Accessories</span>
                </label>
              </div>

              {/* Accessories */}
              <label className="field-label">
                <select
                  value={accessoryName}
                  onChange={(e) => {
                    setAccessoryName(e.target.value);
                    setAccessoryType("");
                  }}
                  disabled={!addAccessories || accessoryLocked}
                >
                  <option value="">Select Accessories</option>
                  {accessoryOptions.map((item, idx) => (
                    <option key={idx} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                <select
                  value={accessoryType}
                  onChange={(e) => setAccessoryType(e.target.value)}
                  disabled={!addAccessories || !accessoryName || accessoryLocked}
                >
                  <option value="">Select Type</option>
                  {typeOptions.map((t, idx) => (
                    <option key={idx} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label">
                <input
                  type="text"
                  placeholder="Model Number"
                  value={accessoryModel}
                  onChange={(e) => setAccessoryModel(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Basic Price (₹)"
                  value={accessoryBasicPrice}
                  onChange={(e) => setAccessoryBasicPrice(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Discount (₹)"
                  value={accessoryDiscount}
                  onChange={(e) => setAccessoryDiscount(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="CGST (₹)"
                  value={accessoryCGST}
                  onChange={(e) => setAccessoryCGST(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="SGST (₹)"
                  value={accessorySGST}
                  onChange={(e) => setAccessorySGST(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <label className="field-label">
                <input
                  type="number"
                  placeholder="Final Price (₹)"
                  value={accessoryFinalPrice}
                  onChange={(e) => setAccessoryFinalPrice(e.target.value)}
                  disabled={!addAccessories || accessoryLocked}
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? "Save" : "Add"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* RIGHT: Inventory List */}
          <aside className="add-inv-card add-inv-list">
            <header className="add-inv-card-header">Inventory List</header>

            <div className="add-inv-list-body">
              {inventory.length === 0 ? (
                <div className="empty-placeholder">No inventory items yet</div>
              ) : (
                <div className="inventory-list">
                  {inventory.map((it) => (
                    <div key={it.id} className="inventory-item-card">
                      <div className="inventory-item-left">
                        <div className="inventory-title">
                          {it.addMobile && (
                            <>
                              <strong>{it.brand || "Mobile"}</strong>
                              {it.model ? ` - ${it.model}` : ""}
                            </>
                          )}

                          {it.addAccessories && (
                            <div className="inventory-accessory-line">
                              <strong>{it.accessoryName || "Accessory"}</strong>
                              {it.accessoryType ? ` (${it.accessoryType})` : ""}
                              {it.accessoryModel ? ` - ${it.accessoryModel}` : ""}
                            </div>
                          )}
                        </div>

                        {it.addAccessories && (
                          <div className="inventory-imei-block">
                            <div>Basic: ₹{it.accessoryBasicPrice}</div>
                            <div>Discount: ₹{it.accessoryDiscount}</div>
                            <div>CGST: ₹{it.accessoryCGST}</div>
                            <div>SGST: ₹{it.accessorySGST}</div>
                            <div>Final: ₹{it.accessoryFinalPrice}</div>
                          </div>
                        )}
                      </div>

                      <div className="inventory-item-actions">
                        <button className="btn-edit" onClick={() => handleEdit(it.id)}>
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(it.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!uploadedFromExcel && inventory.length === 0 && (
              <div className="upload-footer">
                <label className="upload-btn">
                  Upload Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            )}

            {inventory.length > 0 && (
              <div className="add-inv-list-footer">
                <div className="inventory-footer-actions">
                  <button
                    type="button"
                    className="btn-clear-inventory"
                    onClick={handleClearInventory}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn-submit-inventory"
                    onClick={handleFinalSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
