// src/components/Transactions.jsx
import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import "./Transactions.css";

/**
 * Compute a numeric timestamp for sorting (newest first).
 * Tries billingDateTimeIST like "10/12/2025, 02:29:19 pm IST, India"
 * then falls back to ISO-like billingDate ("2025-12-10").
 */
const computeSortTimestamp = (billingDate, billingDateTimeIST) => {
  if (billingDateTimeIST) {
    const match = billingDateTimeIST.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)/i
    );

    if (match) {
      const [, dStr, mStr, yStr, hStr, minStr, sStr, ampm] = match;
      const day = Number(dStr);
      const month = Number(mStr);
      const year = Number(yStr);
      let hour = Number(hStr);
      const minute = Number(minStr);
      const second = Number(sStr);

      const isPm = ampm.toLowerCase() === "pm";
      hour = hour % 12 + (isPm ? 12 : 0);

      const dt = new Date(year, month - 1, day, hour, minute, second);
      const ts = dt.getTime();
      if (!Number.isNaN(ts)) return ts;
    }
  }

  if (billingDate) {
    const ts = Date.parse(billingDate);
    if (!Number.isNaN(ts)) return ts;
  }

  return 0;
};

// Extract YYYY-MM-DD from transaction row
const extractBillingDate = (row) => {
  if (row?.billingDate) return String(row.billingDate).slice(0, 10);

  if (row?.billingDateTimeIST) {
    const s = String(row.billingDateTimeIST);
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) {
      const dd = m[1];
      const mm = m[2];
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return "";
};

export default function Transactions({ sidebarWidth = 64 }) {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // filters
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ single date filter
  const [dateFilter, setDateFilter] = useState("");

  // ✅ time period filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // data
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(0);

  const ddRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleDocClick(e) {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  const handleToggle = () => setDropdownOpen((s) => !s);
  const handleSelect = (n) => {
    setRowsPerPage(n);
    setDropdownOpen(false);
    setCurrentPage(0);
  };

  // ---- FETCH & NORMALIZE DATA FROM BOTH ENDPOINTS ----
  useEffect(() => {
    const fetchAllTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const [mobRes, accRes] = await Promise.all([
          fetch("http://localhost:5000/api/soldmobiles"),
          fetch("http://localhost:5000/api/soldaccessories"),
        ]);

        if (!mobRes.ok) throw new Error("Failed to fetch sold mobiles");
        if (!accRes.ok) throw new Error("Failed to fetch sold accessories");

        const [mobData, accRaw] = await Promise.all([mobRes.json(), accRes.json()]);

        // --- Normalize mobiles ---
        const mobiles = Array.isArray(mobData)
          ? mobData.map((item, idx) => {
              const billingDate = item.billingDate || "";
              const billingDateTimeIST = item.billingDateTimeIST || "";

              const discount = Number(item.discount || 0);
              const sellingPrice = Number(item.finalPrice ?? item.sellingPrice ?? item.customerPrice ?? 0);

              const sortTimestamp = computeSortTimestamp(billingDate, billingDateTimeIST);

              return {
                id: item._id || `mob-${idx}`,
                customer: item.customer || "",
                phone: item.phone || "",
                product: item.product || "",
                serialOrModel:
                  item.serialNumber && String(item.serialNumber).trim() !== ""
                    ? item.serialNumber
                    : "-",
                discount,
                sellingPrice,
                billingDate,
                billingDateTimeIST,
                sortTimestamp,
              };
            })
          : [];

        // --- Normalize accessories ---
        const accessories = Array.isArray(accRaw)
          ? accRaw.map((item, idx) => {
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

              const product =
                item.product || item.accessory || item.accessoryName || "";

              const discount = Number(item.discount ?? 0) || 0;

              // show final values in Transactions view
              const sellingPrice = Number(item.finalPrice ?? item.sellingPrice ?? 0) || 0;

              const billingDate = item.billingDate || item.invoiceDate || "";
              const billingDateTimeIST = item.billingDateTimeIST || "";

              const sortTimestamp = computeSortTimestamp(billingDate, billingDateTimeIST);

              return {
                id: item._id || item.id || `acc-${idx}`,
                customer,
                phone,
                product,
                serialOrModel:
                  item.modelNumber && String(item.modelNumber).trim() !== ""
                    ? item.modelNumber
                    : "-",
                discount,
                sellingPrice,
                billingDate,
                billingDateTimeIST,
                sortTimestamp,
              };
            })
          : [];

        const combined = [...mobiles, ...accessories];

        // newest first
        combined.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

        setAllData(combined);
        setFilteredData(combined);
        setCurrentPage(0);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err.message || "Error fetching transactions");
        setAllData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  // ---- FILTERS ----
  const applyFilters = ({ term, date, from, to }) => {
    const t = String(term || "").toLowerCase();

    let result = allData.filter((item) => {
      const matchesText =
        String(item.customer || "").toLowerCase().includes(t) ||
        String(item.phone || "").toLowerCase().includes(t) ||
        String(item.product || "").toLowerCase().includes(t) ||
        String(item.serialOrModel || "").toLowerCase().includes(t); // ✅ FIXED

      return matchesText;
    });

    // ✅ Single date filter
    if (date) {
      result = result.filter((item) => extractBillingDate(item) === date);
    }

    // ✅ Time period filter
    if (from || to) {
      const fromTime = from ? new Date(from).getTime() : null;
      const toTime = to ? new Date(to).getTime() : null;

      result = result.filter((item) => {
        const d = extractBillingDate(item);
        if (!d) return false;

        const time = new Date(d).getTime();
        if (fromTime && time < fromTime) return false;
        if (toTime && time > toTime) return false;
        return true;
      });
    }

    setFilteredData(result);
    setCurrentPage(0);
  };

  // SEARCH button handler
  const handleSearchClick = () => {
    applyFilters({
      term: searchTerm,
      date: dateFilter,
      from: fromDate,
      to: toDate,
    });
  };

  // Single date filter button
  const handleFilterByDateClick = () => {
    setFromDate("");
    setToDate("");

    applyFilters({
      term: searchTerm,
      date: dateFilter,
      from: "",
      to: "",
    });
  };

  // Time period button
  const handleFilterByPeriodClick = () => {
    setDateFilter("");

    applyFilters({
      term: searchTerm,
      date: "",
      from: fromDate,
      to: toDate,
    });
  };

  // Reset
  const handleReset = () => {
    setSearchTerm("");
    setDateFilter("");
    setFromDate("");
    setToDate("");
    setFilteredData(allData);
    setCurrentPage(0);
  };

  // ---- PAGINATION ----
  const total = filteredData.length;
  const startIndex = total === 0 ? 0 : currentPage * rowsPerPage + 1;
  const endIndex =
    total === 0 ? 0 : Math.min((currentPage + 1) * rowsPerPage, total);

  const pageItems = filteredData.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  const canPrev = currentPage > 0;
  const canNext = (currentPage + 1) * rowsPerPage < total;

  const goPrev = () => {
    if (canPrev) setCurrentPage((p) => p - 1);
  };

  const goNext = () => {
    if (canNext) setCurrentPage((p) => p + 1);
  };

  // ---------- EXPORT ----------
  const buildExportRows = () => {
    return filteredData.map((item) => ({
      Customer: item.customer,
      "Phone Number": item.phone,
      Product: item.product,
      "Serial / Model Number": item.serialOrModel,
      Discount: item.discount,
      "Selling Price": item.sellingPrice,
      "Billing Date": item.billingDateTimeIST || item.billingDate,
    }));
  };

  const exportCSV = () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
  };

  return (
    <div
      className="transactions-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <main className="transactions-body">
        <div className="transactions-container">
          {/* ✅ HEADER CARD */}
          <header className="transactions-header">
            {/* Search */}
            <div className="transactions-search">
              <input
                placeholder="Search by Customer / Phone / Product / Model / Serial"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Single Date */}
            <div className="transactions-controls">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Export buttons */}
            <div className="transactions-export">
              <button className="btn-export" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="btn-export" onClick={exportExcel}>
                Export Excel
              </button>
            </div>

            {/* ✅ NEW: Action row */}
            <div className="transactions-actions">
              <button className="btn-action" onClick={handleSearchClick}>
                Search
              </button>

              <button className="btn-action btn-dark" onClick={handleFilterByDateClick}>
                Filter by Date
              </button>

              <button className="btn-action btn-reset" onClick={handleReset}>
                Reset
              </button>
            </div>

            {/* ✅ NEW: Time Period row */}
            <div className="transactions-period">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <button className="btn-action btn-dark" onClick={handleFilterByPeriodClick}>
                Filter by Time Period
              </button>
            </div>
          </header>

          {/* ✅ TABLE */}
          <section className="transactions-table-wrap">
            <div className="transactions-table-head">
              <div className="col">CUSTOMER</div>
              <div className="col">PHONE NUMBER</div>
              <div className="col">PRODUCT</div>
              <div className="col">SERIAL / MODEL NUMBER</div>
              <div className="col">DISCOUNT</div>
              <div className="col">SELLING PRICE</div>
              <div className="col">DATE OF BILLING</div>
            </div>

            <div className="transactions-table-body">
              {loading && (
                <div className="transactions-row empty-row">
                  Loading transactions...
                </div>
              )}

              {!loading && error && (
                <div className="transactions-row empty-row">{error}</div>
              )}

              {!loading && !error && pageItems.length === 0 && (
                <div className="transactions-row empty-row">
                  No transactions found.
                </div>
              )}

              {!loading &&
                !error &&
                pageItems.map((item) => (
                  <div className="transactions-row" key={item.id}>
                    <div className="col">{item.customer}</div>
                    <div className="col">{item.phone}</div>
                    <div className="col">{item.product}</div>
                    <div className="col">{item.serialOrModel}</div>

                    <div className="col">
                      ₹ {Number(item.discount || 0).toLocaleString("en-IN")}
                    </div>

                    <div className="col">
                      ₹ {Number(item.sellingPrice || 0).toLocaleString("en-IN")}
                    </div>

                    <div className="col">
                      {item.billingDateTimeIST || item.billingDate}
                    </div>
                  </div>
                ))}
            </div>

            {/* ✅ PAGINATION */}
            <div className="transactions-footer">
              <div className="rows-control" ref={ddRef}>
                <button
                  className="rows-toggle"
                  onClick={handleToggle}
                  aria-expanded={dropdownOpen}
                >
                  Rows per page: <span className="rows-value">{rowsPerPage}</span>{" "}
                  <span className="rows-arrow">▲</span>
                </button>

                {dropdownOpen && (
                  <div className="rows-dropdown" role="menu">
                    <button className="rows-option" onClick={() => handleSelect(5)}>
                      5
                    </button>
                    <button className="rows-option" onClick={() => handleSelect(10)}>
                      10
                    </button>
                    <button className="rows-option" onClick={() => handleSelect(25)}>
                      25
                    </button>
                  </div>
                )}
              </div>

              <div className="rows-info">
                {startIndex}–{endIndex} of {total}
              </div>

              <div className="rows-nav">
                <button className="rows-nav-btn" onClick={goPrev} disabled={!canPrev}>
                  ‹
                </button>
                <button className="rows-nav-btn" onClick={goNext} disabled={!canNext}>
                  ›
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
