// src/components/SoldMobile.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./SoldMobile.css";

const SoldMobile = () => {
  const [soldMobiles, setSoldMobiles] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Single date filter (existing)
  const [dateFilter, setDateFilter] = useState("");

  // ✅ NEW: Date range filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch sold mobiles
  useEffect(() => {
    const fetchSold = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/soldmobiles");
        if (!res.ok) throw new Error("Failed to fetch sold mobiles");
        const data = await res.json();

        const rows = Array.isArray(data) ? data : [];
        setSoldMobiles(rows);
        setFilteredData(rows);
      } catch (err) {
        console.error(err);
        setSoldMobiles([]);
        setFilteredData([]);
      }
    };

    fetchSold();
  }, []);

  // ---------- Helpers ----------
  const safeLower = (v) => String(v || "").toLowerCase();

  // Extract "YYYY-MM-DD" from different formats
  const extractBillingDate = (item) => {
    // preferred backend billingDate (already YYYY-MM-DD)
    if (item?.billingDate) return String(item.billingDate).slice(0, 10);

    // fallback - billingDateTimeIST like "28/01/2026, 07:45:27 pm IST, India"
    if (item?.billingDateTimeIST) {
      const s = String(item.billingDateTimeIST);

      // try to match dd/mm/yyyy
      const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) {
        const dd = m[1];
        const mm = m[2];
        const yyyy = m[3];
        return `${yyyy}-${mm}-${dd}`; // convert to YYYY-MM-DD
      }
    }

    return "";
  };

  const applyFilters = ({ term, date, from, to }) => {
    const t = safeLower(term);

    let result = soldMobiles.filter((item) => {
      const customer = safeLower(item.customer);
      const phone = safeLower(item.phone);
      const product = safeLower(item.product);
      const grade = safeLower(item.condition);
      const serial = safeLower(item.serialNumber);
      const imei1 = safeLower(item.imei1);
      const imei2 = safeLower(item.imei2);

      return (
        customer.includes(t) ||
        phone.includes(t) ||
        product.includes(t) ||
        grade.includes(t) ||
        serial.includes(t) ||
        imei1.includes(t) ||
        imei2.includes(t)
      );
    });

    // ✅ Single Date filter
    if (date) {
      result = result.filter((item) => extractBillingDate(item) === date);
    }

    // ✅ Date Range filter
    if (from || to) {
      const fromVal = from ? new Date(from).getTime() : null;
      const toVal = to ? new Date(to).getTime() : null;

      result = result.filter((item) => {
        const d = extractBillingDate(item);
        if (!d) return false;

        const time = new Date(d).getTime();
        if (fromVal && time < fromVal) return false;
        if (toVal && time > toVal) return false;
        return true;
      });
    }

    setFilteredData(result);
  };

  // ---------- Events ----------
  const handleSearchClick = () => {
    applyFilters({
      term: searchTerm,
      date: dateFilter,
      from: fromDate,
      to: toDate,
    });
  };

  const handleSingleDateFilter = () => {
    // clear range when using single date
    setFromDate("");
    setToDate("");

    applyFilters({
      term: searchTerm,
      date: dateFilter,
      from: "",
      to: "",
    });
  };

  const handleDateRangeFilter = () => {
    // clear single date when using range
    setDateFilter("");

    applyFilters({
      term: searchTerm,
      date: "",
      from: fromDate,
      to: toDate,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("");
    setFromDate("");
    setToDate("");
    setFilteredData(soldMobiles);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const exportData = filteredData.map((item, index) => ({
      "S.No": index + 1,
      Customer: item.customer || "",
      "Phone Number": item.phone || "",
      Product: item.product || "",
      Grade: item.condition || "",
      "Serial Number": item.serialNumber || "",
      "IMEI 1": item.imei1 || "",
      "IMEI 2": item.imei2 || "",
      "Final Price": Number(item.finalPrice || item.customerPrice || 0),
      "Billing Date": item.billingDateTimeIST || item.billingDate || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sold Mobiles");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Sold_Mobiles_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="soldmob">
      {/* Controls */}
      <div className="soldmob__controls">
        {/* Search */}
        <div className="soldmob__search">
          <input
            type="text"
            placeholder="Search by Customer / Phone / Product / Grade / Serial / IMEI"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-search" onClick={handleSearchClick}>
            Search
          </button>
        </div>

        {/* Single Date Filter */}
        <div className="soldmob__date-filter">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <button className="btn-date" onClick={handleSingleDateFilter}>
            Filter by Date
          </button>
          <button className="btn-reset" onClick={handleReset}>
            Reset
          </button>
        </div>

        {/* ✅ NEW Range Filter (From-To) */}
        <div className="soldmob__date-range">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To"
          />
          <button className="btn-date" onClick={handleDateRangeFilter}>
            Filter by Time Period
          </button>
        </div>

        {/* Export */}
        <div className="soldmob__export">
          <button className="btn-export" onClick={handleExportExcel}>
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="soldmob__table-wrapper">
        <table className="soldmob__table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone Number</th>
              <th>Product</th>
              <th>Grade</th>
              <th>Serial Number</th>
              <th>IMEI</th>
              <th>Final Price</th>
              <th>Date Of Billing</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item) => (
              <tr key={item._id || `${item.customer}-${item.imei1}`}>
                <td>{item.customer}</td>
                <td>{item.phone}</td>
                <td>{item.product}</td>
                <td>{item.condition}</td>

                <td>
                  {item.serialNumber && String(item.serialNumber).trim() !== ""
                    ? item.serialNumber
                    : "-"}
                </td>

                <td>
                  {item.imei1 || "-"}
                  {item.imei2 ? (
                    <>
                      <br />
                      {item.imei2}
                    </>
                  ) : null}
                </td>

                <td className="sell-high">
                  ₹{" "}
                  {Number(item.finalPrice || item.customerPrice || 0).toLocaleString(
                    "en-IN"
                  )}
                </td>

                <td>{item.billingDateTimeIST || item.billingDate}</td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan="8" className="soldmob__empty">
                  No sold records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SoldMobile;
