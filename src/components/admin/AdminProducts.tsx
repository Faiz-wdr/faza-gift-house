import { useState } from "react";
import { Plus, Eye, Edit2, Trash2, Upload, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AdminProduct } from "./ProductPreviewModal";
import { exportToCSV, parseCSV } from "../../utils/csvHelper";
import "./AdminProducts.css";

interface AdminProductsProps {
  products: AdminProduct[];
  onAddClick: () => void;
  onEditClick: (product: AdminProduct) => void;
  onPreviewClick: (product: AdminProduct) => void;
  onDeleteClick: (id: string) => void;
  onBulkUpload: (products: AdminProduct[]) => Promise<void>;
}

// Utility to calculate starting price (fallback display/preview)
export const getStartingPrice = (product: AdminProduct): number => {
  const prices: number[] = [];

  if (product.enableSizes && product.enableMaterials) {
    const sizeKeys = ["small", "medium", "large"] as const;
    const matKeys = ["wood", "acrylic", "glass"] as const;
    sizeKeys.forEach((sKey) => {
      if (product.sizes[sKey].enabled) {
        matKeys.forEach((mKey) => {
          if (product.materials[mKey]) {
            const price = parseFloat(product.pricingMatrix[sKey]?.[mKey] || "");
            if (!isNaN(price)) prices.push(price);
          }
        });
      }
    });
  } else if (product.enableSizes) {
    const sizeKeys = ["small", "medium", "large"] as const;
    sizeKeys.forEach((sKey) => {
      if (product.sizes[sKey].enabled) {
        const price = parseFloat(product.sizePrices[sKey] || "");
        if (!isNaN(price)) prices.push(price);
      }
    });
  } else if (product.enableMaterials) {
    const matKeys = ["wood", "acrylic", "glass"] as const;
    matKeys.forEach((mKey) => {
      if (product.materials[mKey]) {
        const price = parseFloat(product.materialPrices[mKey] || "");
        if (!isNaN(price)) prices.push(price);
      }
    });
  } else {
    const price = parseFloat(product.basePrice || "");
    if (!isNaN(price)) prices.push(price);
  }

  if (prices.length === 0) return 0;
  return Math.min(...prices);
};

