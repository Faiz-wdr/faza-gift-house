import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, AlertTriangle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import type { AdminProduct } from "./ProductPreviewModal";
import "./ProductFormModal.css";

interface ProductFormModalProps {
  product?: AdminProduct | null; // Null if adding new product
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: AdminProduct) => void;
  currentFeaturedCount: number;
}

export default function ProductFormModal({
  product,
  isOpen,
  onClose,
  onSave,
  currentFeaturedCount,
}: ProductFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const [image, setImage] = useState("");
  const [enableSizes, setEnableSizes] = useState(true);
  const [sizes, setSizes] = useState({
    small: { enabled: true, width: "13", height: "15" },
    medium: { enabled: false, width: "13", height: "17" },
    large: { enabled: true, width: "15", height: "17" },
  });
  const [enableMaterials, setEnableMaterials] = useState(true);
  const [materials, setMaterials] = useState({
    wood: true,
    acrylic: true,
    glass: true,
  });
  const [pricingMatrix, setPricingMatrix] = useState<{
    [sizeKey: string]: { [matKey: string]: string };
  }>({
    small: { wood: "22", acrylic: "50", glass: "55" },
    medium: { wood: "22", acrylic: "50", glass: "55" },
    large: { wood: "22", acrylic: "50", glass: "55" },
  });
  const [sizePrices, setSizePrices] = useState({
    small: "30",
    medium: "40",
    large: "50",
  });
  const [materialPrices, setMaterialPrices] = useState({
    wood: "22",
    acrylic: "50",
    glass: "55",
  });
  const [basePrice, setBasePrice] = useState("40");
  const [featured, setFeatured] = useState(false);

  // Drag & drop upload state
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load existing product details if editing
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setTitle(product.title);
        setProductId(product.id);
        setImage(product.image);
        setEnableSizes(product.enableSizes);
        setSizes({
          small: { ...product.sizes.small },
          medium: { ...product.sizes.medium },
          large: { ...product.sizes.large },
        });
        setEnableMaterials(product.enableMaterials);
        setMaterials({ ...product.materials });
        setPricingMatrix({
          small: { ...product.pricingMatrix.small },
          medium: { ...product.pricingMatrix.medium },
          large: { ...product.pricingMatrix.large },
        });
        setSizePrices({ ...product.sizePrices });
        setMaterialPrices({ ...product.materialPrices });
        setBasePrice(product.basePrice);
        setFeatured(product.featured);
      } else {
        // Reset to default settings for new product
        setTitle("");
        setProductId(`FD-${Math.floor(1000 + Math.random() * 9000)}`);
        setImage("");
        setEnableSizes(true);
        setSizes({
          small: { enabled: true, width: "13", height: "15" },
          medium: { enabled: false, width: "13", height: "17" },
          large: { enabled: true, width: "15", height: "17" },
        });
        setEnableMaterials(true);
        setMaterials({ wood: true, acrylic: true, glass: true });
        setPricingMatrix({
          small: { wood: "22", acrylic: "50", glass: "55" },
          medium: { wood: "22", acrylic: "50", glass: "55" },
          large: { wood: "22", acrylic: "50", glass: "55" },
        });
        setSizePrices({ small: "30", medium: "40", large: "50" });
        setMaterialPrices({ wood: "22", acrylic: "50", glass: "55" });
        setBasePrice("40");
        setFeatured(false);
      }
    }
  }, [isOpen, product]);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage("");
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // State size toggle helpers
  const handleSizeToggle = (sizeKey: "small" | "medium" | "large") => {
    setSizes((prev) => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        enabled: !prev[sizeKey].enabled,
      },
    }));
  };

  const handleSizeDimsChange = (
    sizeKey: "small" | "medium" | "large",
    field: "width" | "height",
    val: string
  ) => {
    setSizes((prev) => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        [field]: val,
      },
    }));
  };

  // Material toggle helper
  const handleMaterialToggle = (matKey: "wood" | "acrylic" | "glass") => {
    setMaterials((prev) => ({
      ...prev,
      [matKey]: !prev[matKey],
    }));
  };

  // Pricing Matrix Input helper
  const handleMatrixChange = (sizeKey: string, matKey: string, val: string) => {
    setPricingMatrix((prev) => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        [matKey]: val,
      },
    }));
  };

  // Validate form and save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!productId.trim()) {
      alert("Product ID is required.");
      return;
    }

    // Enabled sizes validation
    if (enableSizes) {
      const activeSizes = Object.values(sizes).filter((s) => s.enabled);
      if (activeSizes.length === 0) {
        alert("Please enable at least one size, or disable sizes altogether.");
        return;
      }
      for (const [key, sObj] of Object.entries(sizes)) {
        if (sObj.enabled && (!sObj.width || !sObj.height)) {
          alert(`Please fill dimensions for the enabled ${key} size.`);
          return;
        }
      }
    }

    // Enabled materials validation
    if (enableMaterials) {
      const activeMats = Object.values(materials).filter(Boolean);
      if (activeMats.length === 0) {
        alert("Please enable at least one material, or disable materials altogether.");
        return;
      }
    }

    setUploading(true);
    let finalImageUrl = image;

    try {
      if (imageFile) {
        const hasLocalSession = typeof window !== "undefined" && localStorage.getItem("faza_local_session");
        const isSupabaseUnconfigured = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key-here";

        if (hasLocalSession || isSupabaseUnconfigured) {
          // Convert imageFile to base64 for local storage persistence
          finalImageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
        } else {
          const { storageService } = await import("../../services/storageService");
          finalImageUrl = await storageService.uploadAsset(imageFile, "products");
        }
      }

      // Pack into AdminProduct object
      const finalProduct: AdminProduct = {
        id: productId,
        title,
        image: finalImageUrl,
        enableSizes,
        sizes,
        enableMaterials,
        materials,
        pricingMatrix,
        sizePrices,
        materialPrices,
        basePrice,
        featured,
      };

      onSave(finalProduct);
    } catch (err: any) {
      alert(`Asset upload or save operation failed: ${err.message || err}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Pricing matrix visibility logic
  const showMatrix = enableSizes && 
                     enableMaterials && 
                     Object.values(sizes).some((s) => s.enabled) && 
                     Object.values(materials).some((m) => m);

  // Dynamic lowest price calculation for preview
  const getCalculatedStartingPrice = (): string => {
    const prices: number[] = [];

    if (enableSizes && enableMaterials) {
      const sizeKeys = ["small", "medium", "large"] as const;
      const matKeys = ["wood", "acrylic", "glass"] as const;
      sizeKeys.forEach((sKey) => {
        if (sizes[sKey].enabled) {
          matKeys.forEach((mKey) => {
            if (materials[mKey]) {
              const p = parseFloat(pricingMatrix[sKey]?.[mKey] || "");
              if (!isNaN(p)) prices.push(p);
            }
          });
        }
      });
    } else if (enableSizes) {
      const sizeKeys = ["small", "medium", "large"] as const;
      sizeKeys.forEach((sKey) => {
        if (sizes[sKey].enabled) {
          const p = parseFloat(sizePrices[sKey] || "");
          if (!isNaN(p)) prices.push(p);
        }
      });
    } else if (enableMaterials) {
      const matKeys = ["wood", "acrylic", "glass"] as const;
      matKeys.forEach((mKey) => {
        if (materials[mKey]) {
          const p = parseFloat(materialPrices[mKey] || "");
          if (!isNaN(p)) prices.push(p);
        }
      });
    } else {
      const p = parseFloat(basePrice);
      if (!isNaN(p)) prices.push(p);
    }

    if (prices.length === 0) return "—";
    return `Starting from ₹${Math.min(...prices)}`;
  };

  // Limit check logic for homepage featured toggle
  const isFeatureLimitReached = !featured && currentFeaturedCount >= 6;

  if (!isOpen) return null;

  return (
    <div className="form-modal-backdrop">
      <motion.div 
        className="form-modal-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        
        {/* Header */}
        <div className="form-modal-header">
          <h2>{product ? "Edit Product Listing" : "Add New Product"}</h2>
          <button className="form-close-btn" onClick={onClose} aria-label="Close Form">
            <X size={22} />
          </button>
        </div>

        {/* Split Form Panel */}
        <div className="form-modal-body">
          
          {/* Left panel form fields */}
          <form onSubmit={handleSave} className="form-left-panel">
            <div className="form-scrollable-fields">
              {/* Tab Section: Basic Info */}
              <div className="form-section-block">
                <h3 className="section-block-title">Basic Information</h3>
                
                <div className="form-field">
                  <label htmlFor="form-product-name">Product Name</label>
                  <input
                    type="text"
                    id="form-product-name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Premium Wave Trophy"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="form-product-id">Product ID</label>
                  <input
                    type="text"
                    id="form-product-id"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="e.g. FD-1025"
                    required
                  />
                </div>

                {/* Drag and drop image upload */}
                <div className="form-field">
                  <label>Product Image</label>
                  {image ? (
                    <div className="image-uploaded-preview">
                      <img src={image} alt="Uploaded preview" />
                      <button 
                        type="button" 
                        className="btn-remove-image" 
                        onClick={removeImage}
                        title="Remove Image"
                      >
                        <Trash2 size={16} />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={`image-upload-dropzone ${dragActive ? "drag-active" : ""}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="upload-icon" />
                      <div className="upload-text">
                        <span className="upload-trigger">Click to upload</span> or drag and drop image here
                      </div>
                      <span className="upload-hint">PNG, JPG or WEBP supported</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden-file-input" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes Config */}
              <div className="form-section-block">
                <div className="block-header-toggle">
                  <h3 className="section-block-title">Sizes Configuration</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={enableSizes}
                      onChange={(e) => setEnableSizes(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {enableSizes && (
                  <div className="sizes-config-list">
                    {(["small", "medium", "large"] as const).map((key) => (
                      <div key={key} className={`size-config-row ${sizes[key].enabled ? "enabled" : ""}`}>
                        <div className="row-toggle-name">
                          <label className="toggle-switch-sm">
                            <input
                              type="checkbox"
                              checked={sizes[key].enabled}
                              onChange={() => handleSizeToggle(key)}
                            />
                            <span className="toggle-slider-sm"></span>
                          </label>
                          <span className="size-label-name">{key} Size</span>
                        </div>
                        
                        {sizes[key].enabled && (
                          <div className="size-dimensions-inputs">
                            <div className="dim-input-group">
                              <input
                                type="number"
                                placeholder="Width"
                                value={sizes[key].width}
                                onChange={(e) => handleSizeDimsChange(key, "width", e.target.value)}
                                min="1"
                                required={sizes[key].enabled}
                              />
                              <span className="unit-label">cm (W)</span>
                            </div>
                            <span className="dim-separator">×</span>
                            <div className="dim-input-group">
                              <input
                                type="number"
                                placeholder="Height"
                                value={sizes[key].height}
                                onChange={(e) => handleSizeDimsChange(key, "height", e.target.value)}
                                min="1"
                                required={sizes[key].enabled}
                              />
                              <span className="unit-label">cm (H)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials Config */}
              <div className="form-section-block">
                <div className="block-header-toggle">
                  <h3 className="section-block-title">Materials Configuration</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={enableMaterials}
                      onChange={(e) => setEnableMaterials(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {enableMaterials && (
                  <div className="materials-config-list">
                    {(["wood", "acrylic", "glass"] as const).map((key) => {
                      const matLabels = { wood: "Multi-Wood", acrylic: "Acrylic", glass: "Glass" };
                      return (
                        <div key={key} className={`material-config-row ${materials[key] ? "enabled" : ""}`}>
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={materials[key]}
                              onChange={() => handleMaterialToggle(key)}
                            />
                            <span className="checkmark"></span>
                            <span className="checkbox-label">{matLabels[key]}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing Section - Dynamic Matrix */}
              <div className="form-section-block">
                <h3 className="section-block-title">Pricing Setup</h3>
                
                {showMatrix ? (
                  <div className="matrix-pricing-table-container">
                    <span className="pricing-description-label">Dynamic Pricing Matrix (Price for each combination)</span>
                    <table className="matrix-table">
                      <thead>
                        <tr>
                          <th>Size</th>
                          {materials.wood && <th>Multi-Wood</th>}
                          {materials.acrylic && <th>Acrylic</th>}
                          {materials.glass && <th>Glass</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(["small", "medium", "large"] as const).map((sKey) => {
                          if (!sizes[sKey].enabled) return null;
                          return (
                            <tr key={sKey}>
                              <td className="row-size-header">{sKey}</td>
                              {materials.wood && (
                                <td>
                                  <div className="matrix-price-input-wrapper">
                                    <span>₹</span>
                                    <input
                                      type="number"
                                      value={pricingMatrix[sKey]?.wood || ""}
                                      onChange={(e) => handleMatrixChange(sKey, "wood", e.target.value)}
                                      placeholder="Price"
                                      min="1"
                                      required
                                    />
                                  </div>
                                </td>
                              )}
                              {materials.acrylic && (
                                <td>
                                  <div className="matrix-price-input-wrapper">
                                    <span>₹</span>
                                    <input
                                      type="number"
                                      value={pricingMatrix[sKey]?.acrylic || ""}
                                      onChange={(e) => handleMatrixChange(sKey, "acrylic", e.target.value)}
                                      placeholder="Price"
                                      min="1"
                                      required
                                    />
                                  </div>
                                </td>
                              )}
                              {materials.glass && (
                                <td>
                                  <div className="matrix-price-input-wrapper">
                                    <span>₹</span>
                                    <input
                                      type="number"
                                      value={pricingMatrix[sKey]?.glass || ""}
                                      onChange={(e) => handleMatrixChange(sKey, "glass", e.target.value)}
                                      placeholder="Price"
                                      min="1"
                                      required
                                    />
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : enableSizes && Object.values(sizes).some((s) => s.enabled) ? (
                  // Sizes Only Pricing
                  <div className="pricing-simple-inputs">
                    <span className="pricing-description-label">Set Price for each Size</span>
                    {(["small", "medium", "large"] as const).map((sKey) => {
                      if (!sizes[sKey].enabled) return null;
                      return (
                        <div key={sKey} className="simple-price-field">
                          <label>{sKey} Size Price</label>
                          <div className="matrix-price-input-wrapper w-50">
                            <span>₹</span>
                            <input
                              type="number"
                              value={sizePrices[sKey]}
                              onChange={(e) => setSizePrices(prev => ({ ...prev, [sKey]: e.target.value }))}
                              placeholder="Price"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : enableMaterials && Object.values(materials).some((m) => m) ? (
                  // Materials Only Pricing
                  <div className="pricing-simple-inputs">
                    <span className="pricing-description-label">Set Price for each Material</span>
                    {(["wood", "acrylic", "glass"] as const).map((mKey) => {
                      if (!materials[mKey]) return null;
                      const matLabels = { wood: "Multi-Wood", acrylic: "Acrylic", glass: "Glass" };
                      return (
                        <div key={mKey} className="simple-price-field">
                          <label>{matLabels[mKey]} Price</label>
                          <div className="matrix-price-input-wrapper w-50">
                            <span>₹</span>
                            <input
                              type="number"
                              value={materialPrices[mKey]}
                              onChange={(e) => setMaterialPrices(prev => ({ ...prev, [mKey]: e.target.value }))}
                              placeholder="Price"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Neither Enabled - Base Price Only
                  <div className="pricing-simple-inputs">
                    <div className="simple-price-field">
                      <label>Base Product Price</label>
                      <div className="matrix-price-input-wrapper w-50">
                        <span>₹</span>
                        <input
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          placeholder="Price"
                          min="1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured toggle with limit verification */}
              <div className="form-section-block">
                <div className="featured-toggle-container">
                  <div className="featured-toggle-text">
                    <h3 className="section-block-title">Feature on Homepage</h3>
                    <p className="featured-toggle-desc">Toggle to showcase this product in the 'Popular Products' grid on the home page (Max 6 allowed).</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={featured}
                      disabled={isFeatureLimitReached}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {isFeatureLimitReached && (
                  <div className="featured-warning-box">
                    <AlertTriangle size={18} />
                    <span>Homepage limit of 6 featured products reached. Disable another item on the dashboard first to feature this.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="form-sticky-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-green" 
                id="form-save-product-btn"
                disabled={uploading}
              >
                {uploading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>

          {/* Right panel sticky live preview */}
          <div className="form-right-panel">
            <div className="sticky-preview-container">
              <span className="preview-label">Live Product Card Preview</span>
              
              {/* Product Card replica matching homepage style */}
              <div className="live-preview-card">
                <div className="preview-card-image-box">
                  {image ? (
                    <img src={image} alt={title || "Preview"} className="preview-card-img" />
                  ) : (
                    <div className="preview-image-placeholder">
                      <Eye size={36} />
                      <span>Image Preview</span>
                    </div>
                  )}
                  {featured && <span className="featured-badge-indicator">Featured</span>}
                </div>

                <div className="preview-card-details">
                  <div className="preview-card-title-row">
                    <h3 className="preview-card-title">{title || "Product Title"}</h3>
                    <span className="preview-card-id">{productId || "ID: N/A"}</span>
                  </div>

                  {/* Size chips preview */}
                  {enableSizes && (
                    <div className="preview-card-sizes">
                      <span className="preview-card-label">Sizes:</span>
                      <div className="preview-card-chips">
                        {(["small", "medium", "large"] as const).map((key) => {
                          if (!sizes[key].enabled) return null;
                          return (
                            <span key={key} className="preview-card-chip select-chip">
                              {key.toUpperCase()}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Materials list preview */}
                  {enableMaterials && (
                    <div className="preview-card-materials">
                      <span className="preview-card-label">Materials:</span>
                      <div className="preview-card-chips">
                        {(["wood", "acrylic", "glass"] as const).map((key) => {
                          if (!materials[key]) return null;
                          const labels = { wood: "Wood", acrylic: "Acrylic", glass: "Glass" };
                          return (
                            <span key={key} className="preview-card-chip label-chip">
                              {labels[key]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing preview display */}
                  <div className="preview-card-pricing-row">
                    <span className="preview-starting-label">Estimated Price</span>
                    <span className="preview-starting-val">{getCalculatedStartingPrice()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
