// src/components/BrandPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import brandModels from "../assets/db/brandModels";
import "./BrandPage.css";

// create URL-friendly slug from brand/model names
const toSlug = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

function BrandPage({ sidebarWidth = 64 }) {
  const { brandName } = useParams();
  const navigate = useNavigate();

  const [mobiles, setMobiles] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  if (!brandName) {
    return (
      <div
        className="brand-page-shell"
        style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
      >
        <div className="brand-page-container">
          <h1 className="brand-page-title">No brand selected</h1>
        </div>
      </div>
    );
  }

  // static definition of this brand (image + models list)
  const brand = brandModels.find(
    (b) => toSlug(b.name) === brandName.toLowerCase()
  );

  if (!brand) {
    return (
      <div
        className="brand-page-shell"
        style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
      >
        <div className="brand-page-container">
          <h1 className="brand-page-title">Brand not found</h1>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        // we only need this brand; ask backend to filter by brand as well
        const mkUrl = (status) =>
          `http://localhost:5000/api/mobiles?${new URLSearchParams({
            status,
            brand: brand.name,
          }).toString()}`;

        const [readyRes, tfbRes] = await Promise.all([
          fetch(mkUrl("ready")),
          fetch(mkUrl("tfb")),
        ]);

        if (!readyRes.ok || !tfbRes.ok) {
          throw new Error("Failed to load mobiles for stock");
        }

        const [ready, tfb] = await Promise.all([
          readyRes.json(),
          tfbRes.json(),
        ]);

        const list = [
          ...(Array.isArray(ready) ? ready : []),
          ...(Array.isArray(tfb) ? tfb : []),
        ];
        setMobiles(list);
      } catch (err) {
        console.error("Error fetching mobiles for BrandPage:", err);
        setMobiles([]);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [brand.name]);

  // map "Brand|Model|Variant" -> quantity in ready+tfb
  const variantStockMap = useMemo(() => {
    const map = new Map();

    mobiles.forEach((m) => {
      const b = String(m.brand || "").trim();
      const model = String(m.model || "").trim();
      const variant = String(m.variant || "").trim();
      if (!b || !model || !variant) return;

      const key = `${b}|${model}|${variant}`;
      map.set(key, (map.get(key) || 0) + 1);
    });

    return map;
  }, [mobiles]);

  // for each model, how many of its variants have stock > 0?
  const variantsInStockByModel = useMemo(() => {
    const result = {};

    brand.models.forEach((model) => {
      const availableCount = (model.variants || []).reduce((count, v) => {
        const variantName = v.variant || v; // v can be object or string
        const key = `${brand.name}|${model.name}|${variantName}`;
        const stock = variantStockMap.get(key) || 0;
        return stock > 0 ? count + 1 : count;
      }, 0);

      result[model.name] = availableCount;
    });

    return result;
  }, [brand, variantStockMap]);

  const handleModelClick = (modelName) => {
    navigate(`/brands/${toSlug(brand.name)}/${toSlug(modelName)}`);
  };

  return (
    <div
      className="brand-page-shell"
      style={{ ["--sidebar-w"]: `${sidebarWidth}px` }}
    >
      <div className="brand-page-container">
        <h1 className="brand-page-title">{brand.name} Models</h1>

        <div className="brand-models-grid">
          {brand.models.map((model) => {
            const count = variantsInStockByModel[model.name] ?? 0;
            const label = count === 1 ? "variant" : "variants";

            return (
              <article
                key={model.name}
                className="brand-model-card"
                onClick={() => handleModelClick(model.name)}
              >
                <div className="brand-model-image-wrap">
                  <img src={model.imageUrl} alt={model.name} />
                </div>
                <h2 className="brand-model-name">{model.name}</h2>
                <p className="brand-model-variants-count">
                  {loadingStock ? "…" : `${count} ${label}`}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BrandPage;
