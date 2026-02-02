// src/components/SoldAcc.jsx
import React, { useState, useEffect } from "react";
import "./SoldAcc.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_URL = "http://localhost:5000/api/soldaccessories";

const SoldAcc = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Date filters
  const [dateFilter, setDateFilter] = useState(""); // single date
  const [fromDate, setFromDate] = useState("");     // range from
  const [toDate, setToDate] = useState("");         // range to

  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------
  // Helpers
  // -------------------------
  const safeLower = (v) => String(v || "").toLowerCase();

  const isWithinRange = (billingDate, from, to) => {
    // billingDate already in YYYY-MM-DD
    if (!billingDate) return false;

    const d = new Date(billingDate);
    if (from) {
      const f = new Date(from);
      if (d < f) return false;
    }
    if (to) {
      const t = new Date(to);
      if (d > t) return false;
    }
    return true;
  };

  // -------------------------
  // Fetch
  // -------------------------
  useEffect(() => {
    const fetchSoldAccessories = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(API_URL);

        if (!res.ok) {
          throw new Error("Failed to fetch sold accessories");
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          const normalized = data.map((item, idx) => {
            const customer =
              item.customer ||
              item.customerName ||
              (item.customerDetails && item.customerDetails.name) ||
              "";

            const phone =
              item.phone ||
              item.customerPhone ||
              (item.customerDetails && item.customerDetails.phone) ||
              "";

            const accessoryName =
              item.accessory ||
              item.product ||
              item.accessoryName ||
              "";

            const accessoryType =
              item.accessoryType ||
              item.type ||
              "";

            const product = accessoryType
              ? `${accessoryName} ${accessoryType}`
              : accessoryName;

            const modelNumber =
              item.modelNumber ||
              item.model ||
              "";

            // ✅ Final Price (sellingPrice)
            const finalPrice =
              Number(
                item.finalPrice ??
                item.sellingPrice ??
                item.customerPrice ??
                0
              ) || 0;

            const billingDate =
              item.billingDate ||
              item.invoiceDate ||
              "";

            const billingDateTimeIST = item.billingDateTimeIST || "";

            return {
              id: item._id || item.id || `sold-${idx}`,
              customer,
              phone,
              product,
              accessoryType,
              modelNumber,
              finalPrice,
              billingDate,
              billingDateTimeIST,
            };
          });

          setAllData(normalized);
          setFilteredData(normalized);
        } else {
          setAllData([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error("Error loading sold accessories:", err);
        setError(err.message || "Error loading sold accessories");
        setAllData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldAccessories();
  }, []);

  // -------------------------
  // Filters
  // -------------------------
  const applyFilters = (term, singleDate, from, to) => {
    const t = safeLower(term);

    let result = allData.filter((item) => {
      const matchesText =
        safeLower(item.customer).includes(t) ||
        safeLower(item.phone).includes(t) ||
        safeLower(item.product).includes(t) ||
        safeLower(item.modelNumber).includes(t) ||
        safeLower(item.accessoryType).includes(t);

      return matchesText;
    });

    // ✅ single date filter (exact match)
    if (singleDate) {
      result = result.filter((item) => item.billingDate === singleDate);
    }

    // ✅ range filter (from-to)
    if (from || to) {
      result = result.filter((item) =>
        isWithinRange(item.billingDate, from, to)
      );
    }

    setFilteredData(result);
  };

  const handleSearchClick = () => {
    applyFilters(searchTerm, dateFilter, fromDate, toDate);
  };

  const handleDateFilterClick = () => {
    applyFilters(searchTerm, dateFilter, fromDate, toDate);
  };

  const handleRangeFilterClick = () => {
    // clear single-date if using range
    setDateFilter("");
    applyFilters(searchTerm, "", fromDate, toDate);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setFromDate("");
    setToDate("");
    setFilteredData(allData);
  };

  // -------------------------
  // Export Excel
  // -------------------------
  const exportToExcel = () => {
    if (!filteredData.length) {
      alert("No data to export.");
      return;
    }

    const excelData = filteredData.map((row, index) => ({
      "Sl No": index + 1,
      Customer: row.customer,
      "Phone Number": row.phone,
      Product: row.product,
      "Model Number": row.modelNumber,
      "Final Price": row.finalPrice,
      "Date of Billing": row.billingDateTimeIST || row.billingDate,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sold Accessories");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `sold_accessories_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="soldacc">
      {/* Controls */}
      <div className="soldacc__controls">
        {/* Search */}
        <div className="soldacc__search">
          <input
            type="text"
            placeholder="Search by Customer / Phone / Product / Model Number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-search" onClick={handleSearchClick}>
            Search
          </button>
        </div>

        {/* Single Date Filter */}
        <div className="soldacc__date-filter">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              // clear range if user uses single filter
              setFromDate("");
              setToDate("");
            }}
          />
          <button className="btn-date" onClick={handleDateFilterClick}>
            Filter by Date
          </button>
          <button className="btn-reset" onClick={resetFilters}>
            Reset
          </button>
        </div>

        {/* ✅ Range Filter */}
        <div className="soldacc__range-filter">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To Date"
          />
          <button className="btn-range" onClick={handleRangeFilterClick}>
            Filter by Period
          </button>
        </div>

        {/* ✅ Export */}
        <div className="soldacc__export">
          <button className="btn-export" onClick={exportToExcel}>
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="soldacc__table-wrapper">
        <table className="soldacc__table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone Number</th>
              <th>Product</th>
              <th>Model Number</th>
              {/* ✅ Removed Basic Price */}
              {/* ✅ Removed Discount */}
              <th>Final Price</th>
              <th>Date of Billing</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="soldacc__empty">
                  Loading sold accessories...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan="6" className="soldacc__empty">
                  {error}
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.customer}</td>
                  <td>{item.phone}</td>
                  <td>{item.product}</td>
                  <td>{item.modelNumber}</td>

                  <td className="soldacc__selling">
                    ₹ {Number(item.finalPrice || 0).toLocaleString("en-IN")}
                  </td>

                  <td>{item.billingDateTimeIST || item.billingDate}</td>
                </tr>
              ))}

            {!loading && !error && filteredData.length === 0 && (
              <tr>
                <td colSpan="6" className="soldacc__empty">
                  No sold accessory records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SoldAcc;
