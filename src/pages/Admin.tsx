import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingBag, 
  Image as ImageIcon, 
  LogOut, 
  ShoppingBag as OrderIcon,
  Clock,
  CreditCard,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  Plus
} from "lucide-react";
import AdminProducts from "../components/admin/AdminProducts";
import ProductFormModal from "../components/admin/ProductFormModal";
import ProductPreviewModal from "../components/admin/ProductPreviewModal";
import type { AdminProduct } from "../components/admin/ProductPreviewModal";
import AdminOrders from "../components/admin/AdminOrders";
import type { Order } from "../components/admin/AdminOrders";
import AdminAdBanner from "../components/admin/AdminAdBanner";
import AdminFinance from "../components/admin/AdminFinance";
import { authService } from "../services/authService";
import { productService } from "../services/productService";
import { orderService } from "../services/orderService";
import { financeService } from "../services/financeService";
import type { FinanceTransaction } from "../services/financeService";
import ErrorBoundary from "../components/ErrorBoundary";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Products collection state
  const [products, setProducts] = useState<AdminProduct[]>([]);

  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);

  // Finance transactions state for dashboard payments
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);

  // Modal toggle states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

  const [authChecked, setAuthChecked] = useState(false);

  // Authentication check on mount
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      // 1. Instant check for local session first to eliminate delay
      const localSess = localStorage.getItem("faza_local_session");
      if (localSess) {
        if (isMounted) setAuthChecked(true);
        return;
      }

      // 2. Query Supabase auth with safety handling
      try {
        const u = await authService.getCurrentUser();
        if (!isMounted) return;
        if (!u) {
          // If running locally, automatically provide local admin session so user is never locked out
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            const devUser = {
              id: "local-admin",
              email: "faza@fazagifthouse.com",
              role: "authenticated",
              user_metadata: { name: "Faza Admin" }
            };
            localStorage.setItem("faza_local_session", JSON.stringify(devUser));
            setAuthChecked(true);
            return;
          }
          // In production without active session, redirect to login
          navigate("/login", { replace: true });
        } else {
          setAuthChecked(true);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
        if (isMounted) {
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            setAuthChecked(true);
          } else {
            navigate("/login", { replace: true });
          }
        }
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Fetch real data from Supabase
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [prodsData, ordsData, finData] = await Promise.all([
        productService.getProducts(),
        orderService.getOrders(),
        financeService.getTransactions().catch(() => [])
      ]);
      setProducts(prodsData || []);
      setOrders(ordsData || []);
      setFinanceTransactions(finData || []);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      loadDashboardData();
    }
  }, [authChecked]);

  // Order actions
  const handleAddOrder = async (newOrder: Order) => {
    try {
      await orderService.saveOrder(newOrder);
    } catch (e) {
      console.warn("Order save notice:", e);
    }
    const ords = await orderService.getOrders();
    setOrders(ords && ords.length > 0 ? ords : (prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
  };

  const handleEditOrder = async (updatedOrder: Order) => {
    try {
      await orderService.saveOrder(updatedOrder);
    } catch (e) {
      console.warn("Order update notice:", e);
    }
    const ords = await orderService.getOrders();
    setOrders(ords && ords.length > 0 ? ords : (prev) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
    } catch (e) {
      console.warn("Order delete notice:", e);
    }
    setOrders(prev => prev.filter(o => o && o.id !== id));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      navigate("/login");
    }
  };

  // Add Product Click
  const handleAddClick = () => {
    setSelectedProduct(null);
    setFormModalOpen(true);
  };

  // Edit Product Click
  const handleEditClick = (product: AdminProduct) => {
    setSelectedProduct(product);
    setFormModalOpen(true);
  };

  // Preview Product Click
  const handlePreviewClick = (product: AdminProduct) => {
    setSelectedProduct(product);
    setPreviewModalOpen(true);
  };

  // Delete Product Click
  const handleDeleteClick = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete the product with ID ${id}?`)) {
      try {
        await productService.deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (e) {
        alert("Failed to delete product from database.");
        console.error(e);
      }
    }
  };

  // Save Add/Edit handler
  const handleSaveProduct = async (savedProduct: AdminProduct) => {
    try {
      await productService.saveProduct(savedProduct);
      const prods = await productService.getProducts();
      setProducts(prods);
      setFormModalOpen(false);
      setSelectedProduct(null);
    } catch (e) {
      alert("Failed to save product in database.");
      console.error(e);
    }
  };

  // Bulk CSV Upload handler
  const handleBulkUpload = async (parsedProducts: AdminProduct[]) => {
    try {
      setLoading(true);
      for (const prod of parsedProducts) {
        await productService.saveProduct(prod);
      }
      await loadDashboardData();
    } catch (e) {
      alert("Failed to save some products during bulk upload.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate featured products count
  const featuredCount = products.filter((p) => p.featured).length;

  // Calculate dynamic dashboard stats from orders list
  const safeOrdersList = Array.isArray(orders) ? orders : [];
  const totalOrdersCount = safeOrdersList.length;
  const inProgressCount = safeOrdersList.filter(o => o && o.status === "In Progress").length;
  const pendingPaymentsCount = safeOrdersList.filter(o => o && (o.payment === "Pending" || o.payment === "Partial")).length;
  const completedOrdersCount = safeOrdersList.filter(o => o && o.status === "Delivered").length;

  // Combine orders with payments and manual income for Recent Payments on Dashboard
  const recentPayments = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeFinance = Array.isArray(financeTransactions) ? financeTransactions : [];

    // 1. Order-based payments
    const orderPayments = safeOrders
      .filter((o) => o && (o.payment === "Paid" || Number(o.paidAmount) > 0))
      .map((o) => {
        const grand = Number(o.grandTotal) || 0;
        const paid = Number(o.paidAmount) || 0;
        const amount = paid > 0 ? paid : grand;
        return {
          id: `ord-pmt-${o.id || Math.random()}`,
          reference: o.id || "Order",
          customerName: o.customerName || "Customer",
          amount: Math.max(0, amount),
          status: o.payment || "Paid",
          method: "Order Bill",
          date: o.orderDate || new Date().toISOString().split("T")[0],
          isOrder: true,
        };
      });

    // 2. Manual finance income transactions
    const manualIncome = safeFinance
      .filter((t) => t && t.type === "income")
      .map((t) => {
        const idStr = String(t.id || "");
        const shortId = idStr.length > 6 ? idStr.slice(0, 6) : (idStr || "TX");
        return {
          id: `fin-pmt-${idStr || Math.random()}`,
          reference: t.order_id || `TX-${shortId}`,
          customerName: t.description || "Direct Payment",
          amount: Math.max(0, Number(t.amount) || 0),
          status: "Paid" as const,
          method: t.payment_method || "Bank Account",
          date: t.date || new Date().toISOString().split("T")[0],
          isOrder: !!t.order_id,
        };
      });

    return [...orderPayments, ...manualIncome]
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      })
      .slice(0, 5);
  }, [orders, financeTransactions]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  if (!authChecked) {
    return (
      <div 
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#FAF6F8",
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div 
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "#7D044B",
            marginBottom: "1.2rem"
          }}
        >
          Faza <span style={{ color: "#C99635" }}>Gift House</span>
        </div>
        <div className="loading-spinner" style={{ marginBottom: "1rem" }}></div>
        <p style={{ color: "#63585E", fontSize: "0.92rem", fontWeight: 500 }}>
          Loading Admin Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* 1. LEFT SIDEBAR (Desktop) */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            Faza <span>Gift House</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`menu-item ${activeMenu === "Dashboard" ? "active" : ""}`}
            onClick={() => setActiveMenu("Dashboard")}
          >
            <LayoutDashboard size={20} />
            <span className="menu-text">Dashboard</span>
          </button>

          <button 
            className={`menu-item ${activeMenu === "Products" ? "active" : ""}`}
            onClick={() => setActiveMenu("Products")}
          >
            <Boxes size={20} />
            <span className="menu-text">Products</span>
          </button>

          <button 
            className={`menu-item ${activeMenu === "Orders" ? "active" : ""}`}
            onClick={() => setActiveMenu("Orders")}
          >
            <ShoppingBag size={20} />
            <span className="menu-text">Orders</span>
          </button>

          <button 
            className={`menu-item ${activeMenu === "Finance" ? "active" : ""}`}
            onClick={() => setActiveMenu("Finance")}
          >
            <Wallet size={20} />
            <span className="menu-text">Finance</span>
          </button>

          <button 
            className={`menu-item ${activeMenu === "AdBanner" ? "active" : ""}`}
            onClick={() => setActiveMenu("AdBanner")}
          >
            <ImageIcon size={20} />
            <span className="menu-text">Ad Banner</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="menu-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span className="menu-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT */}
      <div className="admin-main">
        {/* Top Header Row */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="admin-page-title desktop-only-title">{activeMenu}</h1>
            <div className="admin-mobile-brand">
              Faza <span>Gift House</span>
            </div>
          </div>
          <div className="header-right">
            <div className="admin-profile desktop-only-profile">
              <span className="admin-name">Faza Admin</span>
            </div>
            <button 
              className="admin-mobile-logout-btn admin-header-logout-btn" 
              onClick={handleLogout} 
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="dashboard-view-wrapper">
            {/* CONDITIONAL RENDER: DASHBOARD VIEW */}
            {activeMenu === "Dashboard" && (
              <motion.div 
                className="dashboard-content"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {/* Uniform Section Header */}
                <div className="admin-section-header">
                  <div className="section-header-info">
                    <h2 className="section-header-title">Dashboard</h2>
                  </div>
                </div>

                {/* Stats row cards */}
                <motion.div className="stats-row" variants={fadeInUp}>
                  <div className="stat-card">
                    <div className="stat-card-icon blue">
                      <OrderIcon size={22} />
                    </div>
                    <div className="stat-card-details">
                      <span className="stat-label">Total Orders</span>
                      <h2 className="stat-number">{totalOrdersCount}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon amber">
                      <Clock size={22} />
                    </div>
                    <div className="stat-card-details">
                      <span className="stat-label">In Progress</span>
                      <h2 className="stat-number">{inProgressCount}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon red">
                      <CreditCard size={22} />
                    </div>
                    <div className="stat-card-details">
                      <span className="stat-label">Pending Payments</span>
                      <h2 className="stat-number">{pendingPaymentsCount}</h2>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-icon green">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="stat-card-details">
                      <span className="stat-label">Completed Orders</span>
                      <h2 className="stat-number">{completedOrdersCount}</h2>
                    </div>
                  </div>
                </motion.div>

                {/* Side-by-Side: Recent Orders & Recent Payments */}
                <div className="dashboard-tables-grid">
                  {/* 1. Recent Orders Table */}
                  <motion.div className="recent-orders-container" variants={fadeInUp}>
                    <div className="container-header">
                      <h3>Recent Orders</h3>
                      <button
                        type="button"
                        className="btn-dashboard-view-all"
                        onClick={() => setActiveMenu("Orders")}
                        title="View all records in Orders section"
                      >
                        <span>View in Orders</span>
                        <ArrowUpRight size={15} />
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(orders || []).slice(0, 5).map((order) => {
                            if (!order) return null;
                            const productsText = (order.items || []).map(i => i?.productTitle || "").filter(Boolean).join(", ") || "Order items";
                            const statusStr = String(order.status || "Pending");
                            const paymentStr = String(order.payment || "Pending");
                            return (
                              <tr key={order.id || Math.random()}>
                                <td className="col-id">{order.id || "ORD"}</td>
                                <td className="col-customer" title={order.customerName || "Customer"}>{order.customerName || "Customer"}</td>
                                <td className="col-product" title={productsText}>{productsText}</td>
                                <td>
                                  <span className={`status-badge ${statusStr.toLowerCase().replace(/\s+/g, "-")}`}>
                                    {statusStr}
                                  </span>
                                </td>
                                <td>
                                  <span className={`payment-text ${paymentStr.toLowerCase()}`}>
                                    {paymentStr}
                                  </span>
                                </td>
                                <td className="col-date">{order.orderDate || ""}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* 2. Recent Payments Table */}
                  <motion.div className="recent-orders-container" variants={fadeInUp}>
                    <div className="container-header">
                      <h3>Recent Payments</h3>
                      <button
                        type="button"
                        className="btn-dashboard-view-all"
                        onClick={() => setActiveMenu("Finance")}
                        title="View all records in Finance section"
                      >
                        <span>View in Finance</span>
                        <ArrowUpRight size={15} />
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Method</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPayments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="empty-table-cell">
                                <div className="empty-payments-state">
                                  <CreditCard size={28} className="empty-payments-icon" />
                                  <p>No payments recorded yet</p>
                                  <span>Mark orders as Paid in Orders or record Income in Finance.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            recentPayments.map((pmt) => {
                              if (!pmt) return null;
                              const statusStr = String(pmt.status || "Paid");
                              return (
                                <tr key={pmt.id || Math.random()}>
                                  <td className="col-id">
                                    {pmt.isOrder ? (
                                      <span 
                                        style={{ cursor: "pointer", textDecoration: "underline" }}
                                        onClick={() => setActiveMenu("Orders")}
                                        title="Click to view order in Orders tab"
                                      >
                                        {pmt.reference || "Order"}
                                      </span>
                                    ) : (
                                      <span>{pmt.reference || "Payment"}</span>
                                    )}
                                  </td>
                                  <td className="col-customer" title={pmt.customerName || "Customer"}>{pmt.customerName || "Customer"}</td>
                                  <td className="payment-amount-cell">
                                    +₹{(Number(pmt.amount) || 0).toLocaleString("en-IN")}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${statusStr === "Paid" ? "completed" : "pending"}`}>
                                      {statusStr}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="method-tag">{pmt.method || "Bank Account"}</span>
                                  </td>
                                  <td className="col-date">{pmt.date || ""}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>

                {/* Mobile Floating Action Button on Dashboard */}
                <button
                  type="button"
                  className="admin-fab-btn admin-fab-primary"
                  onClick={() => setActiveMenu("Orders")}
                  aria-label="Add Order"
                >
                  <Plus size={18} strokeWidth={2.4} />
                  <span>Add Order</span>
                </button>
              </motion.div>
            )}

            {/* CONDITIONAL RENDER: PRODUCTS CATALOG VIEW */}
            {activeMenu === "Products" && (
              <div className="dashboard-content">
                <ErrorBoundary fallbackTitle="Error loading Products catalog">
                  <AdminProducts
                    products={products}
                    onAddClick={handleAddClick}
                    onEditClick={handleEditClick}
                    onPreviewClick={handlePreviewClick}
                    onDeleteClick={handleDeleteClick}
                    onBulkUpload={handleBulkUpload}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* CONDITIONAL RENDER: ORDERS VIEW */}
            {activeMenu === "Orders" && (
              <div className="dashboard-content">
                <ErrorBoundary fallbackTitle="Error loading Orders section">
                  <AdminOrders
                    orders={orders}
                    products={products}
                    onAddOrder={handleAddOrder}
                    onEditOrder={handleEditOrder}
                    onDeleteOrder={handleDeleteOrder}
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* CONDITIONAL RENDER: FINANCE VIEW */}
            {activeMenu === "Finance" && (
              <div className="dashboard-content">
                <ErrorBoundary fallbackTitle="Error loading Finance section">
                  <AdminFinance orders={orders} />
                </ErrorBoundary>
              </div>
            )}

            {/* CONDITIONAL RENDER: AD BANNER VIEW */}
            {activeMenu === "AdBanner" && (
              <div className="dashboard-content">
                <ErrorBoundary fallbackTitle="Error loading Ad Banner section">
                  <AdminAdBanner />
                </ErrorBoundary>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="admin-bottom-nav" aria-label="Mobile Navigation">
        <button 
          type="button"
          className={`admin-bottom-nav-item ${activeMenu === "Dashboard" ? "active" : ""}`}
          onClick={() => setActiveMenu("Dashboard")}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>

        <button 
          type="button"
          className={`admin-bottom-nav-item ${activeMenu === "Products" ? "active" : ""}`}
          onClick={() => setActiveMenu("Products")}
        >
          <Boxes size={20} />
          <span>Products</span>
        </button>

        <button 
          type="button"
          className={`admin-bottom-nav-item ${activeMenu === "Orders" ? "active" : ""}`}
          onClick={() => setActiveMenu("Orders")}
        >
          <ShoppingBag size={20} />
          <span>Orders</span>
        </button>

        <button 
          type="button"
          className={`admin-bottom-nav-item ${activeMenu === "Finance" ? "active" : ""}`}
          onClick={() => setActiveMenu("Finance")}
        >
          <Wallet size={20} />
          <span>Finance</span>
        </button>

        <button 
          type="button"
          className={`admin-bottom-nav-item ${activeMenu === "AdBanner" ? "active" : ""}`}
          onClick={() => setActiveMenu("AdBanner")}
        >
          <ImageIcon size={20} />
          <span>Ad Banner</span>
        </button>
      </nav>

      {/* 3. MODALS ATTACHMENTS */}
      <ProductFormModal
        product={selectedProduct}
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setSelectedProduct(null); }}
        onSave={handleSaveProduct}
        currentFeaturedCount={featuredCount}
      />

      {selectedProduct && (
        <ProductPreviewModal
          product={selectedProduct}
          isOpen={previewModalOpen}
          onClose={() => { setPreviewModalOpen(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
}
