// src/components/ReadyAcc.jsx
import React, { useState, useEffect } from "react";
import "./ReadyAcc.css";

const ReadyAcc = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [accessories, setAccessories] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Load only READY accessories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/accessories?status=ready"
        );

        if (!res.ok) {
          throw new Error("Failed to fetch ready accessories");
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setAccessories(data);
          setFilteredData(data);
        } else {
          setAccessories([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error("Error loading ready accessories:", err);
        setAccessories([]);
        setFilteredData([]);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();

    const result = accessories.filter(
      (item) =>
        item.accessory?.toLowerCase().includes(term) ||
        item.accessoryType?.toLowerCase().includes(term) ||
        item.modelNumber?.toLowerCase().includes(term)
    );

    setFilteredData(result);
  };

  const resetSearch = () => {
    setSearchTerm("");
    setFilteredData(accessories);
  };

  // Transfer one accessory to Billing (status -> "tfb")
  const handleBillingTransfer = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/accessories/${id}/transfer`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to transfer for billing");
      }

      const updated = await res.json();
      console.log("Accessory transferred for billing:", updated);

      // Remove from READY list locally
      setAccessories((prev) => prev.filter((a) => a._id !== id));
      setFilteredData((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error transferring accessory for billing");
    }
  };

  // Delete accessory entirely
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this accessory?"))
      return;

    try {
      const res = await fetch(`http://localhost:5000/api/accessories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete accessory");
      }

      // Remove without refresh
      setAccessories((prev) => prev.filter((a) => a._id !== id));
      setFilteredData((prev) => prev.filter((a) => a._id !== id));

      alert("Accessory deleted successfully");
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting accessory");
    }
  };

  return (
    <div className="readyacc">
      {/* Search Bar */}
      <div className="readyacc__search-bar">
        <input
          type="text"
          placeholder="Search by Accessory / Type / Model Number"
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

      <div className="readyacc__table-wrapper">
        <table className="readyacc__table">
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
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item) => (
              <tr key={item._id}>
                <td>{item.accessory}</td>
                <td>{item.accessoryType}</td>
                <td>{item.modelNumber}</td>

                {/* ✅ display exactly as stored */}
                <td>{item.basicPrice ?? ""}</td>

                {/* ✅ Fix: support both key names */}
                <td>{item.discount ?? item.discountAmount ?? ""}</td>
                <td>{item.cgst ?? item.cgstAmount ?? ""}</td>
                <td>{item.sgst ?? item.sgstAmount ?? ""}</td>

                <td>{item.finalPrice ?? ""}</td>

                <td>
                  <button
                    className="btn--billing"
                    onClick={() => handleBillingTransfer(item._id)}
                    style={{ marginRight: "8px" }}
                  >
                    Transfer for Billing
                  </button>

                  <button
                    className="btn--delete"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan="9" className="readyacc__empty">
                  No accessories available under Ready inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReadyAcc;
