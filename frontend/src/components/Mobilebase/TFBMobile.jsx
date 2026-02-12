// src/components/TFBMobile.jsx
import React, { useEffect, useState, useContext } from "react"; // 1. Import useContext
import "./TFBMobile.css";
import { StockContext } from "../StockContext"; // 2. Import StockContext

const TFBMobile = () => {
  const [search, setSearch] = useState("");
  const [mobiles, setMobiles] = useState([]); 
  const [filtered, setFiltered] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. Get the trigger from Context
  const { stockRefreshTrigger } = useContext(StockContext);

  // Defined outside useEffect so it can be called cleanly
  const fetchTFBMobiles = async () => {
    setLoading(true);
    setError("");
    try {
      // Added timestamp ?t=... to ensure browser doesn't serve cached old data
      const res = await fetch(`http://localhost:5000/api/mobiles?status=tfb&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch transferred mobiles");
      const data = await res.json();
      setMobiles(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading transferred mobiles:", err);
      setError(err.message || "Error loading transferred mobiles");
      setMobiles([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTFBMobiles();
    // 4. Add stockRefreshTrigger to dependencies.
    // Whenever Billing.jsx calls refreshMobileStock(), this number changes, 
    // and this useEffect runs again automatically.
  }, [stockRefreshTrigger]); 

  const handleSearch = () => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFiltered(mobiles);
      return;
    }

    const result = mobiles.filter((item) => {
      const brand = (item.brand || "").toLowerCase();
      const model = (item.model || "").toLowerCase();
      const variant = (item.variant || "").toLowerCase();
      const condition = (item.condition || "").toLowerCase();
      const imei1 = (item.imei1 || "").toString().toLowerCase();
      const imei2 = (item.imei2 || "").toString().toLowerCase();

      return (
        brand.includes(term) ||
        model.includes(term) ||
        variant.includes(term) ||
        condition.includes(term) ||
        imei1.includes(term) ||
        imei2.includes(term)
      );
    });

    setFiltered(result);
  };

  const resetSearch = () => {
    setSearch("");
    setFiltered(mobiles);
  };

  // Cancel transfer handler
  const handleCancel = async (mobileId) => {
    if (!window.confirm("Cancel transfer for billing for this mobile?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/mobiles/${mobileId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to cancel transfer");
      }

      // Remove from local state (successful cancel)
      setMobiles((prev) => prev.filter((m) => m._id !== mobileId));
      setFiltered((prev) => prev.filter((m) => m._id !== mobileId));
    } catch (err) {
      console.error("Error cancelling TFB mobile:", err);
      alert(err.message || "Failed to cancel transfer for billing.");
    }
  };

  const renderStatusLabel = (status) => {
    if (!status) return "Unknown";
    if (status === "tfb") return "Not Billed";
    if (status === "ready") return "Ready";
    if (status === "sold") return "Sold";
    return status;
  };

  const formatINR = (value) => {
    return "₹ " + Number(value || 0).toLocaleString("en-IN");
  };

  return (
    <div className="tfbmob">
      <div className="tfbmob__search-bar">
        <input
          type="text"
          placeholder="Search by Brand / Model / IMEI / Condition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-search" onClick={handleSearch}>
          Search
        </button>
        <button className="btn-reset" onClick={resetSearch}>
          Reset
        </button>
      </div>

      <div className="tfbmob__table-wrapper">
        <table className="tfbmob__table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Variant</th>
              <th>Condition</th>
              <th>Serial Number</th>
              <th>IMEI</th>
              <th>Basic Price</th>
              <th>Discount</th>
              <th>Margin</th>
              <th>CGST (₹)</th>
              <th>SGST (₹)</th>
              <th>Final Price</th>
              <th>Status</th>
              <th>Cancel</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="14" className="tfbmob__empty">
                  Loading mobiles...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan="14" className="tfbmob__empty">
                  {error}
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              filtered.map((item) => {
                const serial = (() => {
                  const s = item.serialNumber ?? item.serial_no ?? "";
                  return String(s).trim() !== "" ? String(s).trim() : "-";
                })();

                const basicPrice = Number(
                  item.basicPrice ?? item.mobileBasicPrice ?? item.retailerPrice ?? 0
                );

                const discountAmount = Number(
                  item.discountAmount ?? item.mobileDiscount ?? item.discount ?? 0
                );

                let marginAmount = 0;
                if (item.marginAmount !== undefined && !isNaN(Number(item.marginAmount))) {
                  marginAmount = Number(item.marginAmount);
                } else if (item.mobileMargin !== undefined && !isNaN(Number(item.mobileMargin))) {
                  marginAmount = Number(item.mobileMargin);
                } else if (item.margin !== undefined && !isNaN(Number(item.margin))) {
                  marginAmount = Number(item.margin);
                } else if (item.marginPercent !== undefined && !isNaN(Number(item.marginPercent))) {
                  marginAmount = (basicPrice * Number(item.marginPercent)) / 100;
                } else {
                  marginAmount = 0;
                }

                const taxableBase = Math.max(basicPrice - discountAmount + marginAmount, 0);

                let cgstAmount = Number(item.cgstAmount ?? item.mobileCGST ?? item.cgst ?? 0);
                if (!cgstAmount) {
                  const cgstPercent = Number(item.cgstPercent ?? item.mobileCGSTPercent ?? 0);
                  if (cgstPercent) cgstAmount = (taxableBase * cgstPercent) / 100;
                }

                let sgstAmount = Number(item.sgstAmount ?? item.mobileSGST ?? item.sgst ?? 0);
                if (!sgstAmount) {
                  const sgstPercent = Number(item.sgstPercent ?? item.mobileSGSTPercent ?? 0);
                  if (sgstPercent) sgstAmount = (taxableBase * sgstPercent) / 100;
                }

                const storedFinal = Number(item.finalPrice ?? item.mobileFinalPrice ?? 0);
                let finalPrice;
                if (storedFinal && storedFinal > 0) {
                  finalPrice = storedFinal;
                } else {
                  finalPrice = taxableBase + cgstAmount + sgstAmount;
                }

                return (
                  <tr key={item._id}>
                    <td>{item.brand}</td>
                    <td>{item.model}</td>
                    <td>{item.variant}</td>
                    <td>{item.condition}</td>
                    <td>{serial}</td>

                    <td>
                      <div>{item.imei1}</div>
                      {item.imei2 && <div>{item.imei2}</div>}
                    </td>

                    <td>{formatINR(basicPrice)}</td>
                    <td>{discountAmount && discountAmount > 0 ? formatINR(discountAmount) : "-"}</td>
                    <td>{marginAmount && marginAmount > 0 ? formatINR(marginAmount) : "-"}</td>
                    <td>{formatINR(cgstAmount)}</td>
                    <td>{formatINR(sgstAmount)}</td>
                    <td>{formatINR(finalPrice)}</td>

                    <td>
                      <span className={`status-badge status-${item.status || "unknown"}`}>
                        {renderStatusLabel(item.status)}
                      </span>
                    </td>

                    <td>
                      <button className="btn-cancel" onClick={() => handleCancel(item._id)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan="14" className="tfbmob__empty">
                  No mobiles transferred for billing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TFBMobile;