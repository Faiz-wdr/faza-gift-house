import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeft,
  Search,
  X, 
  Calendar, 
  Check,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Order } from "./AdminOrders";
import { 
  financeService, 
  getCachedCategories, 
  saveCachedCategory, 
  deleteCachedCategory, 
  type FinanceTransaction 
} from "../../services/financeService";
import "./AdminFinance.css";

interface AdminFinanceProps {
  orders: Order[];
}

interface MergedTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  category?: string;
  paymentMethod?: string;
  orderId?: string | null;
  isOrderLinked?: boolean;
}

export default function AdminFinance({ orders }: AdminFinanceProps) {
  // 1. Month state (defaults to current month)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // 2. Manual transactions state
  const [manualTransactions, setManualTransactions] = useState<FinanceTransaction[]>([]);

  // 3. Modal states
  const [modalType, setModalType] = useState<"income" | "expense" | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form input fields
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Bank Account");

  // Category autocomplete & saved suggestions
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState<boolean>(false);
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState<number>(-1);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View state: "overview" (default) or "table" (all transactions)
  const [viewMode, setViewMode] = useState<"overview" | "table">("overview");
  const [tableFilter, setTableFilter] = useState<"all" | "income" | "expense">("all");
  const [tableSearch, setTableSearch] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load manual transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await financeService.getTransactions();
        setManualTransactions(data);
      } catch (err) {
        console.error("Failed to load finance transactions:", err);
      }
    };
    fetchTransactions();
  }, []);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentDate]);

  // Current year & month string for matching: "YYYY-MM"
  const currentYearMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [currentDate]);

  // Derive order-based income transactions from existing orders
  // (Only includes orders that are marked as "Paid")
  const orderIncomeTransactions: MergedTransaction[] = useMemo(() => {
    return (orders || [])
      .filter((o) => o && o.payment === "Paid" && (Number(o.paidAmount) > 0 || Number(o.grandTotal) > 0))
      .map((o) => {
        const grand = Number(o.grandTotal) || 0;
        const paid = Number(o.paidAmount) || 0;
        const amount = paid > 0 ? paid : grand;
        return {
          id: `order-income-${o.id || Math.random()}`,
          type: "income" as const,
          amount,
          date: o.orderDate || new Date().toISOString().split("T")[0],
          description: o.customerName ? `Order • ${o.customerName}` : "Order payment",
          category: "",
          paymentMethod: "Bank Account",
          orderId: o.id || "",
          isOrderLinked: true
        };
      });
  }, [orders]);

  // All merged transactions
  const allMergedTransactions: MergedTransaction[] = useMemo(() => {
    const manuals: MergedTransaction[] = manualTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      category: tx.category,
      paymentMethod: tx.payment_method,
      orderId: tx.order_id,
      isOrderLinked: false
    }));

    return [...manuals, ...orderIncomeTransactions];
  }, [manualTransactions, orderIncomeTransactions]);

  // 1. All-time / Net Totals (for Finance Overview Page)
  const netTotalIncome = useMemo(() => {
    return allMergedTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [allMergedTransactions]);

  const netTotalExpense = useMemo(() => {
    return allMergedTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [allMergedTransactions]);

  const netProfitOrLoss = netTotalIncome - netTotalExpense;
  const isNetProfit = netProfitOrLoss >= 0;

  // 2. Selected Month Totals (for Finance Table View & Comparison Graph)
  const monthlyTransactions = useMemo(() => {
    return allMergedTransactions.filter((tx) => {
      if (!tx.date) return false;
      return tx.date.startsWith(currentYearMonth);
    });
  }, [allMergedTransactions, currentYearMonth]);

  const monthlyIncome = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const monthlyExpense = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const monthlyProfitOrLoss = monthlyIncome - monthlyExpense;
  const isMonthlyProfit = monthlyProfitOrLoss >= 0;

  // Overview recent activity (latest 6 across all records)
  const overviewRecentActivities = useMemo(() => {
    return [...allMergedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [allMergedTransactions]);

  // Filtered transactions for Table View
  const filteredTableTransactions = useMemo(() => {
    let list = [...monthlyTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (tableFilter !== "all") {
      list = list.filter((t) => t.type === tableFilter);
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q)) ||
          String(t.amount).includes(q)
      );
    }

    return list;
  }, [monthlyTransactions, tableFilter, tableSearch]);

  // Monthly Comparison Data (8 consecutive months ending with selected month)
  const monthlyComparisonData = useMemo(() => {
    const list: Array<{
      date: Date;
      key: string;
      shortLabel: string;
      yearLabel: string;
      income: number;
      expense: number;
      isSelected: boolean;
    }> = [];

    // 8 months so user sees 4 in view and can scroll back for 4 earlier ones
    for (let i = 7; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;

      const income = allMergedTransactions
        .filter((tx) => tx.type === "income" && tx.date?.startsWith(key))
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expense = allMergedTransactions
        .filter((tx) => tx.type === "expense" && tx.date?.startsWith(key))
        .reduce((sum, tx) => sum + tx.amount, 0);

      list.push({
        date: d,
        key,
        shortLabel: d.toLocaleDateString("en-US", { month: "short" }),
        yearLabel: String(y),
        income,
        expense,
        isSelected: key === currentYearMonth,
      });
    }

    return list;
  }, [allMergedTransactions, currentDate, currentYearMonth]);

  const maxMonthlyValue = useMemo(() => {
    const allVals = monthlyComparisonData.flatMap((m) => [m.income, m.expense]);
    const maxVal = Math.max(...allVals, 0);
    return maxVal > 0 ? maxVal : 1000;
  }, [monthlyComparisonData]);

  // Comparison with previous month
  const monthOverMonthChange = useMemo(() => {
    const activeIdx = monthlyComparisonData.findIndex((m) => m.isSelected);
    if (activeIdx > 0) {
      const prevIncome = monthlyComparisonData[activeIdx - 1].income;
      if (prevIncome > 0) {
        const pct = Math.round(((monthlyIncome - prevIncome) / prevIncome) * 100);
        return { pct, prevLabel: monthlyComparisonData[activeIdx - 1].shortLabel };
      }
    }
    return null;
  }, [monthlyComparisonData, monthlyIncome]);

  // Chart scroll container ref - auto scroll to rightmost (latest) month
  const chartScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [monthlyComparisonData, currentYearMonth]);

  // Close category suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategorySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open modal handlers
  const handleOpenAdd = (type: "income" | "expense") => {
    setModalType(type);
    setEditingTransaction(null);
    setFormAmount("");
    // Default date to today's date formatted or current month's 1st
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const isCurrentCalendarMonth = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth();
    setFormDate(isCurrentCalendarMonth ? todayStr : `${currentYearMonth}-01`);
    setFormCategory("");
    setFormPaymentMethod("Bank Account");
    setShowCategorySuggestions(false);
    setCategoryToDelete(null);
    const cats = getCachedCategories(type);
    setSavedCategories(cats);
    setFilteredCategories(cats);
  };

  const handleOpenEdit = (tx: MergedTransaction) => {
    if (tx.isOrderLinked) return;
    const original = manualTransactions.find((m) => m.id === tx.id);
    if (!original) return;

    setEditingTransaction(original);
    setModalType(original.type);
    setFormAmount(original.amount.toString());
    setFormDate(original.date);
    setFormCategory(original.category || original.description || "");
    setFormPaymentMethod(original.payment_method || "Bank Account");
    setShowCategorySuggestions(false);
    setCategoryToDelete(null);
    const cats = getCachedCategories(original.type);
    setSavedCategories(cats);
    setFilteredCategories(cats);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setEditingTransaction(null);
    setShowCategorySuggestions(false);
    setCategoryToDelete(null);
  };

  // Category change handler with live search suggestions
  const handleCategoryChange = (val: string) => {
    setFormCategory(val);
    const currentCats = savedCategories.length > 0 ? savedCategories : getCachedCategories(modalType || "income");
    if (val.trim().length > 0) {
      const q = val.trim().toLowerCase();
      const matches = currentCats.filter((c) => c.toLowerCase().includes(q));
      setFilteredCategories(matches);
      setShowCategorySuggestions(matches.length > 0);
      setHighlightedCategoryIndex(-1);
    } else {
      setFilteredCategories(currentCats);
      setShowCategorySuggestions(currentCats.length > 0);
    }
  };

  const handleCategoryFocus = () => {
    const cats = getCachedCategories(modalType || "income");
    setSavedCategories(cats);
    if (formCategory.trim().length > 0) {
      const q = formCategory.trim().toLowerCase();
      const matches = cats.filter((c) => c.toLowerCase().includes(q));
      setFilteredCategories(matches);
      setShowCategorySuggestions(matches.length > 0);
    } else {
      setFilteredCategories(cats);
      setShowCategorySuggestions(cats.length > 0);
    }
  };

  const handleSelectCategory = (catName: string) => {
    setFormCategory(catName);
    setShowCategorySuggestions(false);
    setHighlightedCategoryIndex(-1);
  };

  const handleDeleteCategoryClick = (e: React.MouseEvent, catName: string) => {
    e.stopPropagation();
    setCategoryToDelete(catName);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete;
    deleteCachedCategory(catName, modalType || undefined);
    setSavedCategories((prev) => prev.filter((c) => c.toLowerCase() !== catName.toLowerCase()));
    setFilteredCategories((prev) => prev.filter((c) => c.toLowerCase() !== catName.toLowerCase()));
    setCategoryToDelete(null);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (!showCategorySuggestions || filteredCategories.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCategoryIndex((prev) => (prev + 1) % filteredCategories.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCategoryIndex((prev) => (prev <= 0 ? filteredCategories.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightedCategoryIndex >= 0) {
      e.preventDefault();
      handleSelectCategory(filteredCategories[highlightedCategoryIndex]);
    } else if (e.key === "Escape") {
      setShowCategorySuggestions(false);
    }
  };

  // Form submission handler
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    if (!formDate) {
      alert("Please select a transaction date");
      return;
    }
    if (!formCategory.trim()) {
      alert("Please enter a category");
      return;
    }

    try {
      const type = modalType || "income";
      const catTrimmed = formCategory.trim();

      // Automatically store category when added once
      saveCachedCategory(catTrimmed, type);

      const saved = await financeService.saveTransaction(
        {
          type,
          amount: parsedAmount,
          date: formDate,
          description: catTrimmed,
          category: catTrimmed,
          payment_method: formPaymentMethod || undefined,
          order_id: null
        },
        editingTransaction ? editingTransaction.id : undefined
      );

      // Update state locally
      if (editingTransaction) {
        setManualTransactions((prev) =>
          prev.map((t) => (t.id === editingTransaction.id ? saved : t))
        );
        showToast("Transaction updated successfully!");
      } else {
        setManualTransactions((prev) => [saved, ...prev]);
        showToast(type === "income" ? "Income added successfully!" : "Expense added successfully!");
      }

      handleCloseModal();
    } catch (err) {
      console.error("Failed to save transaction:", err);
      alert("Could not save transaction. Please try again.");
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (id: string) => {
    try {
      await financeService.deleteTransaction(id);
      setManualTransactions((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      showToast("Transaction deleted successfully");
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      alert("Could not delete transaction. Please try again.");
    }
  };

  // Format date helper: "04 Oct 2026"
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
      }
      return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="finance-dashboard-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="finance-toast"
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

      {viewMode === "overview" ? (
        <>
          {/* 1. TOP UNIFORM SECTION HEADER */}
          <div className="admin-section-header">
            <div className="section-header-info">
              <h2 className="section-header-title">Finance</h2>
            </div>
            <div className="section-header-actions">
              <button 
                type="button" 
                className="btn-finance-action btn-add-expense desktop-add-btn"
                onClick={() => handleOpenAdd("expense")}
              >
                <Plus size={15} />
                <span>Add Expense</span>
              </button>
              <button 
                type="button" 
                className="btn-finance-action btn-add-income desktop-add-btn"
                onClick={() => handleOpenAdd("income")}
              >
                <Plus size={15} />
                <span>Add Income</span>
              </button>
            </div>
          </div>

          {/* 2. OVERVIEW 3 CARDS: NET INCOME, NET EXPENSE, NET PROFIT/LOSS */}
          <div className="finance-summary-grid">
            {/* Net Income */}
            <div className="finance-card income-card">
              <div className="finance-card-icon income-icon">
                <ArrowUpRight size={22} />
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">Net Income</span>
                <h3 className="finance-card-value">₹{netTotalIncome.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            {/* Net Expense */}
            <div className="finance-card expense-card">
              <div className="finance-card-icon expense-icon">
                <ArrowDownLeft size={22} />
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">Net Expense</span>
                <h3 className="finance-card-value">₹{netTotalExpense.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div className={`finance-card net-card ${isNetProfit ? "profit-state" : "loss-state"}`}>
              <div className={`finance-card-icon ${isNetProfit ? "profit-icon" : "loss-icon"}`}>
                {isNetProfit ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">
                  {isNetProfit ? "Net Profit" : "Net Loss"}
                </span>
                <h3 className={`finance-card-value ${isNetProfit ? "text-profit" : "text-loss"}`}>
                  {isNetProfit ? "+" : "-"}₹{Math.abs(netProfitOrLoss).toLocaleString("en-IN")}
                </h3>
              </div>
            </div>
          </div>

          {/* 3. PRIMARY ACTION BUTTONS */}
          <div className="finance-action-buttons-row">
            <button 
              type="button" 
              className="btn-finance-action btn-add-income"
              onClick={() => handleOpenAdd("income")}
            >
              <Plus size={16} />
              <span>Add Income</span>
            </button>

            <button 
              type="button" 
              className="btn-finance-action btn-add-expense"
              onClick={() => handleOpenAdd("expense")}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>

          {/* 4. MAIN CONTENT GRID: RECENT ACTIVITY (LEFT) & MONTHLY INCOME GRAPH (RIGHT) */}
          <div className="finance-two-col-grid">
            {/* Left Side: RECENT ACTIVITY */}
            <div className="finance-section-card activity-section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">Recent Activity</h3>
                <button 
                  type="button" 
                  className="btn-view-all-link"
                  onClick={() => setViewMode("table")}
                >
                  View All
                </button>
              </div>

              {overviewRecentActivities.length === 0 ? (
                <div className="finance-empty-state">
                  <FileText size={40} className="empty-icon" />
                  <h4>No recent activity</h4>
                  <p>Log your business expenses or record manual income using the buttons above.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {overviewRecentActivities.map((item) => {
                    const isIncome = item.type === "income";

                    return (
                      <div key={item.id} className="activity-item-row">
                        <div className={`activity-icon-badge ${isIncome ? "income-badge" : "expense-badge"}`}>
                          {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>

                        <div className="activity-details">
                          <div className="activity-main-line">
                            <span className="activity-desc">{item.description}</span>
                          </div>
                          
                          <div className="activity-meta-line">
                            <span className="activity-date">{formatDateDisplay(item.date)}</span>
                            {item.category && item.category !== "Order Payment" && (
                              <span className="activity-category-pill">
                                {item.category}
                              </span>
                            )}
                            {item.paymentMethod && item.paymentMethod !== "Order Bill" && (
                              <span className="activity-method-text">
                                via {item.paymentMethod}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="activity-right-col">
                          <span className={`activity-amount ${isIncome ? "text-income" : "text-expense"}`}>
                            {isIncome ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                          </span>

                          {!item.isOrderLinked && (
                            <div className="activity-actions">
                              <button
                                type="button"
                                className="btn-act-icon"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit transaction"
                                aria-label="Edit transaction"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn-act-icon delete-act"
                                onClick={() => setDeleteConfirmId(item.id)}
                                title="Delete transaction"
                                aria-label="Delete transaction"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Side: MONTHLY INCOME & EXPENSE COMPARISON GRAPH */}
            <div className="finance-section-card chart-section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">Monthly Comparison</h3>

                <div className="chart-legend-group">
                  <div className="chart-legend-badge">
                    <span className="legend-dot income-dot"></span>
                    <span>Income</span>
                  </div>
                  <div className="chart-legend-badge">
                    <span className="legend-dot expense-dot"></span>
                    <span>Expense</span>
                  </div>
                </div>
              </div>

              {/* Minimal monthly income & expense comparison graph */}
              <div className="monthly-income-graph-container">
                <div 
                  className="chart-scroll-wrapper" 
                  ref={chartScrollRef}
                  title="Scroll left to view previous months"
                >
                  <div className="chart-scroll-content">
                    {monthlyComparisonData.map((item) => {
                      const incomeVal = Number(item.income) || 0;
                      const expenseVal = Number(item.expense) || 0;
                      const maxVal = maxMonthlyValue > 0 ? maxMonthlyValue : 1000;

                      const incomeHeightPct = Math.max(
                        incomeVal > 0 ? Math.round((incomeVal / maxVal) * 100) : 4,
                        incomeVal > 0 ? 8 : 4
                      );
                      const expenseHeightPct = Math.max(
                        expenseVal > 0 ? Math.round((expenseVal / maxVal) * 100) : 4,
                        expenseVal > 0 ? 8 : 4
                      );

                      const formatShort = (val: number | undefined | null) => {
                        const num = Number(val) || 0;
                        if (num <= 0) return "₹0";
                        if (num >= 100000) return `₹${(num / 1000).toFixed(1)}k`;
                        return `₹${num.toLocaleString("en-IN")}`;
                      };

                      return (
                        <div 
                          key={item.key} 
                          className={`monthly-bar-item ${item.isSelected ? "active-month" : ""}`}
                          onClick={() => {
                            setCurrentDate(item.date);
                            setViewMode("table");
                          }}
                          title={`Click to view ${item.shortLabel} ${item.yearLabel} — Income: ₹${incomeVal.toLocaleString("en-IN")} | Expense: ₹${expenseVal.toLocaleString("en-IN")}`}
                        >
                          <div className="bar-income-val">
                            <div className="bar-split-vals">
                              <span className="val-inc">{formatShort(incomeVal)}</span>
                              {expenseVal > 0 && <span className="val-exp">{formatShort(expenseVal)}</span>}
                            </div>
                          </div>

                          <div 
                            className="bar-single-track"
                            title={`Income: ₹${incomeVal.toLocaleString("en-IN")} | Expense: ₹${expenseVal.toLocaleString("en-IN")}`}
                          >
                            {/* Income Layer (Green) */}
                            {incomeVal > 0 && (
                              <motion.div 
                                className="bar-layer bar-layer-income"
                                style={{
                                  zIndex: incomeVal >= expenseVal ? 1 : 2,
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${incomeHeightPct}%` }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                              />
                            )}

                            {/* Expense Layer (Red) */}
                            {expenseVal > 0 && (
                              <motion.div 
                                className="bar-layer bar-layer-expense"
                                style={{
                                  zIndex: expenseVal > incomeVal ? 1 : 2,
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${expenseHeightPct}%` }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                              />
                            )}

                            {/* Base indicator if both are 0 */}
                            {incomeVal === 0 && expenseVal === 0 && (
                              <div className="bar-layer-empty" />
                            )}
                          </div>

                          <div className="bar-month-tag">
                            <span className="month-name">{item.shortLabel}</span>
                            {item.isSelected && <span className="active-dot" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom takeaway summary */}
                <div className="chart-takeaway-strip">
                  <div className="takeaway-metric">
                    <span className="takeaway-label">{monthLabel}:</span>
                    <span className="takeaway-val text-income">₹{(Number(monthlyIncome) || 0).toLocaleString("en-IN")}</span>
                    <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>/</span>
                    <span className="takeaway-val text-expense">₹{(Number(monthlyExpense) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {monthOverMonthChange && (
                    <>
                      <div className="takeaway-divider"></div>
                      <div className="takeaway-metric">
                        <span className={`takeaway-badge ${monthOverMonthChange.pct >= 0 ? "badge-up" : "badge-down"}`}>
                          {monthOverMonthChange.pct >= 0 ? `+${monthOverMonthChange.pct}%` : `${monthOverMonthChange.pct}%`} vs {monthOverMonthChange.prevLabel}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* TABLE VIEW (VIEW ALL FINANCE TABLE) */
        <div className="finance-table-view-container">
          {/* Top Navigation & Month Switcher */}
          <div className="admin-section-header">
            <div className="section-header-info">
              <h2 className="section-header-title">Monthly Financials</h2>
            </div>
            <div className="section-header-actions">
              <button 
                type="button" 
                className="btn-finance-back" 
                onClick={() => setViewMode("overview")}
              >
                <ArrowLeft size={16} />
                <span>Back to Overview</span>
              </button>

              {/* Month Switcher for that month only */}
              <div className="month-selector-wrapper">
                <button 
                  type="button" 
                  className="month-nav-btn" 
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                
                <div className="month-display-pill">
                  <Calendar size={15} className="month-icon" />
                  <span className="month-label-text">{monthLabel}</span>
                </div>

                <button 
                  type="button" 
                  className="month-nav-btn" 
                  onClick={handleNextMonth}
                  title="Next Month"
                  aria-label="Next Month"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>

              <button 
                type="button" 
                className="btn-finance-action btn-add-expense desktop-add-btn"
                onClick={() => handleOpenAdd("expense")}
              >
                <Plus size={15} />
                <span>Add Expense</span>
              </button>
              <button 
                type="button" 
                className="btn-finance-action btn-add-income desktop-add-btn"
                onClick={() => handleOpenAdd("income")}
              >
                <Plus size={15} />
                <span>Add Income</span>
              </button>
            </div>
          </div>

          {/* 3 Cards in that month only: Income, Expense, P/L */}
          <div className="finance-summary-grid">
            {/* Income in this month */}
            <div className="finance-card income-card">
              <div className="finance-card-icon income-icon">
                <ArrowUpRight size={22} />
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">Income</span>
                <h3 className="finance-card-value">₹{monthlyIncome.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            {/* Expense in this month */}
            <div className="finance-card expense-card">
              <div className="finance-card-icon expense-icon">
                <ArrowDownLeft size={22} />
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">Expense</span>
                <h3 className="finance-card-value">₹{monthlyExpense.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            {/* Profit / Loss in this month */}
            <div className={`finance-card net-card ${isMonthlyProfit ? "profit-state" : "loss-state"}`}>
              <div className={`finance-card-icon ${isMonthlyProfit ? "profit-icon" : "loss-icon"}`}>
                {isMonthlyProfit ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              </div>
              <div className="finance-card-info">
                <span className="finance-card-label">
                  {isMonthlyProfit ? "Profit" : "Loss"}
                </span>
                <h3 className={`finance-card-value ${isMonthlyProfit ? "text-profit" : "text-loss"}`}>
                  {isMonthlyProfit ? "+" : "-"}₹{Math.abs(monthlyProfitOrLoss).toLocaleString("en-IN")}
                </h3>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="finance-action-buttons-row">
            <button 
              type="button" 
              className="btn-finance-action btn-add-income"
              onClick={() => handleOpenAdd("income")}
            >
              <Plus size={16} />
              <span>Add Income</span>
            </button>

            <button 
              type="button" 
              className="btn-finance-action btn-add-expense"
              onClick={() => handleOpenAdd("expense")}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>

          {/* Finance Table Card */}
          <div className="finance-table-card">
            <div className="finance-table-toolbar">
              <div className="table-filter-pills">
                <button 
                  type="button" 
                  className={`filter-pill ${tableFilter === "all" ? "active" : ""}`}
                  onClick={() => setTableFilter("all")}
                >
                  All ({monthlyTransactions.length})
                </button>
                <button 
                  type="button" 
                  className={`filter-pill ${tableFilter === "income" ? "active" : ""}`}
                  onClick={() => setTableFilter("income")}
                >
                  Income ({monthlyTransactions.filter((t) => t.type === "income").length})
                </button>
                <button 
                  type="button" 
                  className={`filter-pill ${tableFilter === "expense" ? "active" : ""}`}
                  onClick={() => setTableFilter("expense")}
                >
                  Expense ({monthlyTransactions.filter((t) => t.type === "expense").length})
                </button>
              </div>

              <div className="table-search-box">
                <Search size={15} />
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredTableTransactions.length === 0 ? (
              <div className="finance-empty-state">
                <FileText size={40} className="empty-icon" />
                <h4>No transactions recorded for {monthLabel}</h4>
                <p>Try switching to another month or record a new transaction above.</p>
              </div>
            ) : (
              <div className="finance-table-wrapper">
                <table className="finance-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Method</th>
                      <th className="th-right">Amount</th>
                      <th className="th-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableTransactions.map((item) => {
                      const isIncome = item.type === "income";

                      return (
                        <tr key={item.id} className="finance-row">
                          <td className="td-date">{formatDateDisplay(item.date)}</td>
                          <td className="td-desc">
                            <span className="desc-title">{item.category || item.description}</span>
                            {item.isOrderLinked && (
                              <span className="table-order-tag">Order Linked</span>
                            )}
                          </td>
                          <td className="td-type">
                            <span className={`table-type-badge ${isIncome ? "income" : "expense"}`}>
                              {isIncome ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                              <span>{isIncome ? "Income" : "Expense"}</span>
                            </span>
                          </td>
                          <td className="td-method">{item.paymentMethod || "—"}</td>
                          <td className={`td-amount ${isIncome ? "text-income" : "text-expense"}`}>
                            {isIncome ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="td-actions">
                            {!item.isOrderLinked ? (
                              <div className="row-action-btns">
                                <button
                                  type="button"
                                  className="btn-act-icon"
                                  onClick={() => handleOpenEdit(item)}
                                  title="Edit transaction"
                                  aria-label="Edit transaction"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-act-icon delete-act"
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  title="Delete transaction"
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ) : (
                              <span className="td-locked-text" title="Managed directly in Orders">Auto</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT TRANSACTION MODAL */}
      <AnimatePresence>
        {modalType && (
          <div className="finance-modal-backdrop" onClick={handleCloseModal}>
            <motion.div 
              className="finance-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="finance-modal-header">
                <h3 className="finance-modal-title">
                  {editingTransaction 
                    ? (modalType === "income" ? "Edit Income" : "Edit Expense") 
                    : (modalType === "income" ? "Add Income" : "Add Expense")}
                </h3>
                <button type="button" className="btn-modal-close" onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="finance-modal-form">
                {/* Amount */}
                <div className="finance-form-group">
                  <label>Amount (₹) *</label>
                  <div className="input-with-symbol">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      min="1"
                      step="any"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="finance-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                {/* Category with autocomplete & saved suggestions */}
                <div className="finance-form-group" ref={categoryDropdownRef} style={{ position: "relative" }}>
                  <label>Category *</label>
                  <div className="cat-autocomplete-input-box">
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      onFocus={handleCategoryFocus}
                      onKeyDown={handleCategoryKeyDown}
                      placeholder={modalType === "income" ? "e.g. Advance Payment, Workshop Revenue" : "e.g. Raw Materials, Packaging"}
                      required
                      autoComplete="off"
                    />
                  </div>

                  {/* Saved Category Suggestions Dropdown */}
                  {showCategorySuggestions && filteredCategories.length > 0 && (
                    <ul className="category-suggestions-dropdown" role="listbox">
                      {filteredCategories.map((catName, idx) => (
                        <li
                          key={`${catName}-${idx}`}
                          className={`category-suggestion-item ${highlightedCategoryIndex === idx ? "highlighted" : ""}`}
                          onClick={() => handleSelectCategory(catName)}
                          onMouseEnter={() => setHighlightedCategoryIndex(idx)}
                        >
                          <span className="cat-sugg-name">{catName}</span>
                          <div className="cat-sugg-right">
                            <button
                              type="button"
                              className="cat-delete-btn"
                              onClick={(e) => handleDeleteCategoryClick(e, catName)}
                              title={`Delete ${catName}`}
                              aria-label={`Delete ${catName}`}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Payment Method */}
                <div className="finance-form-group">
                  <label>Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="finance-modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn-submit ${modalType === "income" ? "btn-income-submit" : "btn-expense-submit"}`}
                  >
                    {editingTransaction 
                      ? "Save Changes" 
                      : (modalType === "income" ? "Add Income" : "Add Expense")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="finance-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <motion.div 
              className="finance-confirm-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="confirm-icon-box">
                <Trash2 size={24} />
              </div>
              <h4 className="confirm-title">Delete this entry?</h4>
              <p className="confirm-text">
                This transaction will be removed from your records. This action cannot be undone.
              </p>
              <div className="confirm-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={() => handleDeleteTransaction(deleteConfirmId)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. CATEGORY DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="cat-alert-backdrop" onClick={() => setCategoryToDelete(null)}>
            <motion.div
              className="cat-alert-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cat-alert-header">
                <h4>Delete Saved Category</h4>
              </div>
              <p className="cat-alert-message">
                Are you sure you want to remove <strong>"{categoryToDelete}"</strong> from saved categories?
              </p>
              <div className="cat-alert-actions">
                <button
                  type="button"
                  className="cat-alert-btn-cancel"
                  onClick={() => setCategoryToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cat-alert-btn-delete"
                  onClick={confirmDeleteCategory}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button Group: Income (Primary) & Expense (Secondary) */}
      <div className="admin-fab-group">
        <button 
          type="button" 
          className="admin-fab-btn admin-fab-secondary"
          onClick={() => handleOpenAdd("expense")}
          aria-label="Add Expense"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Add Expense</span>
        </button>
        <button 
          type="button" 
          className="admin-fab-btn admin-fab-primary"
          onClick={() => handleOpenAdd("income")}
          aria-label="Add Income"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Add Income</span>
        </button>
      </div>
    </div>
  );
}
