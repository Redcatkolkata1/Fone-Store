import React, { useState, useEffect } from "react";
import "./TFBAcc.css";

const TFBAcc = () => {
  const [search, setSearch] = useState("");
  const [accessories, setAccessories] = useState([]);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchTFBAccessories = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/accessories?status=tfb"
        );

        if (!res.ok) {
          throw new Error("Failed to fetch transferred accessories");
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setAccessories(data);
          setFiltered(data);
        } else {
          setAccessories([]);
          setFiltered([]);
        }
      } catch (err) {
        console.error("Error loading transferred accessories:", err);
        setAccessories([]);
        setFiltered([]);
      }
    };

    fetchTFBAccessories();
  }, []);

  const handleSearch = () => {
    const term = search.toLowerCase();

    const result = accessories.filter(
      (item) =>
        item.accessory?.toLowerCase().includes(term) ||
        item.accessoryType?.toLowerCase().includes(term) ||
        item.modelNumber?.toLowerCase().includes(term)
    );

    setFiltered(result);
  };

  const resetSearch = () => {
    setSearch("");
    setFiltered(accessories);
  };

  // cancel transfer and send back to READY
  const handleCancelTransfer = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/accessories/${id}/cancel-transfer`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to cancel transfer");
      }

      const updated = await res.json();
      console.log("Accessory moved back to READY:", updated);

      // Remove it from the TFB list in UI
      setAccessories((prev) => prev.filter((a) => a._id !== id));
      setFiltered((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cancelling transfer");
    }
  };

  return (
    <div className="tfbacc">
      {/* Search Bar */}
      <div className="tfbacc__search-bar">
        <input
          type="text"
          placeholder="Search by Accessory / Type / Model Number"
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

      <div className="tfbacc__table-wrapper">
        <table className="tfbacc__table">
          <thead>
            <tr>
              <th>Accessory</th>
              <th>Accessory Type</th>
              <th>Model Number</th>
              <th>Basic Price</th>
              <th>Discount</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Final Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr key={item._id}>
                <td>{item.accessory}</td>
                <td>{item.accessoryType}</td>
                <td>{item.modelNumber}</td>

                {/* ✅ NEW Pricing Columns */}
                <td>{item.basicPrice ?? 0}</td>
                <td>{item.discount ?? item.discountAmount ?? 0}</td>
                <td>{item.cgst ?? item.cgstAmount ?? 0}</td>
                <td>{item.sgst ?? item.sgstAmount ?? 0}</td>
                <td>{item.finalPrice ?? 0}</td>

                {/* ✅ Status column stays last */}
                <td>
                  <span className="status-badge">
                    {item.status === "tfb" ? "Not Yet Billed" : item.status}
                  </span>

                  {/* Cancel button BESIDE Status */}
                  {item.status === "tfb" && (
                    <button
                      className="btn--cancel-transfer"
                      onClick={() => handleCancelTransfer(item._id)}
                      style={{ marginLeft: "8px" }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" className="tfbacc__empty">
                  No transferred accessories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TFBAcc;
