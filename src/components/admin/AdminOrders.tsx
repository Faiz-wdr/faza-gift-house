import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Phone, 
  MapPin, 
  Calendar 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminProduct } from "./ProductPreviewModal";
import InvoiceModal from "./InvoiceModal";
import "./AdminOrders.css";

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  size: "small" | "medium" | "large" | "";
  material: "wood" | "acrylic" | "glass" | "";
  qty: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string;
  deliveryDate?: string;
  status: "Delivered" | "Pending" | "In Progress";
  payment: "Paid" | "Pending" | "Partial";
  trackingId: string;
  items: OrderItem[];
  subtotal: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
}

interface AdminOrdersProps {
  orders: Order[];
  products: AdminProduct[];
  onAddOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export default function AdminOrders({
  orders,
  products,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
}: AdminOrdersProps) {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Selection states for drawer and modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Copy tracking ID handler
  const handleCopyTracking = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid row click selection
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setToastMessage("Tracking ID Copied");
    setTimeout(() => {
      setCopiedId(false);
      setToastMessage(null);
    }, 2500);
  };

  // Date parsing helper
  const isWithinDateRange = (dateStr: string, filter: string): boolean => {
    if (filter === "all") return true;
    
    // Parse order date
    const orderDate = new Date(dateStr);
    const today = new Date("2026-06-05"); // Assume current project context date is June 5, 2026
    
    // Clean times
    orderDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filter === "today") {
      return diffDays === 0;
    } else if (filter === "week") {
      return diffDays >= 0 && diffDays <= 7;
    } else if (filter === "month") {
      return diffDays >= 0 && diffDays <= 30;
    }
    return true;
  };

  // Filter and Search logic
  const filteredOrders = orders.filter((order) => {
    // Search match
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanSearch || 
      order.id.toLowerCase().includes(cleanSearch) ||
      order.customerName.toLowerCase().includes(cleanSearch) ||
      order.trackingId.toLowerCase().includes(cleanSearch);

    // Status match
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    // Payment match
    const matchesPayment = paymentFilter === "all" || order.payment === paymentFilter;

    // Date range match
    const matchesDate = isWithinDateRange(order.orderDate, dateFilter);

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime() || b.id.localeCompare(a.id);
    } else {
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime() || a.id.localeCompare(b.id);
    }
  });

  // Edit action
  const handleEditClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  // Delete action
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  // Open Form for Adding
  const handleAddClick = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  // Invoice button click handler
  const handleInvoiceClick = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceOrder(order);
  };

  return (
    <div className="admin-orders-container">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className="orders-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Check size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar controls */}
      <div className="orders-toolbar">
        {/* Search Input bar */}
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search Order ID, Customer Name, or Tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters grid */}
        <div className="toolbar-filters">
          <div className="filter-select-group">
            <span className="filter-label">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Payment</span>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Date</span>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Sort By</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <button className="btn btn-green add-order-btn" onClick={handleAddClick}>
            <Plus size={16} />
            <span>Add Order</span>
          </button>
        </div>
      </div>

      {/* Orders Table view */}
      <div className="orders-table-wrapper">
        {sortedOrders.length === 0 ? (
          <div className="orders-empty-state">
            <FileText size={48} />
            <h3>No Orders Found</h3>
            <p>Try refining your search text or filter options.</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Products</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                // Short product list preview
                const firstItem = order.items[0];
                const productsText = order.items.length === 1 
                  ? firstItem ? `${firstItem.productTitle} (${firstItem.size.toUpperCase()})` : "—"
                  : firstItem ? `${firstItem.productTitle} +${order.items.length - 1}` : `${order.items.length} Products`;

                return (
                  <tr 
                    key={order.id}
                    className={`order-row ${selectedOrder?.id === order.id ? "active-row" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="order-cell-id">{order.id}</td>
                    <td className="order-cell-customer">{order.customerName}</td>
                    <td className="order-cell-products" title={order.items.map(i => i.productTitle).join(", ")}>
                      {productsText}
                    </td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`payment-badge ${order.payment.toLowerCase()}`}>
                        {order.payment}
                      </span>
                    </td>
                    <td className="order-cell-date">{order.orderDate}</td>
                    <td className="order-cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="action-icon-btn edit"
                        onClick={(e) => handleEditClick(order, e)}
                        title="Edit Order"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="action-icon-btn delete"
                        onClick={(e) => handleDeleteClick(order.id, e)}
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Slide-Over Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              className="details-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            >
              {/* Drawer Header */}
              <div className="drawer-header">
                <div className="drawer-title-row">
                  <h3>Order Details</h3>
                  <span className="order-id-tag">{selectedOrder.id}</span>
                </div>
                <button className="drawer-close-btn" onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body Contents */}
              <div className="drawer-body">
                {/* 1. Status Badges Header */}
                <div className="drawer-status-summary">
                  <div className="status-item">
                    <span className="summary-label">Order Status</span>
                    <span className={`status-badge ${selectedOrder.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="summary-label">Payment Status</span>
                    <span className={`payment-badge ${selectedOrder.payment.toLowerCase()}`}>
                      {selectedOrder.payment}
                    </span>
                  </div>
                </div>

                {/* 2. Customer Information */}
                <div className="drawer-section-card">
                  <h4 className="section-card-title">Customer Information</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <FileText size={16} className="info-icon" />
                      <div>
                        <span className="info-label">Name</span>
                        <span className="info-val">{selectedOrder.customerName}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <Phone size={16} className="info-icon" />
                      <div>
                        <span className="info-label">Phone Number</span>
                        <span className="info-val">{selectedOrder.customerPhone || "—"}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <MapPin size={16} className="info-icon" />
                      <div>
                        <span className="info-label">Address</span>
                        <span className="info-val address-text">{selectedOrder.customerAddress || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dates & Tracking */}
                <div className="drawer-section-card">
                  <h4 className="section-card-title">Dates & Logistics</h4>
                  <div className="info-list-grid">
                    <div className="info-item">
                      <Calendar size={16} className="info-icon" />
                      <div>
                        <span className="info-label">Order Date</span>
                        <span className="info-val">{selectedOrder.orderDate}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <Calendar size={16} className="info-icon" />
                      <div>
                        <span className="info-label">Delivery Date</span>
                        <span className="info-val">{selectedOrder.deliveryDate || "Pending Delivery"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Click-to-copy Tracking ID box */}
                  <div className="tracking-id-section">
                    <span className="info-label">Logistics Tracking ID</span>
                    {selectedOrder.trackingId ? (
                      <div 
                        className={`tracking-copy-box ${copiedId ? "copied" : ""}`}
                        onClick={(e) => handleCopyTracking(selectedOrder.trackingId, e)}
                        title="Click to copy Tracking ID"
                      >
                        <span className="tracking-text">{selectedOrder.trackingId}</span>
                        {copiedId ? <Check size={14} className="copy-icon text-green" /> : <Copy size={14} className="copy-icon" />}
                      </div>
                    ) : (
                      <span className="info-val text-muted">No tracking ID provided</span>
                    )}
                  </div>
                </div>

                {/* 4. Products Table */}
                <div className="drawer-section-card no-padding">
                  <h4 className="section-card-title pad-x-y">Items Ordered</h4>
                  <div className="drawer-products-list">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="drawer-product-row">
                        <img 
                          src={item.productImage || "/placeholder.png"} 
                          alt={item.productTitle} 
                          className="item-row-img" 
                        />
                        <div className="item-row-details">
                          <h5 className="item-row-name">{item.productTitle}</h5>
                          <div className="item-row-chips">
                            {item.size && <span className="item-chip size">{item.size.toUpperCase()}</span>}
                            {item.material && <span className="item-chip material">{item.material.charAt(0).toUpperCase() + item.material.slice(1)}</span>}
                          </div>
                          <div className="item-row-pricing">
                            <span className="qty-price">{item.qty} × ₹{item.price}</span>
                            <span className="item-total-price">₹{item.total}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Financial Details & Summary */}
                <div className="drawer-section-card">
                  <h4 className="section-card-title">Financial Summary</h4>
                  <div className="summary-billing-details">
                    <div className="billing-row">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal}</span>
                    </div>
                    <div className="billing-row">
                      <span>Additional Charges (Tax/Shipping)</span>
                      <span>₹{selectedOrder.additionalCharges}</span>
                    </div>
                    <div className="billing-row grand-total-row">
                      <span>Grand Total</span>
                      <span>₹{selectedOrder.grandTotal}</span>
                    </div>

                    <div className="billing-divider" />

                    <div className="billing-row text-green">
                      <span>Paid Amount</span>
                      <span>₹{selectedOrder.paidAmount}</span>
                    </div>
                    <div className="billing-row text-red">
                      <span>Pending Amount</span>
                      <span>₹{selectedOrder.pendingAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Button */}
                <div className="drawer-footer-actions">
                  <button 
                    className="btn btn-whatsapp w-100"
                    onClick={(e) => handleInvoiceClick(selectedOrder, e)}
                  >
                    <FileText size={18} />
                    <span>Generate Invoice PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add / Edit Order Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <OrderFormModal
            order={editingOrder}
            products={products}
            orders={orders}
            onClose={() => { setIsFormOpen(false); setEditingOrder(null); }}
            onSave={(savedOrder) => {
              if (editingOrder) {
                onEditOrder(savedOrder);
              } else {
                onAddOrder(savedOrder);
              }
              setIsFormOpen(false);
              setEditingOrder(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <DeleteConfirmModal
            orderId={deleteTargetId}
            onClose={() => setDeleteTargetId(null)}
            onConfirm={() => {
              onDeleteOrder(deleteTargetId);
              if (selectedOrder && selectedOrder.id === deleteTargetId) {
                setSelectedOrder(null);
              }
              setDeleteTargetId(null);
              setToastMessage("Order Deleted Successfully");
              setTimeout(() => setToastMessage(null), 2500);
            }}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Invoice Generator Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

    </div>
  );
}

// Sub-Modal component for Order Creation and Updates
interface OrderFormModalProps {
  order: Order | null;
  products: AdminProduct[];
  orders: Order[];
  onClose: () => void;
  onSave: (order: Order) => void;
}

function OrderFormModal({ order, products, orders, onClose, onSave }: OrderFormModalProps) {

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState<"Delivered" | "Pending" | "In Progress">("Pending");
  const [payment, setPayment] = useState<"Paid" | "Pending" | "Partial">("Pending");
  const [trackingId, setTrackingId] = useState("");
  
  // Multiple items list state
  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", productTitle: "", productImage: "", size: "", material: "", qty: 1, price: 0, total: 0 }
  ]);
  
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Pre-fill form when editing
  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone);
      setCustomerAddress(order.customerAddress);
      setOrderDate(order.orderDate);
      setDeliveryDate(order.deliveryDate || "");
      setStatus(order.status);
      setPayment(order.payment);
      setTrackingId(order.trackingId);
      setItems(order.items.map(item => ({ ...item })));
      setAdditionalCharges(order.additionalCharges);
      setPaidAmount(order.paidAmount);
    } else {
      // Setup default new order dates
      const today = new Date("2026-06-05");
      const formattedDate = today.toISOString().split("T")[0];
      setOrderDate(formattedDate);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setDeliveryDate("");
      setStatus("Pending");
      setPayment("Pending");
      setTrackingId("");
      setItems([{ productId: "", productTitle: "", productImage: "", size: "", material: "", qty: 1, price: 0, total: 0 }]);
      setAdditionalCharges(0);
      setPaidAmount(0);
    }
  }, [order]);

  // Product Selection handler
  const handleProductChange = (index: number, pId: string) => {
    const selectedProd = products.find(p => p.id === pId);
    if (!selectedProd) return;

    // Fetch enabled sizes and materials
    const sizeKeys = ["small", "medium", "large"] as const;
    const enabledSizeKeys = sizeKeys.filter(k => selectedProd.sizes[k].enabled);
    const defaultSize = enabledSizeKeys[0] || "";

    const enabledMaterials = (["wood", "acrylic", "glass"] as const).filter(k => selectedProd.materials[k]);
    const defaultMat = enabledMaterials[0] || "";

    // Calculate initial price
    let initialPrice = 0;
    if (selectedProd.enableSizes && selectedProd.enableMaterials && defaultSize && defaultMat) {
      initialPrice = parseFloat(selectedProd.pricingMatrix[defaultSize]?.[defaultMat] || "0");
    } else if (selectedProd.enableSizes && defaultSize) {
      initialPrice = parseFloat(selectedProd.sizePrices[defaultSize] || "0");
    } else if (selectedProd.enableMaterials && defaultMat) {
      initialPrice = parseFloat(selectedProd.materialPrices[defaultMat] || "0");
    } else {
      initialPrice = parseFloat(selectedProd.basePrice || "0");
    }

    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        productId: pId,
        productTitle: selectedProd.title,
        productImage: selectedProd.image,
        size: defaultSize,
        material: defaultMat,
        price: isNaN(initialPrice) ? 0 : initialPrice,
        total: (isNaN(initialPrice) ? 0 : initialPrice) * item.qty
      };
    }));
  };

  // Size selection handler
  const handleSizeChange = (index: number, newSize: "small" | "medium" | "large") => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const selectedProd = products.find(p => p.id === item.productId);
      if (!selectedProd) return item;

      let newPrice = item.price;
      if (selectedProd.enableSizes && selectedProd.enableMaterials && item.material) {
        newPrice = parseFloat(selectedProd.pricingMatrix[newSize]?.[item.material] || "0");
      } else if (selectedProd.enableSizes) {
        newPrice = parseFloat(selectedProd.sizePrices[newSize] || "0");
      }

      return {
        ...item,
        size: newSize,
        price: isNaN(newPrice) ? 0 : newPrice,
        total: (isNaN(newPrice) ? 0 : newPrice) * item.qty
      };
    }));
  };

  // Material selection handler
  const handleMaterialChange = (index: number, newMat: "wood" | "acrylic" | "glass") => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const selectedProd = products.find(p => p.id === item.productId);
      if (!selectedProd) return item;

      let newPrice = item.price;
      if (selectedProd.enableSizes && selectedProd.enableMaterials && item.size) {
        newPrice = parseFloat(selectedProd.pricingMatrix[item.size]?.[newMat] || "0");
      } else if (selectedProd.enableMaterials) {
        newPrice = parseFloat(selectedProd.materialPrices[newMat] || "0");
      }

      return {
        ...item,
        material: newMat,
        price: isNaN(newPrice) ? 0 : newPrice,
        total: (isNaN(newPrice) ? 0 : newPrice) * item.qty
      };
    }));
  };

  // Quantity change handler
  const handleQtyChange = (index: number, qtyVal: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        qty: qtyVal,
        total: item.price * qtyVal
      };
    }));
  };

  // Manual Price override handler
  const handlePriceChange = (index: number, priceVal: number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        price: priceVal,
        total: priceVal * item.qty
      };
    }));
  };

  // Row operations
  const handleAddRow = () => {
    setItems(prev => [
      ...prev,
      { productId: "", productTitle: "", productImage: "", size: "", material: "", qty: 1, price: 0, total: 0 }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Live total calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalBillAmount = itemsSubtotal + additionalCharges;
  const pendingBillAmount = Math.max(0, totalBillAmount - paidAmount);

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Customer Name is required.");
      return;
    }

    const unselectedItem = items.some(item => !item.productId);
    if (unselectedItem) {
      alert("Please select a product for all rows.");
      return;
    }

    let generatedId = "";
    if (order) {
      generatedId = order.id;
    } else {
      let maxNum = 999;
      if (orders && orders.length > 0) {
        orders.forEach((o) => {
          const match = o.id.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        });
      }
      generatedId = `FD-${maxNum + 1}`;
    }

    const finalOrder: Order = {
      id: generatedId,
      customerName,
      customerPhone,
      customerAddress,
      orderDate,
      deliveryDate: deliveryDate || undefined,
      status,
      payment,
      trackingId: trackingId || "",
      items,
      subtotal: itemsSubtotal,
      additionalCharges,
      grandTotal: totalBillAmount,
      paidAmount,
      pendingAmount: pendingBillAmount
    };

    onSave(finalOrder);
  };

  return (
    <div className="order-modal-backdrop">
      <motion.div 
        className="order-modal-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modal Header */}
        <div className="order-modal-header">
          <h2>{order ? "Edit Order details" : "Create New Order"}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body form */}
        <form onSubmit={handleSubmit} className="order-modal-body">
          <div className="form-sections-scroller">
            
            {/* 1. Customer details */}
            <div className="form-block-card">
              <h3 className="form-block-title">Customer Information</h3>
              <div className="form-fields-grid">
                <div className="form-input-wrapper">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer full name"
                    required
                  />
                </div>

                <div className="form-input-wrapper">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className="form-input-wrapper span-2">
                  <label>Delivery Address</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Enter shipping address with pin code"
                  />
                </div>
              </div>
            </div>

            {/* 2. Order parameters */}
            <div className="form-block-card">
              <h3 className="form-block-title">Dates & Parameters</h3>
              <div className="form-fields-grid">
                <div className="form-input-wrapper">
                  <label>Order Date *</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-input-wrapper">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="form-input-wrapper">
                  <label>Order Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="form-input-wrapper">
                  <label>Payment Status</label>
                  <select value={payment} onChange={(e) => setPayment(e.target.value as any)}>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-input-wrapper span-2">
                  <label>Logistics Tracking ID</label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter tracking code / AWB number"
                  />
                </div>
              </div>
            </div>

            {/* 3. Dynamic Product selections */}
            <div className="form-block-card">
              <div className="form-row-header-actions">
                <h3 className="form-block-title">Items & Pricing</h3>
                <button 
                  type="button" 
                  className="btn-add-item-row"
                  onClick={handleAddRow}
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="items-list-container">
                {items.map((item, index) => {
                  const currentProd = products.find(p => p.id === item.productId);
                  const enabledSizes = currentProd && currentProd.enableSizes 
                    ? (["small", "medium", "large"] as const).filter(k => currentProd.sizes[k].enabled)
                    : [];
                  const enabledMats = currentProd && currentProd.enableMaterials
                    ? (["wood", "acrylic", "glass"] as const).filter(k => currentProd.materials[k])
                    : [];

                  return (
                    <div key={index} className="form-item-row">
                      
                      {/* Product select dropdown */}
                      <div className="row-input product-select-box">
                        <label>Product *</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          required
                        >
                          <option value="">Choose Catalog Item</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size select dropdown */}
                      <div className="row-input size-select-box">
                        <label>Size</label>
                        <select
                          value={item.size}
                          onChange={(e) => handleSizeChange(index, e.target.value as any)}
                          disabled={!item.productId || enabledSizes.length === 0}
                        >
                          {!item.productId && <option value="">—</option>}
                          {item.productId && enabledSizes.length === 0 && <option value="">None</option>}
                          {enabledSizes.map(sz => (
                            <option key={sz} value={sz}>{sz.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {/* Material select dropdown */}
                      <div className="row-input mat-select-box">
                        <label>Material</label>
                        <select
                          value={item.material}
                          onChange={(e) => handleMaterialChange(index, e.target.value as any)}
                          disabled={!item.productId || enabledMats.length === 0}
                        >
                          {!item.productId && <option value="">—</option>}
                          {item.productId && enabledMats.length === 0 && <option value="">None</option>}
                          {enabledMats.map(mat => {
                            const label = mat === "wood" ? "Wood" : mat.charAt(0).toUpperCase() + mat.slice(1);
                            return <option key={mat} value={mat}>{label}</option>;
                          })}
                        </select>
                      </div>

                      {/* Qty input */}
                      <div className="row-input qty-input-box">
                        <label>Qty</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleQtyChange(index, Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          required
                        />
                      </div>

                      {/* Price input (editable) */}
                      <div className="row-input price-input-box">
                        <label>Price (₹)</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePriceChange(index, Math.max(0, parseFloat(e.target.value) || 0))}
                          min="0"
                          required
                        />
                      </div>

                      {/* Item Total display */}
                      <div className="row-total-display">
                        <span className="row-total-label">Total</span>
                        <span className="row-total-val">₹{item.total}</span>
                      </div>

                      {/* Delete row button */}
                      <button
                        type="button"
                        className="btn-remove-item-row"
                        onClick={() => handleRemoveRow(index)}
                        disabled={items.length <= 1}
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Financial computations */}
            <div className="form-block-card">
              <h3 className="form-block-title">Billing summary</h3>
              <div className="form-fields-grid">
                <div className="form-input-wrapper">
                  <label>Additional Charges (Tax/Logistics)</label>
                  <input
                    type="number"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    placeholder="₹0"
                  />
                </div>

                <div className="form-input-wrapper">
                  <label>Paid Amount</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                    placeholder="₹0"
                  />
                </div>

                <div className="summary-billing-values-overlay">
                  <div className="summary-val-row">
                    <span className="val-lbl">Subtotal</span>
                    <span className="val-num">₹{itemsSubtotal}</span>
                  </div>
                  <div className="summary-val-row">
                    <span className="val-lbl">Grand Total</span>
                    <span className="val-num">₹{totalBillAmount}</span>
                  </div>
                  <div className="summary-val-row pending">
                    <span className="val-lbl">Pending Balance</span>
                    <span className="val-num text-red">₹{pendingBillAmount}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Sticky Actions Footer */}
          <div className="order-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-green">
              {order ? "Update Order Details" : "Create Order"}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}

// Custom confirmation dialog for delete operation with animations
interface DeleteConfirmModalProps {
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ orderId, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="delete-modal-backdrop" onClick={onClose}>
      <motion.div 
        className="delete-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-icon-wrapper">
          <motion.div 
            className="delete-modal-icon-pulsing"
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.8, 
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="delete-modal-icon"
            initial={{ rotate: -15 }}
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          >
            <Trash2 size={24} />
          </motion.div>
        </div>

        <h3 className="delete-modal-title">Delete Order</h3>
        <p className="delete-modal-question">Are you sure you want to delete this order?</p>
        <p className="delete-modal-subtext">
          Order <span className="delete-order-id">{orderId}</span> will be permanently removed. This action cannot be undone.
        </p>

        <div className="delete-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger-filled" onClick={onConfirm}>
            Yes, Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
