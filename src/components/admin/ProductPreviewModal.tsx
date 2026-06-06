import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
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
  const [selectedSize, setSelectedSize] = useState<"large" | "medium" | "small" | "">("");
  const [selectedMaterial, setSelectedMaterial] = useState<"wood" | "acrylic" | "glass" | "">("");
  const [priceDisplay, setPriceDisplay] = useState<string>("—");

  // Reset selected options on open
  useEffect(() => {
    if (isOpen) {
      // Find first enabled size
      const firstSize = (["large", "medium", "small"] as const).find(
        (key) => product.sizes[key].enabled
      );
      setSelectedSize(product.enableSizes ? firstSize || "" : "");

      // Find first enabled material
      const firstMat = (["wood", "acrylic", "glass"] as const).find(
        (key) => product.materials[key]
      );
      setSelectedMaterial(product.enableMaterials ? firstMat || "" : "");
    }
  }, [isOpen, product]);

  // Recalculate price dynamically when selection changes
  useEffect(() => {
    if (!isOpen) return;

    if (product.enableSizes && product.enableMaterials) {
      // Both sizes and materials enabled
      if (selectedSize && selectedMaterial) {
        const price = product.pricingMatrix[selectedSize]?.[selectedMaterial];
        setPriceDisplay(price ? `₹${price}` : "Unavailable");
      } else {
        setPriceDisplay("—");
      }
    } else if (product.enableSizes) {
      // Sizes only
      if (selectedSize) {
        const price = product.sizePrices[selectedSize];
        setPriceDisplay(price ? `₹${price}` : "Unavailable");
      } else {
        setPriceDisplay("—");
      }
    } else if (product.enableMaterials) {
      // Materials only
      if (selectedMaterial) {
        const price = product.materialPrices[selectedMaterial];
        setPriceDisplay(price ? `₹${price}` : "Unavailable");
      } else {
        setPriceDisplay("—");
      }
    } else {
      // Neither - base price
      setPriceDisplay(product.basePrice ? `₹${product.basePrice}` : "—");
    }
  }, [selectedSize, selectedMaterial, product, isOpen]);

  if (!isOpen) return null;

  const handleOrderClick = () => {
    let orderText = `Hello Faza Gift House, I would like to get a quote/order for:
Product: *${product.title}* (ID: ${product.id})`;

    if (product.enableSizes && selectedSize) {
      const sizeObj = product.sizes[selectedSize];
      orderText += `\nSize: *${selectedSize.toUpperCase()}* (${sizeObj.width} x ${sizeObj.height} CM)`;
    }
    if (product.enableMaterials && selectedMaterial) {
      orderText += `\nMaterial: *${selectedMaterial.toUpperCase()}*`;
    }
    orderText += `\nPrice: *${priceDisplay}*`;

    window.open(`https://wa.me/919188086244?text=${encodeURIComponent(orderText)}`, "_blank");
  };

  return (
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div className="preview-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-modal-header">
          <h3>Quick View Storefront</h3>
          <button className="preview-close-btn" onClick={onClose} aria-label="Close Preview">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="preview-modal-body">
          {/* Left: Product Image */}
          <div className="preview-image-section">
            <img src={product.image || "/placeholder.png"} alt={product.title} />
          </div>

          {/* Right: Product Details & Options */}
          <div className="preview-details-section">
            <div className="preview-info-header">
              <h2 className="preview-title">{product.title || "Unnamed Product"}</h2>
              <span className="preview-id-badge">ID: {product.id || "N/A"}</span>
            </div>

            {/* Size Selector */}
            {product.enableSizes && (
              <div className="preview-option-group">
                <span className="option-label">Select Size</span>
                <div className="preview-chips-container">
                  {(["small", "medium", "large"] as const).map((key) => {
                    const sizeObj = product.sizes[key];
                    if (!sizeObj.enabled) return null;
                    return (
                      <button
                        key={key}
                        className={`preview-chip ${selectedSize === key ? "active" : ""}`}
                        onClick={() => setSelectedSize(key)}
                      >
                        <span className="size-name">{key}</span>
                        <span className="size-dims">{sizeObj.width} × {sizeObj.height} cm</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material Selector */}
            {product.enableMaterials && (
              <div className="preview-option-group">
                <span className="option-label">Select Material</span>
                <div className="preview-chips-container">
                  {(["wood", "acrylic", "glass"] as const).map((key) => {
                    if (!product.materials[key]) return null;
                    const matLabels = { wood: "Multi-Wood", acrylic: "Acrylic", glass: "Glass" };
                    return (
                      <button
                        key={key}
                        className={`preview-chip ${selectedMaterial === key ? "active" : ""}`}
                        onClick={() => setSelectedMaterial(key)}
                      >
                        {matLabels[key]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Price Display */}
            <div className="preview-price-summary">
              <div className="price-label-row">
                <span>Calculated Price</span>
              </div>
              <div className="price-value-large">{priceDisplay}</div>
            </div>

            {/* Action Order Button */}
            <button className="btn btn-whatsapp w-100 preview-order-btn" onClick={handleOrderClick}>
              <MessageCircle size={18} />
              <span>Inquire on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
