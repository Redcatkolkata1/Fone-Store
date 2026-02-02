// src/components/ReadyMobile.jsx
import React, { useState, useEffect } from "react";
import "./ReadyMobile.css";

const ReadyMobile = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mobiles, setMobiles] = useState([]); // full list from backend
  const [filteredData, setFilteredData] = useState([]); // currently shown

  // Fetch mobiles (status=ready) once when component mounts
  useEffect(() => {
    const fetchMobiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mobiles?status=ready");

        if (!res.ok) {
          throw new Error("Failed to fetch ready mobiles");
        }

        const data = await res.json();
        setMobiles(data);
        setFilteredData(data); // initial table contents
      } catch (err) {
        console.error("Error fetching ready mobiles:", err);
      }
    };

    fetchMobiles();
  }, []);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();

    const filter = mobiles.filter(
      (item) =>
        item.brand?.toLowerCase().includes(term) ||
        item.model?.toLowerCase().includes(term) ||
        item.condition?.toLowerCase().includes(term) ||
        String(item.imei1 || "").includes(term) ||
        String(item.imei2 || "").includes(term)
    );

    setFilteredData(filter);
  };

  const resetSearch = () => {
    setSearchTerm("");
    setFilteredData(mobiles);
  };

  const handleTransferForBilling = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/mobiles/${id}/transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to transfer for billing");
      }

      const updated = await res.json();
      console.log("Transferred for billing:", updated);

      // Remove this item from local ready lists
      setMobiles((prev) => prev.filter((m) => m._id !== id));
      setFilteredData((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error transferring mobile for billing");
    }
  };

  const handleDeleteMobile = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to permanently delete this mobile from READY?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:5000/api/mobiles/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete mobile");
      }

      // Remove from local lists
      setMobiles((prev) => prev.filter((m) => m._id !== id));
      setFilteredData((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting mobile");
    }
  };

  return (
    <div className="readymob">
      {/* SEARCH BAR */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Brand / Model / IMEI / Condition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-search" onClick={handleSearch}>
          Search
        </button>
        <button className="btn-reset" onClick={resetSearch}>
          Reset
        </button>
      </div>

      <div className="readymob__table-wrapper">
        <table className="readymob__table">
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const serial =
                item.serialNumber && String(item.serialNumber).trim() !== ""
                  ? item.serialNumber
                  : "-";

              // Get basic price
              const basicPrice = Number(
                item.basicPrice ?? item.mobileBasicPrice ?? item.customerPrice ?? 0
              );

              // discount reading: accept multiple possible names
              const discountAmount = Number(
                item.discountAmount ?? item.mobileDiscount ?? item.discount ?? 0
              );

              // render discount: dash when not provided (0)
              const discountDisplay =
                discountAmount && discountAmount > 0
                  ? `₹ ${discountAmount.toLocaleString("en-IN")}`
                  : "-";

              // Margin is NOW rupee amount (not percent)
              const marginAmount = Number(
                item.marginAmount ?? item.mobileMargin ?? item.margin ?? 0
              );

              // Tax amounts (prefer rupee amount fields). Back-compat: if only percent available, compute amount.
              // taxableBase = basicPrice - discount + margin
              const taxableBase = Math.max(basicPrice - discountAmount + marginAmount, 0);

              // cgst amount: prefer explicit rupee field (cgstAmount / mobileCGST), else derive from percent
              let cgstAmount = Number(item.cgstAmount ?? item.mobileCGST ?? item.cgst ?? 0);
              if (!cgstAmount) {
                // check for percent field as fallback
                const cgstPercent = Number(item.cgstPercent ?? item.mobileCGSTPercent ?? 0);
                if (cgstPercent) {
                  cgstAmount = (taxableBase * cgstPercent) / 100;
                }
              }

              let sgstAmount = Number(item.sgstAmount ?? item.mobileSGST ?? item.sgst ?? 0);
              if (!sgstAmount) {
                const sgstPercent = Number(item.sgstPercent ?? item.mobileSGSTPercent ?? 0);
                if (sgstPercent) {
                  sgstAmount = (taxableBase * sgstPercent) / 100;
                }
              }

              // Prefer stored final price if present
              const storedFinal = Number(item.finalPrice ?? item.mobileFinalPrice ?? 0);

              // Compute final price manually only when storedFinal is missing
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
                    {item.imei1}
                    <br />
                    {item.imei2}
                  </td>

                  <td>₹ {basicPrice.toLocaleString("en-IN")}</td>
                  <td>{discountDisplay}</td>

                  {/* MARGIN AS AMOUNT */}
                  <td>₹ {marginAmount.toLocaleString("en-IN")}</td>

                  <td>₹ {Number(cgstAmount).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(sgstAmount).toLocaleString("en-IN")}</td>

                  <td>₹ {Number(finalPrice).toLocaleString("en-IN")}</td>

                  <td>
                    <button
                      className="btn btn--billing"
                      onClick={() => handleTransferForBilling(item._id)}
                    >
                      Transfer for Billing
                    </button>

                    <button
                      className="btn btn--delete"
                      onClick={() => handleDeleteMobile(item._id)}
                      style={{ marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan="13" className="readymob__empty">
                  No matching mobiles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReadyMobile;
