import { useState } from "react";
import { Store, FileText, Check, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./AdminSettings.css";

export default function AdminSettings() {
  const [storeName, setStoreName] = useState(() => localStorage.getItem("faza_setting_store_name") || "Faza Gift House");
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem("faza_setting_whatsapp") || "+91 91880 86244");
  const [location, setLocation] = useState(() => localStorage.getItem("faza_setting_location") || "Malappuram, Kerala");
  const [invoicePrefix, setInvoicePrefix] = useState(() => localStorage.getItem("faza_setting_invoice_prefix") || "FAZA-");
  const [paymentTerms, setPaymentTerms] = useState(() => localStorage.getItem("faza_setting_payment_terms") || "Due on Receipt");
  const [invoiceNotes, setInvoiceNotes] = useState(() => localStorage.getItem("faza_setting_invoice_notes") || "Thank you for choosing Faza Gift House!");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("faza_setting_store_name", storeName);
      localStorage.setItem("faza_setting_whatsapp", whatsapp);
      localStorage.setItem("faza_setting_location", location);
      localStorage.setItem("faza_setting_invoice_prefix", invoicePrefix);
      localStorage.setItem("faza_setting_payment_terms", paymentTerms);
      localStorage.setItem("faza_setting_invoice_notes", invoiceNotes);

      setToastMessage("Settings saved successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  return (
    <div className="admin-settings-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="settings-toast"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <Check size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uniform Section Header */}
      <div className="admin-section-header">
        <div className="section-header-info">
          <h2 className="section-header-title">Settings</h2>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-grid">
        {/* Card 1: Store Information */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Store size={20} />
            </div>
            <div className="settings-card-title-group">
              <h3>Store Profile</h3>
              <p>Manage your business identity and contact details</p>
            </div>
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-store-name">Store Name</label>
            <input
              id="setting-store-name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Faza Gift House"
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-whatsapp">WhatsApp Support Number</label>
            <input
              id="setting-whatsapp"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +91 91880 86244"
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-location">Business Location / Address</label>
            <input
              id="setting-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Malappuram, Kerala"
              required
            />
          </div>
        </div>

        {/* Card 2: Invoicing & Billing Defaults */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <FileText size={20} />
            </div>
            <div className="settings-card-title-group">
              <h3>Invoice & Orders</h3>
              <p>Default preferences for order receipts and invoices</p>
            </div>
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-invoice-prefix">Invoice Number Prefix</label>
            <input
              id="setting-invoice-prefix"
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g. FAZA-"
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-payment-terms">Default Payment Terms</label>
            <select
              id="setting-payment-terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 7 Days">Net 7 Days</option>
              <option value="Net 15 Days">Net 15 Days</option>
              <option value="Advance Required">Advance Required</option>
            </select>
          </div>

          <div className="settings-form-group">
            <label htmlFor="setting-invoice-notes">Default Invoice Note</label>
            <textarea
              id="setting-invoice-notes"
              rows={2}
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="Thank you message or bank UPI details..."
            />
          </div>
        </div>

        {/* Save button spanning grid */}
        <div className="settings-footer-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn-save-settings">
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
