// src/components/Mobiles.jsx
import React, { useEffect, useState, useContext } from "react";
import "./Mobiles.css";
import { useNavigate } from "react-router-dom";
import brands from "../assets/db/brands";
import { StockContext } from "./StockContext";

function Mobiles({ sidebarWidth = 64 }) {
  const navigate = useNavigate();
  const { refreshMobileStock } = useContext(StockContext);

  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchByStatus = async (status) => {
      const res = await fetch(
        `http://localhost:5000/api/mobiles?status=${status}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch mobiles with status=${status}`);
      }
      return res.json();
    };

    const loadStock = async () => {
      setLoading(true);
      try {
        // count both ready + tfb as "available"
        const [ready, tfb] = await Promise.all([
          fetchByStatus("ready"),
          fetchByStatus("tfb"),
        ]);

        const allInStock = [
          ...(Array.isArray(ready) ? ready : []),
          ...(Array.isArray(tfb) ? tfb : []),
        ];

        const map = {};
        allInStock.forEach((m) => {
          const brand = (m.brand || "").trim();
          if (!brand) return;
          map[brand] = (map[brand] || 0) + 1;
        });

        setStockMap(map);

        // update Home "Total Mobiles" card
        await refreshMobileStock();
      } catch (err) {
        console.error("Error loading mobile stock:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [refreshMobileStock]);

  const handleBrandClick = (brandName) => {
    // URL slug is lowercase brand name, consistent with BrandPage
    navigate(`/brands/${encodeURIComponent(brandName.toLowerCase())}`);
  };

  return (
    <div
      className="mobile-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <header className="mobile-header">
        <h1 className="mobile-title">All Brands</h1>
      </header>

      <main className="mobile-body">
        <div className="brands-grid">
          {brands.map((b) => {
            const stock = stockMap[b.name] || 0;

            return (
              <article
                key={b.name}
                className="brand-card brand-card-clickable"
                onClick={() => handleBrandClick(b.name)}
              >
                <div className="brand-card-logo-wrap">
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    className="brand-card-logo"
                  />
                </div>

                <div className="brand-card-name">{b.name}</div>

                <div className="brand-card-footer">
                  <span className="brand-card-stock-label">Stock:</span>
                  <span className="brand-card-stock-value">
                    {loading ? "…" : stock}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Mobiles;
