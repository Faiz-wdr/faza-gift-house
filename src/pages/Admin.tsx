import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingBag, 
  Image as ImageIcon, 
  LogOut, 
  Menu, 
  X, 
  ShoppingBag as OrderIcon,
  Clock,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import AdminProducts from "../components/admin/AdminProducts";
import ProductFormModal from "../components/admin/ProductFormModal";
import ProductPreviewModal from "../components/admin/ProductPreviewModal";
import type { AdminProduct } from "../components/admin/ProductPreviewModal";
import AdminOrders from "../components/admin/AdminOrders";
import type { Order } from "../components/admin/AdminOrders";
import AdminAdBanner from "../components/admin/AdminAdBanner";
import { authService } from "../services/authService";
import { productService } from "../services/productService";
import { orderService } from "../services/orderService";
import "./Admin.css";

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Products collection state
  const [products, setProducts] = useState<AdminProduct[]>([]);

  // Orders list state
  const [orders, setOrders] = useState<Order[]>([]);

  // Database Connection Status
  const [dbConnected, setDbConnected] = useState(true);
  const [lastPingTime, setLastPingTime] = useState("");

  // Modal toggle states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

  const [authChecked, setAuthChecked] = useState(false);

  // Authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (!u) {
          navigate("/login", { replace: true });
        } else {
          setAuthChecked(true);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
        navigate("/login", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch real data from Supabase
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [prodsData, ordsData] = await Promise.all([
        productService.getProducts(),
        orderService.getOrders()
      ]);
      setProducts(prodsData);
      setOrders(ordsData);
      setDbConnected(true);
      setLastPingTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
      setDbConnected(false);
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
      const ords = await orderService.getOrders();
      setOrders(ords);
    } catch (e) {
      alert("Failed to save order in database.");
      console.error(e);
    }
  };

  const handleEditOrder = async (updatedOrder: Order) => {
    try {
      await orderService.saveOrder(updatedOrder);
      const ords = await orderService.getOrders();
      setOrders(ords);
    } catch (e) {
      alert("Failed to update order in database.");
      console.error(e);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      alert("Failed to delete order from database.");
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  if (!authChecked) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
  const totalOrdersCount = orders.length;
  const inProgressCount = orders.filter(o => o.status === "In Progress").length;
  const pendingPaymentsCount = orders.filter(o => o.payment === "Pending" || o.payment === "Partial").length;
  const completedOrdersCount = orders.filter(o => o.status === "Delivered").length;

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

  return (
    <div className="admin-layout">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "drawer-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            Faza <span>Gift House</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-category">Overview</div>
          <button 
            className={`menu-item ${activeMenu === "Dashboard" ? "active" : ""}`}
            onClick={() => { setActiveMenu("Dashboard"); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span className="menu-text">Dashboard</span>
          </button>

          <div className="sidebar-category">Store Management</div>
          <button 
            className={`menu-item ${activeMenu === "Products" ? "active" : ""}`}
            onClick={() => { setActiveMenu("Products"); setMobileMenuOpen(false); }}
          >
            <Boxes size={20} />
            <span className="menu-text">Products</span>
          </button>

          <button 
            className={`menu-item ${activeMenu === "Orders" ? "active" : ""}`}
            onClick={() => { setActiveMenu("Orders"); setMobileMenuOpen(false); }}
          >
            <ShoppingBag size={20} />
            <span className="menu-text">Orders</span>
          </button>

          <div className="sidebar-category">Settings</div>
          <button 
            className={`menu-item ${activeMenu === "AdBanner" ? "active" : ""}`}
            onClick={() => { setActiveMenu("AdBanner"); setMobileMenuOpen(false); }}
          >
            <ImageIcon size={20} />
            <span className="menu-text">Ad Banner</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="db-status-indicator">
            <div className="status-dot-row">
              <span className={`status-dot ${dbConnected ? "active" : "error"}`}></span>
              <span className="status-label">
                {dbConnected ? "Supabase Connected" : "Connection Error"}
              </span>
            </div>
            {lastPingTime && (
              <span className="last-ping-lbl">
                Last Active check: {lastPingTime}
              </span>
            )}
          </div>
          <button className="menu-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span className="menu-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Blurred overlay for mobile sidebar drawer */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* 2. RIGHT MAIN CONTENT */}
      <div className="admin-main">
        {/* Top Header Row */}
        <header className="admin-header">
          <div className="header-left">
            {/* Hamburger trigger for mobile */}
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Open Menu">
              <Menu size={22} />
            </button>
            <h1 className="admin-page-title">{activeMenu}</h1>
          </div>
          <div className="header-right">
            <div className="admin-profile">
              <span className="admin-name">Administrator</span>
              <div className="admin-avatar">A</div>
            </div>
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

                {/* Recent Orders Table */}
                <motion.div className="recent-orders-container" variants={fadeInUp}>
                  <div className="container-header">
                    <h3>Recent Orders</h3>
                    <div className="table-badge">Latest Activity</div>
                  </div>

                  <div className="table-responsive">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer Name</th>
                          <th>Product</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => {
                          const productsText = order.items.map(i => i.productTitle).join(", ");
                          return (
                            <tr key={order.id}>
                              <td className="col-id">{order.id}</td>
                              <td className="col-customer">{order.customerName}</td>
                              <td className="col-product" title={productsText}>{productsText}</td>
                              <td>
                                <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                <span className={`payment-text ${order.payment.toLowerCase()}`}>
                                  {order.payment}
                                </span>
                              </td>
                              <td className="col-date">{order.orderDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* CONDITIONAL RENDER: PRODUCTS CATALOG VIEW */}
            {activeMenu === "Products" && (
              <div className="dashboard-content">
                <AdminProducts
                  products={products}
                  onAddClick={handleAddClick}
                  onEditClick={handleEditClick}
                  onPreviewClick={handlePreviewClick}
                  onDeleteClick={handleDeleteClick}
                  onBulkUpload={handleBulkUpload}
                />
              </div>
            )}

            {/* CONDITIONAL RENDER: ORDERS VIEW */}
            {activeMenu === "Orders" && (
              <div className="dashboard-content">
                <AdminOrders
                  orders={orders}
                  products={products}
                  onAddOrder={handleAddOrder}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleDeleteOrder}
                />
              </div>
            )}

            {/* CONDITIONAL RENDER: AD BANNER VIEW */}
            {activeMenu === "AdBanner" && (
              <div className="dashboard-content">
                <AdminAdBanner />
              </div>
            )}
          </div>
        )}
      </div>

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
