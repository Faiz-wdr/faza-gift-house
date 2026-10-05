import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Plus, Trash2, Send, Save, CheckCircle2 } from "lucide-react";
import type { Order, OrderItem } from "./AdminOrders";
import invoiceLogo from "../../assets/invoice-im.png";
import "./InvoiceModal.css";

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
  onSaveOrder?: (updatedOrder: Order) => void;
}

export default function InvoiceModal({ order, onClose, onSaveOrder }: InvoiceModalProps) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Billing details
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Invoice items
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");

  // Save state & feedback
  const [isSaved, setIsSaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeZoomSection, setActiveZoomSection] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  let invoiceScale = 1;
  if (isMobile) {
    if (activeZoomSection) {
      invoiceScale = 1.0;
    } else {
      // 680px is the min-width of the invoice sheet on mobile in CSS.
      // We scale it down to fit the window with a tiny 24px safety margin.
      invoiceScale = (windowWidth - 24) / 680;
    }
  }

  const handleSectionFocus = (section: string) => {
    if (isMobile && activeZoomSection !== section) {
      setActiveZoomSection(section);
    }
  };

  useEffect(() => {
    if (activeZoomSection && isMobile) {
      const element = document.getElementById(`invoice-sec-${activeZoomSection}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 180); // Slight delay for the zoom transition/layout reflow
      }
    }
  }, [activeZoomSection, isMobile]);

  useEffect(() => {
    // Auto-adjust all product textareas so text is fully visible with no scrollbars or resize handles
    const textareas = document.querySelectorAll<HTMLTextAreaElement>(".invoice-product-textarea");
    textareas.forEach((ta) => {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    });
  }, [items]);

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

  // Pre-fill fields from order details on mount or whenever order changes
  useEffect(() => {
    if (order) {
      setInvoiceNo(order.id.replace("#", "")); // Strip leading hash if present
      setInvoiceDate(formatDateToInvoiceStyle(order.orderDate));
      setCompanyName(order.customerName || "");
      setAddress(order.customerAddress || "");
      setMobileNumber(order.customerPhone || "");
      setItems(
        order.items.map((item) => {
          let title = item.productTitle || "Custom Memento";
          if (item.size && !title.toUpperCase().includes(item.size.toUpperCase())) {
            title += ` (${item.size.toUpperCase()})`;
          }
          if (item.material && !title.toUpperCase().includes(item.material.toUpperCase())) {
            title += ` - ${item.material.toUpperCase()}`;
          }
          return {
            ...item,
            productTitle: title
          };
        })
      );
      setPaidAmount(order.paidAmount || 0);
      setDiscount(0); // Default discount to 0
      setNote("");
    }
  }, [order]);

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
  const balance = Math.max(0, subTotal - discount - paidAmount);
  const totalDue = balance;

  // Save changes back to Order
  const handleSaveOrder = () => {
    const cleanSubTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const cleanDiscount = Math.max(0, Number(discount) || 0);
    const cleanGrandTotal = Math.max(0, cleanSubTotal - cleanDiscount);
    const cleanPaid = Math.max(0, Number(paidAmount) || 0);
    const cleanPending = Math.max(0, cleanGrandTotal - cleanPaid);

    const computedPaymentStatus: "Paid" | "Partial" | "Pending" =
      cleanPending === 0
        ? "Paid"
        : (cleanPaid > 0 ? "Partial" : "Pending");

    const cleanItems: OrderItem[] = items.map((it, idx) => {
      const qty = Math.max(1, Number(it.qty) || 1);
      const price = Math.max(0, Number(it.price) || 0);
      const total = Math.max(0, Number(it.total) || qty * price);
      return {
        productId: it.productId || `item-${idx + 1}`,
        productTitle: (it.productTitle || "Custom Product").trim(),
        productImage: it.productImage || "/placeholder.png",
        size: it.size || "",
        material: it.material || "",
        qty,
        price,
        total
      };
    });

    const finalOrderId = (invoiceNo || order.id || "").trim();

    const updatedOrder: Order = {
      ...order,
      id: finalOrderId || order.id,
      customerName: companyName.trim() || order.customerName,
      customerPhone: mobileNumber.trim() || order.customerPhone,
      customerAddress: address.trim() || order.customerAddress,
      items: cleanItems,
      subtotal: cleanSubTotal,
      additionalCharges: cleanDiscount > 0 ? -cleanDiscount : (order.additionalCharges || 0),
      grandTotal: cleanGrandTotal,
      paidAmount: cleanPaid,
      pendingAmount: cleanPending,
      payment: computedPaymentStatus
    };

    if (onSaveOrder) {
      onSaveOrder(updatedOrder);
    }

    setIsSaved(true);
    setSaveToast(`Order #${updatedOrder.id} changes saved!`);
    setTimeout(() => {
      setIsSaved(false);
      setSaveToast(null);
    }, 2800);
  };

  // Print helper
  const handlePrint = () => {
    // Scroll sheet to top so header is never scrolled off or clipped
    const scrollWrapper = document.querySelector(".invoice-sheet-scroll-wrapper");
    if (scrollWrapper) {
      scrollWrapper.scrollTop = 0;
    }

    const originalTitle = document.title;
    // Set a clean document title so browser uses this as default PDF file name
    document.title = `Invoice_${(invoiceNo || order.id || "Faza").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  // Send invoice to client WhatsApp
  const handleSendToClient = () => {
    const rawPhone = (mobileNumber || order.customerPhone || "").trim();
    let cleanPhone = rawPhone.replace(/[^0-9]/g, "");

    if (!cleanPhone) {
      const inputPhone = window.prompt("Enter customer WhatsApp number:", "");
      if (!inputPhone) return;
      cleanPhone = inputPhone.replace(/[^0-9]/g, "");
    }

    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const itemsSummary = items
      .map((item, idx) => `${idx + 1}. ${item.productTitle} × ${item.qty} = ₹${item.total.toLocaleString("en-IN")}`)
      .join("\n");

    const message = `*INVOICE FROM FAZA GIFT HOUSE*
----------------------------------------
*Invoice No:* ${invoiceNo || order.id}
*Date:* ${invoiceDate}
*Customer:* ${companyName || order.customerName}
${address ? `*Address:* ${address}\n` : ""}${mobileNumber ? `*Phone:* ${mobileNumber}\n` : ""}
*Items Ordered:*
${itemsSummary}

----------------------------------------
*Subtotal:* ₹${subTotal.toLocaleString("en-IN")}
*Paid Amount:* ₹${paidAmount.toLocaleString("en-IN")}
${discount > 0 ? `*Discount:* ₹${discount.toLocaleString("en-IN")}\n` : ""}*Total Due:* ₹${totalDue.toLocaleString("en-IN")}
----------------------------------------

Thank you for choosing *Faza Gift House*!
Malappuram, Kerala | +91 91880 86244`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // Pagination helper: neatly distribute items across pages if more than 11 items
  interface InvoicePage {
    pageNumber: number;
    totalPages: number;
    items: { item: OrderItem; globalIndex: number }[];
    isFirstPage: boolean;
    isLastPage: boolean;
  }

  const getInvoicePages = (allItems: OrderItem[]): InvoicePage[] => {
    // 1. Single page invoice: only create multiple pages when items cannot fit on one page.
    // An A4 sheet comfortably fits up to 11 items with all bill-to and financial summaries.
    const SINGLE_PAGE_MAX = 11;
    if (allItems.length <= SINGLE_PAGE_MAX) {
      return [
        {
          pageNumber: 1,
          totalPages: 1,
          items: allItems.map((item, idx) => ({ item, globalIndex: idx })),
          isFirstPage: true,
          isLastPage: true
        }
      ];
    }

    // 2. Multi-page invoice:
    // Page 1 has Bill To & Invoice details (no financials): fill page 1 fully (up to 12 items).
    // Intermediate pages have header & table only: fill up to 16 items.
    // Last page has financials, notes, row adder, and footer: fits up to 8 items.
    const PAGE_1_CAP = 12;
    const INTERMEDIATE_CAP = 16;
    const LAST_PAGE_CAP = 8;

    const pages: InvoicePage[] = [];
    let remaining = [...allItems];
    let pageNum = 1;

    while (remaining.length > 0) {
      const isFirst = pageNum === 1;

      if (isFirst) {
        // Fill Page 1 as much as possible while ensuring the last page doesn't exceed LAST_PAGE_CAP
        let takeCount = Math.min(PAGE_1_CAP, remaining.length - 1);
        if (remaining.length - takeCount > LAST_PAGE_CAP) {
          if (remaining.length <= PAGE_1_CAP + LAST_PAGE_CAP) {
            takeCount = remaining.length - LAST_PAGE_CAP;
          } else {
            takeCount = PAGE_1_CAP;
          }
        }

        const pageItems = remaining.slice(0, takeCount);
        pages.push({
          pageNumber: pageNum,
          totalPages: 1,
          items: pageItems.map((item, i) => ({ item, globalIndex: i })),
          isFirstPage: true,
          isLastPage: false
        });

        remaining = remaining.slice(takeCount);
        pageNum++;
      } else {
        // Subsequent page
        if (remaining.length <= LAST_PAGE_CAP) {
          const globalStartIndex = allItems.length - remaining.length;
          pages.push({
            pageNumber: pageNum,
            totalPages: 1,
            items: remaining.map((item, i) => ({ item, globalIndex: globalStartIndex + i })),
            isFirstPage: false,
            isLastPage: true
          });
          remaining = [];
          break;
        }

        let takeCount = Math.min(INTERMEDIATE_CAP, remaining.length - 1);
        if (remaining.length - takeCount > LAST_PAGE_CAP) {
          if (remaining.length <= INTERMEDIATE_CAP + LAST_PAGE_CAP) {
            takeCount = remaining.length - LAST_PAGE_CAP;
          } else {
            takeCount = INTERMEDIATE_CAP;
          }
        }

        const globalStartIndex = allItems.length - remaining.length;
        const pageItems = remaining.slice(0, takeCount);
        pages.push({
          pageNumber: pageNum,
          totalPages: 1,
          items: pageItems.map((item, i) => ({ item, globalIndex: globalStartIndex + i })),
          isFirstPage: false,
          isLastPage: false
        });

        remaining = remaining.slice(takeCount);
        pageNum++;
      }
    }

    const total = pages.length;
    pages.forEach((p, idx) => {
      p.totalPages = total;
      p.isLastPage = idx === total - 1;
    });

    return pages;
  };

  const invoicePages = getInvoicePages(items);

  // Fill up empty rows to match ledger look ONLY on single-page invoices with fewer than 6 items
  const minRows = 6;
  const emptyRowsCount = invoicePages.length === 1 ? Math.max(0, minRows - items.length) : 0;

  return createPortal(
    <div className="invoice-modal-backdrop">
      <div className="invoice-modal-container">

        {/* Top Floating Actions Header */}
        <header className="invoice-modal-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className="btn-toolbar-close"
              onClick={onClose}
              aria-label="Close Invoice"
              title="Close"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className={`btn-invoice-save ${isSaved ? "saved" : ""}`}
              onClick={handleSaveOrder}
              title="Save Changes to Order"
            >
              {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              <span>{isSaved ? "Saved!" : "Save"}</span>
            </button>
            <button className="btn-invoice-send" onClick={handleSendToClient} title="Send Invoice to Client via WhatsApp">
              <Send size={16} />
              <span>Send</span>
            </button>
            <button className="btn-invoice-print btn-green" onClick={handlePrint} title="Download or Print Invoice">
              <Printer size={16} />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* Inline Feedback Toast */}
        {saveToast && (
          <div className="invoice-toast-banner">
            <CheckCircle2 size={16} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Scrollable Container for Invoice Sheet(s) */}
        <div
          className="invoice-sheet-scroll-wrapper"
          onClick={() => {
            if (isMobile && activeZoomSection) {
              setActiveZoomSection(null);
            }
          }}
        >
          {invoicePages.map((page) => (
            <article
              key={`invoice-page-${page.pageNumber}`}
              className={`printable-invoice-sheet ${activeZoomSection ? "sheet-zoomed-in" : "sheet-zoomed-out"}`}
              onClick={(e) => {
                if (isMobile && activeZoomSection) {
                  e.stopPropagation();
                  setActiveZoomSection(null);
                }
              }}
              style={isMobile ? ({ zoom: invoiceScale } as React.CSSProperties) : {}}
            >

              {/* 1. Header Details (Repeated on every page: Logo + Company Info + INVOICE) */}
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
                  {page.totalPages > 1 && (
                    <div className="invoice-page-counter">Page {page.pageNumber} of {page.totalPages}</div>
                  )}
                </div>
              </div>

              {/* 2. Billing details & Invoice Details (ONLY on First Page!) */}
              {page.isFirstPage ? (
                <div className="invoice-meta-section">
                  <div
                    id="invoice-sec-bill-to"
                    className={`bill-to-group zoomable-section ${activeZoomSection === "bill-to" ? "focused-section" : ""}`}
                    onClick={(e) => {
                      if (isMobile) {
                        e.stopPropagation();
                        setActiveZoomSection("bill-to");
                      }
                    }}
                  >
                    <span className="meta-label">Bill to</span>
                    <input
                      type="text"
                      className="invoice-meta-input company-name-input screen-only-element"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Customer Name"
                      onFocus={() => handleSectionFocus("bill-to")}
                    />
                    <div className="company-name-print print-meta-company print-only-element">{companyName || "—"}</div>

                    <textarea
                      className="invoice-meta-input address-input screen-only-element"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Delivery Address"
                      rows={2}
                      onFocus={() => handleSectionFocus("bill-to")}
                    />
                    <div className="address-print print-meta-address print-only-element">{address || "—"}</div>

                    <input
                      type="text"
                      className="invoice-meta-input mobile-input screen-only-element"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Phone Number"
                      onFocus={() => handleSectionFocus("bill-to")}
                    />
                    <div className="mobile-print print-meta-phone print-only-element">{mobileNumber}</div>
                  </div>

                  <div
                    id="invoice-sec-details"
                    className={`invoice-details-group zoomable-section ${activeZoomSection === "details" ? "focused-section" : ""}`}
                    onClick={(e) => {
                      if (isMobile) {
                        e.stopPropagation();
                        setActiveZoomSection("details");
                      }
                    }}
                  >
                    <span className="meta-label text-right">Invoice Details</span>
                    <div className="invoice-details-table">
                      <div className="details-row">
                        <span className="row-key">Invoice No</span>
                        <span className="row-colon">:</span>
                        <input
                          type="text"
                          className="invoice-meta-input details-val-input font-mono screen-only-element"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          placeholder="Invoice Number"
                          onFocus={() => handleSectionFocus("details")}
                        />
                        <span className="details-val-print font-mono print-only-element">{invoiceNo}</span>
                      </div>
                      <div className="details-row">
                        <span className="row-key">Invoice Date</span>
                        <span className="row-colon">:</span>
                        <input
                          type="text"
                          className="invoice-meta-input details-val-input screen-only-element"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          placeholder="Invoice Date"
                          onFocus={() => handleSectionFocus("details")}
                        />
                        <span className="details-val-print print-only-element">{invoiceDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Needed spacing on subsequent pages */
                <div className="invoice-subsequent-page-spacer" />
              )}

              {/* 3. Items Table */}
              <div
                id={page.isFirstPage ? "invoice-sec-items" : undefined}
                className={`invoice-table-outer zoomable-section ${activeZoomSection === "items" ? "focused-section" : ""}`}
                onClick={(e) => {
                  if (isMobile) {
                    e.stopPropagation();
                    setActiveZoomSection("items");
                  }
                }}
              >
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
                    {page.items.map(({ item, globalIndex }) => (
                      <tr key={`invoice-item-${page.pageNumber}-${globalIndex}`} className="item-row">
                        <td className="col-sno text-center">
                          <span className="sno-text">{globalIndex + 1}.</span>
                        </td>
                        <td className="col-product">
                          <textarea
                            className="invoice-table-input invoice-product-textarea screen-only-element"
                            value={item.productTitle}
                            onChange={(e) => {
                              handleItemChange(globalIndex, "productTitle", e.target.value);
                              const target = e.target;
                              target.style.height = "auto";
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                            onInput={(e) => {
                              const target = e.currentTarget;
                              target.style.height = "auto";
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                            placeholder="Product Title"
                            rows={Math.max(1, Math.min(4, Math.ceil((item.productTitle || "").length / 28)))}
                            onFocus={() => handleSectionFocus("items")}
                          />
                          <div className="product-title-print print-only-element">
                            {item.productTitle}
                          </div>
                        </td>
                        <td className="col-qty text-center">
                          <input
                            type="number"
                            className="invoice-table-input text-center screen-only-element"
                            value={item.qty}
                            onChange={(e) => handleItemChange(globalIndex, "qty", parseInt(e.target.value) || 0)}
                            min="1"
                            onFocus={() => handleSectionFocus("items")}
                          />
                          <span className="print-only-element">{item.qty}</span>
                        </td>
                        <td className="col-price text-center">
                          <div className="price-input-cell screen-only-element">
                            <span>₹</span>
                            <input
                              type="number"
                              className="invoice-table-input text-left"
                              value={item.price}
                              onChange={(e) => handleItemChange(globalIndex, "price", parseFloat(e.target.value) || 0)}
                              min="0"
                              onFocus={() => handleSectionFocus("items")}
                            />
                          </div>
                          <span className="print-only-element">₹{item.price}</span>
                        </td>
                        <td className="col-total text-right">
                          <span className="item-total-val">₹{item.total}</span>
                        </td>
                        <td className="col-actions text-center invoice-only-screen">
                          <button
                            type="button"
                            className="btn-invoice-row-delete"
                            onClick={() => handleRemoveRow(globalIndex)}
                            title="Delete Row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Empty rows on single-page invoices with fewer than minRows */}
                    {page.totalPages === 1 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
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

              {/* Row Adder Button (Only on Last Page!) */}
              {page.isLastPage && (
                <div className="invoice-row-adder-container">
                  <button type="button" className="btn-invoice-add-row" onClick={handleAddRow}>
                    <Plus size={14} />
                    <span>Add Custom Item</span>
                  </button>
                </div>
              )}

              {/* 4. Financial Calculations block (Only on Last Page!) */}
              {page.isLastPage && (
                <div
                  id="invoice-sec-financials"
                  className={`invoice-financials-container zoomable-section ${activeZoomSection === "financials" ? "focused-section" : ""}`}
                  onClick={(e) => {
                    if (isMobile) {
                      e.stopPropagation();
                      setActiveZoomSection("financials");
                    }
                  }}
                >
                  <div className="invoice-financials-table">
                    <div className="financials-row">
                      <span className="lbl">Sub Total</span>
                      <span className="val">₹{subTotal}</span>
                    </div>
                    <div className="financials-row">
                      <span className="lbl">Paid Amount</span>
                      <span className="val editing-val">
                        <span className="screen-input-wrap screen-only-element">
                          <span className="curr-sym">₹</span>
                          <input
                            type="number"
                            className="invoice-financial-input"
                            value={paidAmount === 0 ? "" : paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value === "" ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            min="0"
                            onFocus={() => handleSectionFocus("financials")}
                          />
                        </span>
                        <span className="print-val print-only-element">₹{paidAmount}</span>
                      </span>
                    </div>
                    <div className="financials-row">
                      <span className="lbl">Discount</span>
                      <span className="val editing-val">
                        <span className="screen-input-wrap screen-only-element">
                          <span className="curr-sym">₹</span>
                          <input
                            type="number"
                            className="invoice-financial-input"
                            value={discount === 0 ? "" : discount}
                            onChange={(e) => setDiscount(e.target.value === "" ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            min="0"
                            onFocus={() => handleSectionFocus("financials")}
                          />
                        </span>
                        <span className="print-val print-only-element">₹{discount}</span>
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
              )}

              {/* 5. Notes block (Only on Last Page!) */}
              {page.isLastPage && (
                <div
                  id="invoice-sec-notes"
                  className={`invoice-note-section zoomable-section ${activeZoomSection === "notes" ? "focused-section" : ""}`}
                  onClick={(e) => {
                    if (isMobile) {
                      e.stopPropagation();
                      setActiveZoomSection("notes");
                    }
                  }}
                >
                  <span className="note-title-lbl">Note</span>
                  <textarea
                    className="invoice-note-textarea screen-only-element"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Write custom payment instructions or notes here..."
                    rows={3}
                    onFocus={() => handleSectionFocus("notes")}
                  />
                  <div className="invoice-note-print print-only-element">
                    {note || "Thank you for choosing Faza Gift House!"}
                  </div>
                </div>
              )}

              {/* 6. Footer Thank you (Only on Last Page!) */}
              {page.isLastPage && (
                <footer className="invoice-sheet-footer">
                  <p>Thank you for choosing us for your needs.</p>
                </footer>
              )}

            </article>
          ))}
        </div>

        {/* Floating Zoom Out Button for Mobile View */}
        {isMobile && activeZoomSection && (
          <button
            type="button"
            className="btn-floating-zoom-out"
            onClick={(e) => {
              e.stopPropagation();
              setActiveZoomSection(null);
            }}
          >
            <X size={16} />
            <span>Done Editing</span>
          </button>
        )}

      </div>
    </div>,
    document.body
  );
}
