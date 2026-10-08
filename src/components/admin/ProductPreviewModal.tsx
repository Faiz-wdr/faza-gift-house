import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import "./ProductPreviewModal.css";

// Interface matches our AdminProduct structure
export interface AdminProduct {
  id: string;
  title: string;
  image: string;
  enableSizes: boolean;
  sizes: {
    large: { enabled: boolean; width: string; height: string };
    medium: { enabled: boolean; width: string; height: string };
    small: { enabled: boolean; width: string; height: string };
  };
  enableMaterials: boolean;
  materials: {
    wood: boolean;
    acrylic: boolean;
    glass: boolean;
  };
  pricingMatrix: {
    [sizeName: string]: {
      [materialName: string]: string;
    };
  };
  sizePrices: {
    small: string;
    medium: string;
    large: string;
  };
  materialPrices: {
    wood: string;
    acrylic: string;
    glass: string;
  };
  basePrice: string;
  featured: boolean;
}

interface ProductPreviewModalProps {
  product: AdminProduct;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductPreviewModal({ product, isOpen, onClose }: ProductPreviewModalProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<"wood" | "acrylic" | "glass" | "">("");

  const sizeKeys = ["small", "medium", "large"] as const;
  const enabledSizes = sizeKeys.filter((k) => !product.enableSizes || product.sizes?.[k]?.enabled);

  const materialKeys = ["wood", "acrylic", "glass"] as const;
  const enabledMaterials = materialKeys.filter((m) => product.enableMaterials && product.materials?.[m]);

  // Reset selected material on open
  useEffect(() => {
    if (isOpen) {
      if (product.enableMaterials && enabledMaterials.length > 0) {
        setSelectedMaterial(enabledMaterials[0]);
      } else {
        setSelectedMaterial("");
      }
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  // Calculate price for a size
  const getSizePrice = (sizeKey: "small" | "medium" | "large"): string => {
    if (product.enableSizes && product.enableMaterials) {
      const mat = selectedMaterial || enabledMaterials[0] || "wood";
      const val = product.pricingMatrix?.[sizeKey]?.[mat];
      return val ? `₹${parseFloat(val).toLocaleString("en-IN")}` : "—";
    }
    if (product.enableSizes) {
      const val = product.sizePrices?.[sizeKey];
      return val ? `₹${parseFloat(val).toLocaleString("en-IN")}` : "—";
    }
    return product.basePrice ? `₹${parseFloat(product.basePrice).toLocaleString("en-IN")}` : "—";
  };

  const matLabels: Record<string, string> = { wood: "Multi-Wood", acrylic: "Acrylic", glass: "Glass" };
  const sizeNames: Record<string, string> = { small: "Small", medium: "Medium", large: "Large" };

  return (
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div className="preview-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-modal-header">
          <div className="preview-header-title-wrap">
            <h3>Product Preview</h3>
            <span className="preview-id-badge">{product.id || "N/A"}</span>
          </div>
          <button className="preview-close-btn" onClick={onClose} aria-label="Close Preview">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="preview-modal-body">
          {/* Left: Product Image */}
          <div className="preview-image-section">
            <div className="preview-image-wrap">
              <img src={product.image || "/placeholder.png"} alt={product.title} />
              {product.featured && (
                <span className="product-thumb-star preview-star-badge" title="Featured Product">
                  <Star size={12} fill="currentColor" />
                </span>
              )}
            </div>
          </div>

          {/* Right: Product Details & Prices of Each Size */}
          <div className="preview-details-section">
            <div className="preview-info-header">
              <h2 className="preview-title">{product.title || "Unnamed Product"}</h2>
            </div>

            {/* Material Selector (if materials are enabled) */}
            {product.enableMaterials && enabledMaterials.length > 0 && (
              <div className="preview-option-group">
                <span className="option-label">Material</span>
                <div className="preview-chips-container">
                  {enabledMaterials.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`preview-chip ${selectedMaterial === key ? "active" : ""}`}
                      onClick={() => setSelectedMaterial(key)}
                    >
                      {matLabels[key]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prices of Each Size */}
            {product.enableSizes && enabledSizes.length > 0 ? (
              <div className="preview-option-group">
                <div className="option-label-row">
                  <span className="option-label">Prices by Size</span>
                  {product.enableMaterials && selectedMaterial && (
                    <span className="option-sublabel">({matLabels[selectedMaterial]})</span>
                  )}
                </div>
                <div className="preview-sizes-list">
                  {enabledSizes.map((key) => {
                    const sizeObj = product.sizes?.[key];
                    const price = getSizePrice(key);
                    return (
                      <div key={key} className="preview-size-row">
                        <div className="preview-size-details">
                          <span className="preview-size-tag">{key.charAt(0).toUpperCase()}</span>
                          <div className="preview-size-text">
                            <span className="preview-size-name">{sizeNames[key]}</span>
                            {sizeObj && (
                              <span className="preview-size-dimensions">
                                {sizeObj.width} × {sizeObj.height} cm
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="preview-size-price-val">{price}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : product.enableMaterials && enabledMaterials.length > 0 ? (
              /* Single size with materials */
              <div className="preview-option-group">
                <span className="option-label">Material Pricing</span>
                <div className="preview-sizes-list">
                  {enabledMaterials.map((key) => {
                    const price = product.materialPrices?.[key];
                    return (
                      <div key={key} className="preview-size-row">
                        <span className="preview-size-name">{matLabels[key]}</span>
                        <div className="preview-size-price-val">
                          {price ? `₹${parseFloat(price).toLocaleString("en-IN")}` : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Base Price */
              <div className="preview-option-group">
                <span className="option-label">Standard Price</span>
                <div className="preview-sizes-list">
                  <div className="preview-size-row">
                    <span className="preview-size-name">Base Price</span>
                    <div className="preview-size-price-val">
                      ₹{product.basePrice ? parseFloat(product.basePrice).toLocaleString("en-IN") : "0"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
