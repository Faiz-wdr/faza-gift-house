import { useState, useEffect } from "react";
import { X, Printer, Plus, Trash2, ArrowLeft } from "lucide-react";
import type { Order, OrderItem } from "./AdminOrders";
import invoiceLogo from "../../assets/invoice-im.png";
import "./InvoiceModal.css";

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  
  // Billing details
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Invoice items
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");

  // Helper to format date as DD-MMM-YYYY (e.g. 07-JUL-2025)
  const formatDateToInvoiceStyle = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, "0");
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Pre-fill fields from order details on mount only
  useEffect(() => {
    if (order) {
      setInvoiceNo(order.id.replace("#", "")); // Strip leading hash if present
      setInvoiceDate(formatDateToInvoiceStyle(order.orderDate));
      setCompanyName(order.customerName);
      setAddress(order.customerAddress);
      setMobileNumber(order.customerPhone);
      setItems(
        order.items.map((item) => ({
          ...item,
          productTitle: item.productTitle + (item.size ? ` (${item.size.toUpperCase()})` : "") + (item.material ? ` - ${item.material.toUpperCase()}` : "")
        }))
      );
      setDiscount(0); // Default discount to 0
      setNote("");
    }
  }, []);

  // Edit Handlers
  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updatedItem = { ...item, [field]: val };
        
        // Auto-recalculate total if qty or price changes
        if (field === "qty" || field === "price") {
          const qty = field === "qty" ? parseInt(val) || 0 : item.qty;
          const price = field === "price" ? parseFloat(val) || 0 : item.price;
          updatedItem.total = qty * price;
        }
        return updatedItem;
      })
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: `custom-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        productTitle: "New Custom Memento",
        productImage: "",
        size: "",
        material: "",
        qty: 1,
        price: 0,
        total: 0
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Computations
  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const balance = Math.max(0, subTotal - discount);
  const totalDue = balance;

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  // Fill up empty rows to match the reference visual design (e.g. at least 6 rows total)
  const minRows = 6;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  return (
    <div className="invoice-modal-backdrop">
      <div className="invoice-modal-container">
        
        {/* Top Floating Actions Header */}
        <header className="invoice-modal-toolbar">
          <div className="toolbar-left">
            <button className="btn-toolbar-back" onClick={onClose}>
              <ArrowLeft size={18} />
              <span>Back to Orders</span>
            </button>
          </div>
          <div className="toolbar-actions">
            <button className="btn-invoice-cancel" onClick={onClose}>
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button className="btn-invoice-print btn-green" onClick={handlePrint}>
              <Printer size={16} />
              <span>Download PDF / Print</span>
            </button>
          </div>
        </header>

        {/* Scrollable Container for Invoice Sheet */}
        <div className="invoice-sheet-scroll-wrapper">
          <article className="printable-invoice-sheet">
            
            {/* 1. Header Details */}
            <div className="invoice-sheet-header">
              <div className="invoice-logo-block">
                <img src={invoiceLogo} alt="Faza Gift House Logo" className="invoice-logo-img" />
                <div className="invoice-logo-details">
                  <div className="logo-company-name">Faza Gift House</div>
                  <div className="logo-location">Malappuram, Kerala</div>
                  <div className="logo-phone">+91 91880 86244</div>
                </div>
              </div>
              <div className="invoice-title-block">
                <h1>INVOICE</h1>
              </div>
            </div>

            {/* 2. Billing details & Invoice Details */}
            <div className="invoice-meta-section">
              <div className="bill-to-group">
                <span className="meta-label">Bill to</span>
                <input
                  type="text"
                  className="invoice-meta-input company-name-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="[Company Name]"
                />
                <textarea
                  className="invoice-meta-input address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="[place or address]"
                  rows={2}
                />
                <input
                  type="text"
                  className="invoice-meta-input mobile-input"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="[Mobile Number]"
                />
              </div>

              <div className="invoice-details-group">
                <span className="meta-label">Invoice Details</span>
                <div className="invoice-details-table">
                  <div className="details-row">
                    <span className="row-key">Invoice No</span>
                    <span className="row-colon">:</span>
                    <input
                      type="text"
                      className="invoice-meta-input details-val-input font-mono"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="Invoice Number"
                    />
                  </div>
                  <div className="details-row">
                    <span className="row-key">Invoice Date</span>
                    <span className="row-colon">:</span>
                    <input
                      type="text"
                      className="invoice-meta-input details-val-input"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      placeholder="Invoice Date"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="invoice-table-outer">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th className="col-sno"></th>
                    <th className="col-product">Product</th>
                    <th className="col-qty text-center">Qty</th>
                    <th className="col-price text-center">Unit Price</th>
                    <th className="col-total text-right">Total</th>
                    <th className="col-actions invoice-only-screen"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.productId || idx} className="item-row">
                      <td className="col-sno text-center">
                        <span className="sno-text">{idx + 1}.</span>
                      </td>
                      <td className="col-product">
                        <input
                          type="text"
                          className="invoice-table-input"
                          value={item.productTitle}
                          onChange={(e) => handleItemChange(idx, "productTitle", e.target.value)}
                          placeholder="Product Title"
                        />
                      </td>
                      <td className="col-qty text-center">
                        <input
                          type="number"
                          className="invoice-table-input text-center"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </td>
                      <td className="col-price text-center">
                        <div className="price-input-cell">
                          <span>₹</span>
                          <input
                            type="number"
                            className="invoice-table-input text-left"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="col-total text-right">
                        <span className="item-total-val">₹{item.total}</span>
                      </td>
                      <td className="col-actions text-center invoice-only-screen">
                        <button
                          type="button"
                          className="btn-invoice-row-delete"
                          onClick={() => handleRemoveRow(idx)}
                          title="Delete Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Empty rows to match design ledger lines */}
                  {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="empty-row">
                      <td className="col-sno text-center">&nbsp;</td>
                      <td className="col-product">&nbsp;</td>
                      <td className="col-qty text-center">&nbsp;</td>
                      <td className="col-price text-center">&nbsp;</td>
                      <td className="col-total text-right">&nbsp;</td>
                      <td className="col-actions invoice-only-screen">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Row Adder Button (Hidden in print) */}
            <div className="invoice-row-adder-container">
              <button type="button" className="btn-invoice-add-row" onClick={handleAddRow}>
                <Plus size={14} />
                <span>Add Custom Item</span>
              </button>
            </div>

            {/* 4. Financial Calculations block */}
            <div className="invoice-financials-container">
              <div className="invoice-financials-table">
                <div className="financials-row">
                  <span className="lbl">Sub Total</span>
                  <span className="val">₹{subTotal}</span>
                </div>
                <div className="financials-row">
                  <span className="lbl">Discount</span>
                  <span className="val editing-val">
                    <span>₹</span>
                    <input
                      type="number"
                      className="invoice-financial-input"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      min="0"
                    />
                  </span>
                </div>
                <div className="financials-row">
                  <span className="lbl">Balance</span>
                  <span className="val">₹{balance}</span>
                </div>
                
                <div className="financials-divider" />
                
                <div className="financials-row due-row">
                  <span className="lbl">Total Due</span>
                  <span className="val">₹{totalDue}</span>
                </div>
              </div>
            </div>

            {/* 5. Notes block */}
            <div className="invoice-note-section">
              <span className="note-title-lbl">Note</span>
              <textarea
                className="invoice-note-textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write custom payment instructions or notes here..."
                rows={3}
              />
            </div>

            {/* 6. Footer Thank you */}
            <footer className="invoice-sheet-footer">
              <p>Thank you for choosing us for your needs.</p>
            </footer>

          </article>
        </div>

      </div>
    </div>
  );
}