// Sub-component for individual product card logic
function AdminProductCard({
  product,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
  cardVariants,
}: {
  product: AdminProduct;
  onPreviewClick: (product: AdminProduct) => void;
  onEditClick: (product: AdminProduct) => void;
  onDeleteClick: (id: string) => void;
  cardVariants: any;
}) {
  const sizeKeys = ["small", "medium", "large"] as const;
  const enabledSizeKeys = sizeKeys.filter((k) => !product.enableSizes || product.sizes[k].enabled);
  
  // Default to first enabled size
  const defaultSize = product.enableSizes
    ? enabledSizeKeys[0] || "small"
    : "small";

  const [selectedSize, setSelectedSize] = useState<"small" | "medium" | "large">(defaultSize);

  const getAdminCardPrice = (material: "wood" | "acrylic" | "glass") => {
    if (product.enableSizes && product.enableMaterials) {
      return product.pricingMatrix[selectedSize]?.[material];
    } else if (product.enableSizes) {
      return product.sizePrices[selectedSize];
    } else if (product.enableMaterials) {
      return product.materialPrices[material];
    } else {
      return product.basePrice;
    }
  };

  return (
    <motion.div 
      className="admin-product-card"
      variants={cardVariants}
    >
      {/* Product Image */}
      <div className="admin-card-image-box">
        <img src={product.image || "/placeholder.png"} alt={product.title} />
        {product.featured && <span className="featured-card-badge">Featured</span>}
      </div>

      {/* Card details */}
      <div className="admin-card-details">
        <div className="admin-card-header-row">
          <h4 className="admin-card-title">{product.title || "Unnamed Product"}</h4>
          <span className="admin-card-id">{product.id}</span>
        </div>

        {/* Sizes Selection Chips */}
        {product.enableSizes && enabledSizeKeys.length > 0 && (
          <div className="product-sizes">
            <div className="size-chips">
              {enabledSizeKeys.map((key) => {
                const sObj = product.sizes[key];
                const labelPrefix = key === "small" ? "S" : key === "medium" ? "M" : "L";
                return (
                  <button
                    key={key}
                    className={`size-chip ${selectedSize === key ? "active" : ""}`}
                    onClick={() => setSelectedSize(key)}
                  >
                    {labelPrefix}: {sObj.width} × {sObj.height} CM
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing Matrix Pills */}
        <div className="pricing-grid">
          {(!product.enableMaterials || product.materials.wood) && (
            <div className="price-pill">
              <span>Multi-Wood ₹ {getAdminCardPrice("wood") || "—"}</span>
            </div>
          )}
          {(!product.enableMaterials || product.materials.acrylic) && (
            <div className="price-pill">
              <span>Acrylic ₹ {getAdminCardPrice("acrylic") || "—"}</span>
            </div>
          )}
          {(!product.enableMaterials || product.materials.glass) && (
            <div className="price-pill">
              <span>Glass ₹ {getAdminCardPrice("glass") || "—"}</span>
            </div>
          )}
        </div>

        {/* Action Buttons row */}
        <div className="admin-card-actions">
          <button 
            className="btn-action-icon preview-btn" 
            onClick={() => onPreviewClick(product)}
            title="Quick Storefront Preview"
          >
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button 
            className="btn-action-icon edit-btn" 
            onClick={() => onEditClick(product)}
            title="Edit Listing Details"
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
          <button 
            className="btn-action-icon delete-btn" 
            onClick={() => onDeleteClick(product.id)}
            title="Delete Product Listing"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>

      </div>
    </motion.div>
  );
}

export default function AdminProducts({
  products,
  onAddClick,
  onEditClick,
  onPreviewClick,
  onDeleteClick,
  onBulkUpload,
}: AdminProductsProps) {
  const [uploadingCSV, setUploadingCSV] = useState(false);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingCSV(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          alert("Could not read file contents.");
          return;
        }
        
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          alert("No valid products found in CSV. Please verify column headers.");
          return;
        }
        
        const confirmMsg = `Are you sure you want to upload ${parsed.length} products? This will update matching IDs and create new entries.`;
        if (window.confirm(confirmMsg)) {
          await onBulkUpload(parsed);
          alert(`Successfully uploaded ${parsed.length} products!`);
        }
      } catch (err: any) {
        console.error("Bulk CSV import error:", err);
        alert(`Failed to import CSV: ${err.message || err}`);
      } finally {
        setUploadingCSV(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setUploadingCSV(false);
    };
    reader.readAsText(file);
  };

  // Stagger container animation properties
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.45, ease: "easeOut" as const } 
    },
  };

  return (
    <div className="admin-products-container">
      {/* Catalog Header Sub-row */}
      <motion.div 
        className="products-list-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="header-text">
          <h3>Catalog Management</h3>
          <p>Showing {products.length} catalog items</p>
        </div>
        
        <div className="products-actions-group">
          {/* CSV Export Button */}
          <button 
            className="btn btn-secondary btn-csv-export" 
            onClick={() => exportToCSV(products)}
            title="Export products list as CSV"
            disabled={uploadingCSV}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          
          {/* CSV Import Button */}
          <label className={`btn btn-secondary btn-csv-import ${uploadingCSV ? "disabled" : ""}`} title="Upload products via CSV">
            {uploadingCSV ? <Loader2 size={16} className="spinner-icon" /> : <Upload size={16} />}
            <span>{uploadingCSV ? "Importing..." : "Import CSV"}</span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileImport} 
              style={{ display: "none" }} 
              disabled={uploadingCSV}
            />
          </label>

          <button 
            className="btn btn-green btn-add-product" 
            onClick={onAddClick}
            id="admin-add-product-btn"
            disabled={uploadingCSV}
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </motion.div>

      {/* Grid container with Framer Motion Stagger */}
      <motion.div 
        className="products-admin-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {products.map((product) => (
          <AdminProductCard
            key={product.id}
            product={product}
            onPreviewClick={onPreviewClick}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            cardVariants={cardVariants}
          />
        ))}
      </motion.div>
    </div>
  );
}
