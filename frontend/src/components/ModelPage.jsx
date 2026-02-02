// src/components/ModelPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import brandModels from "../assets/db/brandModels";
import "./ModelPage.css";

const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function ModelPage({ sidebarWidth = 64 }) {
  const { brandName, modelName } = useParams();
  const [stockByVariant, setStockByVariant] = useState({});

  const brand = brandModels.find(
    (b) => slugify(b.name) === brandName.toLowerCase()
  );

  const model = brand
    ? brand.models.find((m) => slugify(m.name) === modelName.toLowerCase())
    : null;

  useEffect(() => {
    if (!brand || !model) {
      setStockByVariant({});
      return;
    }

    const fetchStock = async () => {
      try {
        const mkParams = (status) =>
          new URLSearchParams({
            status,
            brand: brand.name,
            model: model.name,
          }).toString();

        const [readyRes, tfbRes] = await Promise.all([
          fetch(`http://localhost:5000/api/mobiles?${mkParams("ready")}`),
          fetch(`http://localhost:5000/api/mobiles?${mkParams("tfb")}`),
        ]);

        if (!readyRes.ok || !tfbRes.ok) {
          throw new Error("Failed to fetch stock");
        }

        const [ready, tfb] = await Promise.all([
          readyRes.json(),
          tfbRes.json(),
        ]);

        const all = [
          ...(Array.isArray(ready) ? ready : []),
          ...(Array.isArray(tfb) ? tfb : []),
        ];

        const counts = {};
        for (const mob of all) {
          const key = mob.variant || "UNSPECIFIED";
          counts[key] = (counts[key] || 0) + 1;
        }

        setStockByVariant(counts);
      } catch (err) {
        console.error("Error loading stock for model page:", err);
        setStockByVariant({});
      }
    };

    fetchStock();
  }, [brand, model]);

  if (!brand) {
    return (
      <div
        className="model-page-shell"
        style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
      >
        <main className="model-page-body">
          <div className="model-page-container">
            <h1 className="model-title">Brand not found</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!model) {
    return (
      <div
        className="model-page-shell"
        style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
      >
        <main className="model-page-body">
          <div className="model-page-container">
            <h1 className="model-title">Model not found</h1>
            <Link className="model-back-link" to={`/brands/${brandName}`}>
              ← Back to {brand.name} models
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="model-page-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <main className="model-page-body">
        <div className="model-page-container">
          <header className="model-header">
            <h1 className="model-title">{model.name} Variants</h1>
            <p className="model-subtitle">{brand.name}</p>
            <Link className="model-back-link" to={`/brands/${brandName}`}>
              ← Back to {brand.name} models
            </Link>
          </header>

          <section className="model-main">
            <div className="model-image-wrap">
              <img
                src={model.imageUrl}
                alt={model.name}
                className="model-image"
              />
            </div>

            <div className="model-variants-wrap">
              <h2 className="model-variants-title">Available variants</h2>

              <div className="model-variants-list">
                {model.variants.map((v, idx) => (
                  <div key={idx} className="variant-pill">
                    <span className="variant-name">{v.variant}</span>
                    <span className="variant-stock">
                      Stock: {stockByVariant[v.variant] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ModelPage;
