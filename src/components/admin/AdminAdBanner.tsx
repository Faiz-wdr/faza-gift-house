import React, { useState, useEffect } from "react";
import { Upload, Trash2, Image as ImageIcon, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { bannerService } from "../../services/bannerService";
import "./AdminAdBanner.css";

interface AdBanner {
  id: string;
  image: string; // Public image URL
  name: string;
  size: string;
}

export default function AdminAdBanner() {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warning">("success");

  // Load banners on mount
  const loadBanners = async () => {
    try {
      const dbBanners = await bannerService.getBanners();
      setBanners(dbBanners);
    } catch (e) {
      console.error("Error loading banners from database:", e);
      showToast("Failed to retrieve banners from database.", "warning");
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const showToast = (message: string, type: "success" | "warning" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // File Upload Logic
  const handleFile = async (file: File) => {
    // 1. Limit Check
    if (banners.length >= 3) {
      showToast("Maximum of 3 banners reached. Delete an existing banner first.", "warning");
      return;
    }

    // 2. Format Check
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Unsupported file type. Use PNG, JPG, JPEG, or WebP.", "warning");
      return;
    }

    // 3. Size Check
    const maxSizeBytes = 1024 * 1024; // 1MB constraint limit
    if (file.size > maxSizeBytes) {
      showToast("Image is too large! Maximum limit is 1MB to optimize page loading.", "warning");
      return;
    }

    setUploading(true);
    try {
      await bannerService.uploadBanner(file);
      await loadBanners();
      showToast("Ad Banner uploaded successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload banner to Supabase Storage.", "warning");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    const bannerToDelete = banners.find(b => b.id === id);
    if (!bannerToDelete) return;

    try {
      await bannerService.deleteBanner(id, bannerToDelete.image);
      await loadBanners();
      showToast("Banner slide deleted.", "success");
    } catch (e) {
      showToast("Failed to delete banner.", "warning");
      console.error(e);
    }
  };

  // Restore defaults
  const handleRestoreDefaults = async () => {
    if (window.confirm("Are you sure you want to clear custom banners and restore the default slides?")) {
      try {
        setUploading(true);
        // Delete all custom banners from database and storage
        await Promise.all(banners.map(b => bannerService.deleteBanner(b.id, b.image)));
        await loadBanners();
        showToast("Defaults restored.", "success");
      } catch (e) {
        showToast("Failed to restore default banners.", "warning");
        console.error(e);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="admin-ad-banner-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className={`banner-toast ${toastType}`}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            {toastType === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="banner-page-header">
        <div>
          <h2>Ad Banner Settings</h2>
          <p className="page-desc">Manage the hero advertisement banners displayed at the top of the products catalog page.</p>
        </div>
        {banners.length > 0 && (
          <button className="btn-restore-defaults" onClick={handleRestoreDefaults}>
            <RefreshCw size={14} />
            <span>Restore Defaults</span>
          </button>
        )}
      </div>

      <div className="banner-layout-grid">
        
        {/* Left Side: Upload & Info */}
        <div className="banner-settings-panel">
          
          {/* Info Card */}
          <div className="banner-info-card">
            <h3>Image Specifications</h3>
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">Aspect Ratio</span>
                <span className="spec-value highlight">16 : 7 (Wide Banner)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Recommended Pixels</span>
                <span className="spec-value">1600px width × 700px height</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Image File Size</span>
                <span className="spec-value">Under 300 KB (Max limit: 1 MB)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Accepted Formats</span>
                <span className="spec-value">PNG, JPG, JPEG, WebP</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Maximum Banners</span>
                <span className="spec-value highlight">Up to 3 active slides</span>
              </div>
            </div>
            <p className="specs-note">
              <strong>Note:</strong> To ensure optimal performance and fast page load times for your customers, compress your images using tools like TinyPNG before uploading. Banners are stored directly in local storage.
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div className={`upload-drop-zone-card ${(banners.length >= 3 || uploading) ? "disabled" : ""}`}>
            <input 
              type="file" 
              id="banner-file-input" 
              className="banner-file-input" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              onChange={handleInputChange}
              disabled={banners.length >= 3 || uploading}
            />
            <label 
              htmlFor="banner-file-input"
              className={`drop-label ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="upload-icon-wrapper">
                <Upload size={24} />
              </div>
              {uploading ? (
                <>
                  <h4>Uploading to Supabase...</h4>
                  <p>Saving asset binary to storage bucket.</p>
                </>
              ) : banners.length >= 3 ? (
                <>
                  <h4>Upload Limit Reached</h4>
                  <p>Delete a banner below to upload a new one.</p>
                </>
              ) : (
                <>
                  <h4>Drag & drop banner image</h4>
                  <p>or click to browse from device</p>
                  <span className="file-hint">PNG, JPG or WebP • Max 1MB</span>
                </>
              )}
            </label>
          </div>

        </div>

        {/* Right Side: Active Slides List */}
        <div className="banner-list-panel">
          <div className="panel-header">
            <h3>Active Banner Slides ({banners.length}/3)</h3>
            <span className="status-indicator">
              {banners.length === 0 ? "Default slides active" : `${banners.length} custom slides active`}
            </span>
          </div>

          {banners.length === 0 ? (
            <div className="default-fallback-placeholder">
              <ImageIcon size={48} className="placeholder-icon" />
              <h4>Default Banners Displayed</h4>
              <p>You have not uploaded any custom banners. The product page will display the default portfolio slides (Arch, Wood, Acrylic, and Glass awards) by default.</p>
            </div>
          ) : (
            <div className="active-banners-list">
              <AnimatePresence>
                {banners.map((banner, index) => (
                  <motion.div 
                    key={banner.id} 
                    className="banner-slide-item-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="banner-thumbnail-container">
                      <img src={banner.image} alt={banner.name} className="banner-thumbnail" />
                      <div className="banner-slide-badge">Slide {index + 1}</div>
                    </div>
                    
                    <div className="banner-details">
                      <h4 className="banner-name" title={banner.name}>{banner.name}</h4>
                      <div className="banner-meta">
                        <span>Size: <strong>{banner.size}</strong></span>
                        <span className="dot">•</span>
                        <span>Dimensions: <strong>16:7 aspect ratio</strong></span>
                      </div>
                    </div>

                    <button 
                      className="btn-delete-banner" 
                      onClick={() => handleDelete(banner.id)}
                      title="Delete this banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
