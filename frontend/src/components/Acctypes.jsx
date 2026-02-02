// src/components/Acctypes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import acctypes from "../assets/db/acctypes";
import "./Acctypes.css";

const normalize = (value) => String(value || "").trim().toLowerCase();

function Acctypes({ sidebarWidth = 64 }) {
  const { accessoryId } = useParams();
  const navigate = useNavigate();

  // Decode and normalize the slug from the URL
  const slugFromUrl = normalize(decodeURIComponent(accessoryId || ""));

  // Match against static acctypes list, supporting both
  // "data cable" -> "data cable"   and
  // "data cable" -> "data-cable"
  const selected = acctypes.find((item) => {
    const nameNorm = normalize(item.name);
    const nameHyphen = nameNorm.replace(/\s+/g, "-");
    return slugFromUrl === nameNorm || slugFromUrl === nameHyphen;
  });

  // Live stock from backend (ready + tfb)
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchByStatus = async (status) => {
      const res = await fetch(
        `http://localhost:5000/api/accessories?status=${status}`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch accessories with status=${status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    };

    const load = async () => {
      setLoading(true);
      try {
        // Count both ready and tfb as "in stock"
        const [ready, tfb] = await Promise.all([
          fetchByStatus("ready"),
          fetchByStatus("tfb"),
        ]);

        setAccessories([...ready, ...tfb]);
      } catch (err) {
        console.error("Error fetching accessories:", err);
        setAccessories([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Build stock map: "<accessory>|<type>" -> qty
  const stockMap = useMemo(() => {
    const map = {};

    accessories.forEach((item) => {
      const accName = normalize(item.accessory);
      const accType = normalize(item.accessoryType);
      if (!accName || !accType) return;

      const key = `${accName}|${accType}`;
      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [accessories]);

  if (!selected) {
    return (
      <div
        className="acctypes-shell"
        style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
      >
        <div className="acctypes-container">
          <button className="back-btn" onClick={() => navigate("/accessories")}>
            Back
          </button>
          <h2>Accessory not found</h2>
        </div>
      </div>
    );
  }

  const selectedNameNorm = normalize(selected.name);

  return (
    <div
      className="acctypes-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <div className="acctypes-container">
        <button className="back-btn" onClick={() => navigate("/accessories")}>
          Back
        </button>

        <h1 className="title">{selected.name}</h1>
        <h3 className="subtitle">Available Types</h3>

        <section className="types-panel">
          {selected.types.map((t, index) => {
            const typeNorm = normalize(t.type);
            const key = `${selectedNameNorm}|${typeNorm}`;
            const stock = stockMap[key] || 0;

            return (
              <div key={index} className="type-row">
                <div className="type-row-label">{t.type}</div>

                <div className="type-row-stock">
                  <span className="type-row-stock-text">Stock:</span>
                  <span className="type-row-stock-value">
                    {loading ? "…" : stock}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default Acctypes;
