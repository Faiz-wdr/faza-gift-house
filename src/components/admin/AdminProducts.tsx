import { useState } from "react";
import { Plus, Eye, Edit2, Trash2, Upload, Download, Loader2, LayoutGrid, List } from "lucide-react";
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

// Sub-component for individual product card (5 per row in card view)
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
          <h4 className="admin-card-title" title={product.title}>{product.title || "Unnamed Product"}</h4>
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
                    type="button"
                    className={`size-chip ${selectedSize === key ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(key);
                    }}
                    title={`${labelPrefix}: ${sObj.width} × ${sObj.height} CM`}
                  >
                    {labelPrefix}: {sObj.width}×{sObj.height}
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
              <span className="price-pill-label">Wood:</span>
              <strong className="price-pill-val">₹{getAdminCardPrice("wood") || "—"}</strong>
            </div>
          )}
          {(!product.enableMaterials || product.materials.acrylic) && (
            <div className="price-pill">
              <span className="price-pill-label">Acrylic:</span>
              <strong className="price-pill-val">₹{getAdminCardPrice("acrylic") || "—"}</strong>
            </div>
          )}
          {(!product.enableMaterials || product.materials.glass) && (
            <div className="price-pill">
              <span className="price-pill-label">Glass:</span>
              <strong className="price-pill-val">₹{getAdminCardPrice("glass") || "—"}</strong>
            </div>
          )}
        </div>

        {/* Action Buttons row */}
        <div className="admin-card-actions">
          <button
            type="button"
            className="btn-action-icon preview-btn"
            onClick={() => onPreviewClick(product)}
            title="Quick Storefront Preview"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className="btn-action-icon edit-btn"
            onClick={() => onEditClick(product)}
            title="Edit Listing Details"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn-action-icon delete-btn"
            onClick={() => onDeleteClick(product.id)}
            title="Delete Product Listing"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Sub-component for individual product table row (List View)
function AdminProductListRow({
  product,
  onPreviewClick,
  onEditClick,
  onDeleteClick,
}: {
  product: AdminProduct;
  onPreviewClick: (product: AdminProduct) => void;
  onEditClick: (product: AdminProduct) => void;
  onDeleteClick: (id: string) => void;
}) {
  const startingPrice = getStartingPrice(product);
  const sizeKeys = ["small", "medium", "large"] as const;
  const enabledSizes = sizeKeys.filter((k) => !product.enableSizes || product.sizes[k].enabled);

  return (
    <tr className="products-list-row">
      {/* Product Image & Info */}
      <td className="col-product-main">
        <div className="list-product-cell">
          <img
            src={product.image || "/placeholder.png"}
            alt={product.title}
            className="list-product-thumb"
          />
          <div className="list-product-info">
            <span className="list-product-title" title={product.title}>
              {product.title || "Unnamed Product"}
            </span>
            <div className="list-product-meta">
              <span className="list-product-id">{product.id}</span>
              {product.featured && <span className="list-badge-featured">Featured</span>}
            </div>
          </div>
        </div>
      </td>

      {/* Starting Price */}
      <td className="col-price">
        <div className="list-price-container">
          <span className="list-price-val">
            ₹{startingPrice > 0 ? startingPrice.toLocaleString("en-IN") : product.basePrice || "0"}
          </span>
          <span className="list-price-label">Starting</span>
        </div>
      </td>

      {/* Sizes */}
      <td className="col-sizes">
        {product.enableSizes && enabledSizes.length > 0 ? (
          <div className="list-pill-group">
            {enabledSizes.map((key) => {
              const s = product.sizes[key];
              const prefix = key === "small" ? "S" : key === "medium" ? "M" : "L";
              return (
                <span key={key} className="list-spec-pill" title={`${prefix}: ${s.width} × ${s.height} CM`}>
                  {prefix} ({s.width}×{s.height})
                </span>
              );
            })}
          </div>
        ) : (
          <span className="list-spec-pill muted">Single Size</span>
        )}
      </td>

      {/* Materials */}
      <td className="col-materials">
        {product.enableMaterials ? (
          <div className="list-pill-group">
            {product.materials.wood && <span className="list-spec-pill material-wood">Wood</span>}
            {product.materials.acrylic && <span className="list-spec-pill material-acrylic">Acrylic</span>}
            {product.materials.glass && <span className="list-spec-pill material-glass">Glass</span>}
          </div>
        ) : (
          <span className="list-spec-pill muted">Standard</span>
        )}
      </td>

      {/* Actions */}
      <td className="col-actions">
        <div className="list-actions-group">
          <button
            type="button"
            className="btn-action-icon preview-btn"
            onClick={() => onPreviewClick(product)}
            title="Quick Preview"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          <button
            type="button"
            className="btn-action-icon edit-btn"
            onClick={() => onEditClick(product)}
            title="Edit Details"
          >
            <Edit2 size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn-action-icon delete-btn"
            onClick={() => onDeleteClick(product.id)}
            title="Delete Listing"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
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
  const [viewMode, setViewMode] = useState<"card" | "list">(() => {
    try {
      const saved = localStorage.getItem("faza_admin_products_view");
      return saved === "list" ? "list" : "card";
    } catch {
      return "card";
    }
  });

  const handleViewModeChange = (mode: "card" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("faza_admin_products_view", mode);
    } catch {}
  };

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
        staggerChildren: 0.04,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" as const },
    },
  };

  return (
    <div className="admin-products-container">
      {/* Uniform Section Header with View Toggle */}
      <motion.div
        className="admin-section-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="section-header-info">
          <div className="products-title-wrapper">
            <h2 className="section-header-title">Products</h2>
            <span className="products-count-badge">{products.length} Items</span>
          </div>
        </div>

        <div className="section-header-actions products-actions-group">
          {/* Card / List View Switcher */}
          <div className="view-mode-toggle" role="group" aria-label="Product layout views">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "card" ? "active" : ""}`}
              onClick={() => handleViewModeChange("card")}
              title="Card View (5 per row)"
              aria-label="Card View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => handleViewModeChange("list")}
              title="List View"
              aria-label="List View"
            >
              <List size={15} />
              <span>List</span>
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            className="btn btn-secondary btn-csv-export"
            onClick={() => exportToCSV(products)}
            title="Export products list as CSV"
            disabled={uploadingCSV}
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          {/* CSV Import Button */}
          <label className={`btn btn-secondary btn-csv-import ${uploadingCSV ? "disabled" : ""}`} title="Upload products via CSV">
            {uploadingCSV ? <Loader2 size={15} className="spinner-icon" /> : <Upload size={15} />}
            <span>{uploadingCSV ? "Importing..." : "Import"}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              style={{ display: "none" }}
              disabled={uploadingCSV}
            />
          </label>

          {/* Desktop Add Product Button (hidden on mobile, replaced by floating FAB) */}
          <button
            type="button"
            className="btn btn-green btn-add-product desktop-add-btn"
            onClick={onAddClick}
            id="admin-add-product-btn"
            disabled={uploadingCSV}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </motion.div>

      {/* VIEW 1: CARD VIEW (5 products in one row on desktop) */}
      {viewMode === "card" ? (
        <motion.div
          className="products-admin-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key="card-view"
        >
          {products.length === 0 ? (
            <div className="products-empty-state">
              <p>No products found. Click "Add Product" to create your first listing.</p>
            </div>
          ) : (
            products.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                onPreviewClick={onPreviewClick}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                cardVariants={cardVariants}
              />
            ))
          )}
        </motion.div>
      ) : (
        /* VIEW 2: LIST VIEW (Clean structured table) */
        <motion.div
          className="products-table-wrapper"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key="list-view"
        >
          {products.length === 0 ? (
            <div className="products-empty-state">
              <p>No products found. Click "Add Product" to create your first listing.</p>
            </div>
          ) : (
            <table className="products-list-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Starting Price</th>
                  <th>Sizes</th>
                  <th>Materials</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <AdminProductListRow
                    key={product.id}
                    product={product}
                    onPreviewClick={onPreviewClick}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {/* Mobile Floating Action Button */}
      <button
        type="button"
        className="admin-fab-btn admin-fab-primary"
        onClick={onAddClick}
        disabled={uploadingCSV}
        aria-label="Add Product"
      >
        <Plus size={18} strokeWidth={2.4} />
        <span>Add Product</span>
      </button>
    </div>
  );
}
