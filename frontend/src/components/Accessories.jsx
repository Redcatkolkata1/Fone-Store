// src/components/Accessories.jsx
import React, { useContext, useEffect, useState } from "react";
import "./Accessories.css";
import accessoryTypes from "../assets/db/accessories";
import { StockContext } from "./StockContext";
import { useNavigate } from "react-router-dom";   // ⬅️ add this

function Accessories({ sidebarWidth = 64 }) {
  const { refreshAccessoryStock } = useContext(StockContext);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();                // ⬅️ create navigate

  useEffect(() => {
    const fetchByStatus = async (status) => {
      const res = await fetch(
        `http://localhost:5000/api/accessories?status=${status}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch accessories with status=${status}`);
      }
      return res.json();
    };

    const loadStock = async () => {
      setLoading(true);
      try {
        const [ready, tfb] = await Promise.all([
          fetchByStatus("ready"),
          fetchByStatus("tfb"),
        ]);

        const allInStock = [
          ...(Array.isArray(ready) ? ready : []),
          ...(Array.isArray(tfb) ? tfb : []),
        ];

        const map = {};
        allInStock.forEach((a) => {
          const name = (a.accessory || "").trim();
          if (!name) return;
          map[name] = (map[name] || 0) + 1;
        });

        setStockMap(map);
        await refreshAccessoryStock();
      } catch (err) {
        console.error("Error loading accessory stock:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [refreshAccessoryStock]);

  // ⬇️ when a card is clicked, go to /accessories/<slug>
  const handleCardClick = (name) => {
    const slug = encodeURIComponent(name.toLowerCase());
    navigate(`/accessories/${slug}`);
  };

  return (
    <div
      className="acc-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <header className="acc-header">
        <h1 className="acc-title">All Accessories</h1>
      </header>

      <main className="acc-body">
        <div className="acc-grid">
          {accessoryTypes.map((a) => {
            const stock = stockMap[a.name] || 0;
            return (
              <article
                key={a.name}
                className="acc-card"
                onClick={() => handleCardClick(a.name)}   // ⬅️ click handler
              >
                <div className="acc-card-name">{a.name}</div>
                <div className="acc-card-footer">
                  <span className="acc-card-stock-label">Stock:</span>
                  <span className="acc-card-stock-value">
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

export default Accessories;
