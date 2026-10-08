import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
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

  // Overview recent activity (latest 5 across all records)
  const overviewRecentActivities = useMemo(() => {
    return [...allMergedTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
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

    // Anchor the 8-month window so clicking nodes within the window doesn't unexpectedly slide the graph
    const now = new Date();
    let anchor = now;
    const monthsDiff =
      (now.getFullYear() - currentDate.getFullYear()) * 12 +
      (now.getMonth() - currentDate.getMonth());
    if (monthsDiff < 0) {
      anchor = currentDate;
    } else if (monthsDiff >= 8) {
      anchor = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
    }

    for (let i = 7; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
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
    if (maxVal <= 0) return 1000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const ratio = maxVal / magnitude;
    let roundedMultiplier = 1;
    if (ratio <= 1) roundedMultiplier = 1;
    else if (ratio <= 2) roundedMultiplier = 2;
    else if (ratio <= 2.5) roundedMultiplier = 2.5;
    else if (ratio <= 5) roundedMultiplier = 5;
    else roundedMultiplier = 10;
    return Math.ceil(roundedMultiplier * magnitude);
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

  // Hovered node state for the line graph
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Line Graph SVG coordinates
  const SVG_WIDTH = 520;
  const SVG_HEIGHT = 190;
  const PADDING_LEFT = 44;
  const PADDING_RIGHT = 22;
  const PADDING_TOP = 22;
  const PADDING_BOTTOM = 30;
  const PLOT_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT; // 454
  const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM; // 138
  const BASELINE_Y = PADDING_TOP + PLOT_HEIGHT; // 160

  const chartPoints = useMemo(() => {
    const total = monthlyComparisonData.length;
    if (total === 0) return [];

    return monthlyComparisonData.map((item, idx) => {
      const x =
        total > 1
          ? PADDING_LEFT + (idx / (total - 1)) * PLOT_WIDTH
          : PADDING_LEFT + PLOT_WIDTH / 2;

      const incClamped = Math.max(0, item.income);
      const expClamped = Math.max(0, item.expense);
      const profitClamped = Math.max(0, item.income - item.expense);

      const yIncome =
        BASELINE_Y -
        (maxMonthlyValue > 0 ? (incClamped / maxMonthlyValue) * PLOT_HEIGHT : 0);
      const yExpense =
        BASELINE_Y -
        (maxMonthlyValue > 0 ? (expClamped / maxMonthlyValue) * PLOT_HEIGHT : 0);
      const yProfit =
        BASELINE_Y -
        (maxMonthlyValue > 0 ? (profitClamped / maxMonthlyValue) * PLOT_HEIGHT : 0);

      return {
        x,
        yIncome,
        yExpense,
        yProfit,
        profit: item.income - item.expense,
        item,
        index: idx,
      };
    });
  }, [monthlyComparisonData, maxMonthlyValue]);

  // Smooth cubic bezier paths with monotonic clamping (never dips below 0 baseline)
  const { incomeLinePath, incomeAreaPath, expenseLinePath, expenseAreaPath, profitLinePath } = useMemo(() => {
    if (chartPoints.length === 0) {
      return {
        incomeLinePath: "",
        incomeAreaPath: "",
        expenseLinePath: "",
        expenseAreaPath: "",
        profitLinePath: "",
      };
    }

    const getSmoothPath = (pts: Array<{ x: number; y: number }>) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

      let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

        let cp1x = p1.x + (p2.x - p0.x) / 6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;
        let cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;

        // Monotonic clamping: prevent dips below baseline or overshoots
        if (p1.y === p2.y) {
          cp1y = p1.y;
          cp2y = p2.y;
        } else {
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          cp1y = Math.min(maxY, Math.max(minY, cp1y));
          cp2y = Math.min(maxY, Math.max(minY, cp2y));
        }

        // Hard clamp at BASELINE_Y so it NEVER dips below 0 line
        cp1y = Math.min(BASELINE_Y, Math.max(PADDING_TOP, cp1y));
        cp2y = Math.min(BASELINE_Y, Math.max(PADDING_TOP, cp2y));

        d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }
      return d;
    };

    const incPts = chartPoints.map((p) => ({ x: p.x, y: p.yIncome }));
    const expPts = chartPoints.map((p) => ({ x: p.x, y: p.yExpense }));
    const profitPts = chartPoints.map((p) => ({ x: p.x, y: p.yProfit }));

    const incLine = getSmoothPath(incPts);
    const expLine = getSmoothPath(expPts);
    const profitLine = getSmoothPath(profitPts);

    const firstX = chartPoints[0].x.toFixed(1);
    const lastX = chartPoints[chartPoints.length - 1].x.toFixed(1);

    const incArea = `${incLine} L ${lastX},${BASELINE_Y} L ${firstX},${BASELINE_Y} Z`;
    const expArea = `${expLine} L ${lastX},${BASELINE_Y} L ${firstX},${BASELINE_Y} Z`;

    return {
      incomeLinePath: incLine,
      incomeAreaPath: incArea,
      expenseLinePath: expLine,
      expenseAreaPath: expArea,
      profitLinePath: profitLine,
    };
  }, [chartPoints]);

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

                    const categoryName = item.category?.trim() || item.description?.trim() || (isIncome ? "Income" : "Expense");

                    return (
                      <div key={item.id} className="activity-item-row activity-item-row-minimal">
                        <div className="activity-left-group">
                          <div className={`activity-icon-badge ${isIncome ? "income-badge" : "expense-badge"}`}>
                            {isIncome ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                          </div>
                          <span className="activity-category-name" title={categoryName}>
                            {categoryName}
                          </span>
                        </div>

                        <span className="activity-amount-minimal">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </span>
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
              </div>

              {/* Minimal Line Graph for Monthly Comparison */}
              <div className="monthly-income-graph-container">
                <div
                  className="line-chart-wrapper"
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                >
                  {/* Floating Tooltip */}
                  <AnimatePresence>
                    {hoveredMonthIndex !== null && chartPoints[hoveredMonthIndex] && (() => {
                      const activePoint = chartPoints[hoveredMonthIndex];
                      const activeItem = activePoint.item;
                      const isRightSide = activePoint.x > SVG_WIDTH * 0.52;
                      const isFarLeft = activePoint.x < SVG_WIDTH * 0.22;

                      // Flip to left if on right side, flip to right if on far left, else center
                      const transformX = isRightSide ? "-100%" : isFarLeft ? "0%" : "-50%";
                      const leftPct = (activePoint.x / SVG_WIDTH) * 100;

                      // Node highest point
                      const nodeY = Math.min(
                        activePoint.yIncome,
                        activePoint.yExpense,
                        activePoint.yProfit
                      );

                      // If node is in upper portion (nodeY < 80px), placing above causes clipping;
                      // position it downward so it stays comfortably inside the chart.
                      // Otherwise, position it upward above the node/baseline.
                      const isNearTop = nodeY < 80;
                      const transformY = isNearTop ? "0%" : "-100%";
                      const topPct = isNearTop
                        ? Math.max(4, ((nodeY + 6) / SVG_HEIGHT) * 100)
                        : (nodeY / SVG_HEIGHT) * 100;

                      return (
                        <div
                          className="line-chart-tooltip-anchor"
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            transform: `translate(${transformX}, ${transformY})`,
                            paddingRight: isRightSide ? "12px" : undefined,
                            paddingLeft: isFarLeft ? "12px" : undefined,
                            paddingBottom: !isNearTop ? "8px" : undefined,
                            paddingTop: isNearTop ? "8px" : undefined,
                          }}
                        >
                          <motion.div
                            className="line-chart-tooltip"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.12 }}
                          >
                            <div className="chart-tooltip-header">
                              <span className="tooltip-month-name">
                                {activeItem.shortLabel} {activeItem.yearLabel}
                              </span>
                            </div>

                            <div className="chart-tooltip-body">
                              <div className="tooltip-stat-row">
                                <div className="tooltip-stat-label">
                                  <span className="tooltip-dot income-dot" />
                                  <span>Income</span>
                                </div>
                                <span className="tooltip-stat-val text-income">
                                  ₹{activeItem.income.toLocaleString("en-IN")}
                                </span>
                              </div>

                              <div className="tooltip-stat-row">
                                <div className="tooltip-stat-label">
                                  <span className="tooltip-dot expense-dot" />
                                  <span>Expense</span>
                                </div>
                                <span className="tooltip-stat-val text-expense">
                                  ₹{activeItem.expense.toLocaleString("en-IN")}
                                </span>
                              </div>

                              <div className="tooltip-stat-divider" />

                              <div className="tooltip-stat-row tooltip-net-row">
                                <div className="tooltip-stat-label">
                                  <span className="tooltip-dot profit-dot" />
                                  <span>Net Profit</span>
                                </div>
                                <span
                                  className={`tooltip-stat-val ${
                                    activeItem.income - activeItem.expense >= 0
                                      ? "text-income"
                                      : "text-expense"
                                  }`}
                                >
                                  {activeItem.income - activeItem.expense >= 0 ? "+" : ""}
                                  ₹{(activeItem.income - activeItem.expense).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })()}
                  </AnimatePresence>

                  {/* SVG Line Graph */}
                  <svg
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    className="monthly-line-chart-svg"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="chartIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="chartExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines & Y-axis scale */}
                    {[
                      { val: maxMonthlyValue, y: PADDING_TOP },
                      { val: Math.round(maxMonthlyValue / 2), y: PADDING_TOP + PLOT_HEIGHT / 2 },
                      { val: 0, y: BASELINE_Y },
                    ].map((tick, i) => (
                      <g key={i}>
                        <line
                          x1={PADDING_LEFT}
                          y1={tick.y}
                          x2={PADDING_LEFT + PLOT_WIDTH}
                          y2={tick.y}
                          stroke={tick.val === 0 ? "rgba(20, 20, 20, 0.12)" : "rgba(20, 20, 20, 0.05)"}
                          strokeWidth={tick.val === 0 ? 1.2 : 1}
                          strokeDasharray={tick.val === 0 ? undefined : "3 3"}
                        />
                        <text
                          x={PADDING_LEFT - 6}
                          y={tick.y + 3.5}
                          textAnchor="end"
                          className="chart-axis-label"
                        >
                          {tick.val <= 0
                            ? "₹0"
                            : tick.val >= 100000
                            ? `₹${(tick.val / 1000).toFixed(0)}k`
                            : tick.val >= 1000
                            ? `₹${(tick.val / 1000).toFixed(tick.val % 1000 === 0 ? 0 : 1)}k`
                            : `₹${tick.val}`}
                        </text>
                      </g>
                    ))}

                    {/* Area Gradients */}
                    {incomeAreaPath && (
                      <path d={incomeAreaPath} fill="url(#chartIncomeGrad)" />
                    )}
                    {expenseAreaPath && (
                      <path d={expenseAreaPath} fill="url(#chartExpenseGrad)" />
                    )}

                    {/* Income Line */}
                    {incomeLinePath && (
                      <path
                        d={incomeLinePath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Expense Line */}
                    {expenseLinePath && (
                      <path
                        d={expenseLinePath}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Net Profit Line (Dotted Indigo) */}
                    {profitLinePath && (
                      <path
                        d={profitLinePath}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2.2"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Vertical hover crosshair guide line */}
                    {hoveredMonthIndex !== null && chartPoints[hoveredMonthIndex] && (
                      <line
                        x1={chartPoints[hoveredMonthIndex].x}
                        y1={PADDING_TOP}
                        x2={chartPoints[hoveredMonthIndex].x}
                        y2={BASELINE_Y}
                        stroke="rgba(125, 4, 75, 0.4)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* X-Axis month labels */}
                    {chartPoints.map((p) => {
                      const isHovered = hoveredMonthIndex === p.index;
                      const isSelected = p.item.isSelected;
                      return (
                        <g key={`lbl-${p.item.key}`}>
                          <text
                            x={p.x}
                            y={BASELINE_Y + 18}
                            textAnchor="middle"
                            className={`chart-month-text ${isSelected ? "is-selected" : ""} ${
                              isHovered ? "is-hovered" : ""
                            }`}
                          >
                            {p.item.shortLabel}
                          </text>
                          {isSelected && (
                            <circle cx={p.x} cy={BASELINE_Y + 25} r={2} fill="#7D044B" />
                          )}
                        </g>
                      );
                    })}

                    {/* Data Nodes */}
                    {chartPoints.map((p) => {
                      const isHovered = hoveredMonthIndex === p.index;
                      const isSelected = p.item.isSelected;

                      return (
                        <g
                          key={`nodes-${p.item.key}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setCurrentDate(p.item.date);
                            setHoveredMonthIndex(p.index);
                          }}
                        >
                          {/* Income Node Halo & Dot */}
                          {(isHovered || isSelected) && (
                            <circle
                              cx={p.x}
                              cy={p.yIncome}
                              r={isHovered ? 9 : 7}
                              fill={isHovered ? "rgba(16, 185, 129, 0.25)" : "none"}
                              stroke="#10B981"
                              strokeWidth={isHovered ? 1.5 : 1.2}
                              strokeDasharray={isSelected && !isHovered ? "2 2" : undefined}
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.yIncome}
                            r={isHovered ? 5.5 : isSelected ? 4.5 : 3.5}
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />

                          {/* Expense Node Halo & Dot */}
                          {(isHovered || isSelected) && (
                            <circle
                              cx={p.x}
                              cy={p.yExpense}
                              r={isHovered ? 9 : 7}
                              fill={isHovered ? "rgba(239, 68, 68, 0.25)" : "none"}
                              stroke="#EF4444"
                              strokeWidth={isHovered ? 1.5 : 1.2}
                              strokeDasharray={isSelected && !isHovered ? "2 2" : undefined}
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.yExpense}
                            r={isHovered ? 5.5 : isSelected ? 4.5 : 3.5}
                            fill="#EF4444"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />

                          {/* Profit Node (Indigo Dotted Halo & Dot) */}
                          {(isHovered || isSelected) && (
                            <circle
                              cx={p.x}
                              cy={p.yProfit}
                              r={isHovered ? 8 : 6}
                              fill={isHovered ? "rgba(99, 102, 241, 0.25)" : "none"}
                              stroke="#6366F1"
                              strokeWidth={isHovered ? 1.5 : 1.2}
                              strokeDasharray="2 2"
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.yProfit}
                            r={isHovered ? 4.5 : isSelected ? 3.8 : 3}
                            fill="#6366F1"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                          />
                        </g>
                      );
                    })}

                    {/* Hit-test interactive columns across the chart */}
                    {chartPoints.map((p) => {
                      const colWidth =
                        chartPoints.length > 1
                          ? PLOT_WIDTH / (chartPoints.length - 1)
                          : PLOT_WIDTH;

                      return (
                        <rect
                          key={`hit-${p.item.key}`}
                          x={p.x - colWidth / 2}
                          y={0}
                          width={colWidth}
                          height={SVG_HEIGHT}
                          fill="transparent"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredMonthIndex(p.index)}
                          onTouchStart={() => setHoveredMonthIndex(p.index)}
                          onClick={() => {
                            setCurrentDate(p.item.date);
                            setHoveredMonthIndex(p.index);
                          }}
                        />
                      );
                    })}
                  </svg>
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
            <div className="section-header-info section-header-with-back">
              <button
                type="button"
                className="btn-finance-back-icon"
                onClick={() => setViewMode("overview")}
                title="Back to Overview"
                aria-label="Back to Overview"
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
              </button>
              <h2 className="section-header-title">Monthly Financials</h2>
            </div>
            <div className="section-header-actions">

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


          {/* Finance Table Card */}
          <div className="finance-table-card">
            <div className="finance-table-toolbar">
              <div className="table-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${tableFilter === "all" ? "active" : ""}`}
                  onClick={() => setTableFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`filter-pill ${tableFilter === "income" ? "active" : ""}`}
                  onClick={() => setTableFilter("income")}
                >
                  Income
                </button>
                <button
                  type="button"
                  className={`filter-pill ${tableFilter === "expense" ? "active" : ""}`}
                  onClick={() => setTableFilter("expense")}
                >
                  Expense
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
                            <div className="row-action-btns">
                              <button
                                type="button"
                                className="action-icon-btn edit"
                                onClick={() => {
                                  if (item.isOrderLinked) {
                                    alert(`This entry is linked to Order #${item.orderId || ""}. Please edit payment details in the Orders section.`);
                                  } else {
                                    handleOpenEdit(item);
                                  }
                                }}
                                title={item.isOrderLinked ? `Order Payment (#${item.orderId || ""})` : "Edit transaction"}
                                aria-label="Edit transaction"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-icon-btn delete"
                                onClick={() => {
                                  if (item.isOrderLinked) {
                                    alert(`This entry is automatically generated from Order #${item.orderId || ""}. To remove it, update the order payment status in the Orders section.`);
                                  } else {
                                    setDeleteConfirmId(item.id);
                                  }
                                }}
                                title={item.isOrderLinked ? `Order Payment (#${item.orderId || ""})` : "Delete transaction"}
                                aria-label="Delete transaction"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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
