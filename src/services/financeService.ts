import { supabase } from "../lib/supabase";

export interface FinanceTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  category?: string;
  payment_method?: string;
  order_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_FINANCE_KEY = "faza_finance_transactions";

export function getCachedFinanceTransactions(): FinanceTransaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FINANCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedFinanceTransactions(list: FinanceTransaction[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FINANCE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save finance transactions to cache:", e);
  }
}

export interface SavedCategory {
  name: string;
  type: "income" | "expense";
}

const LOCAL_STORAGE_FINANCE_CATEGORIES_KEY = "faza_saved_finance_categories";

const DEFAULT_INCOME_CATEGORIES: string[] = [
  "Advance Payment",
  "Workshop Revenue",
  "Custom Memento",
  "Other Income"
];

const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  "Raw Materials",
  "Packaging",
  "Shipping & Logistics",
  "Tools & Supplies",
  "Rent & Utilities",
  "Marketing"
];

export function getCachedCategories(type?: "income" | "expense"): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY);
    let list: SavedCategory[] = [];
    if (raw) {
      list = JSON.parse(raw);
    } else {
      // Initial seed with defaults and existing transactions
      list = [
        ...DEFAULT_INCOME_CATEGORIES.map(name => ({ name, type: "income" as const })),
        ...DEFAULT_EXPENSE_CATEGORIES.map(name => ({ name, type: "expense" as const }))
      ];
      try {
        const txs = getCachedFinanceTransactions();
        txs.forEach(t => {
          const cat = (t.category || t.description || "").trim();
          if (cat && !list.some(c => c.name.toLowerCase() === cat.toLowerCase())) {
            list.push({ name: cat, type: t.type });
          }
        });
      } catch {
        // ignore
      }
      localStorage.setItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY, JSON.stringify(list));
    }

    if (type) {
      return list.filter(c => c.type === type).map(c => c.name);
    }
    return list.map(c => c.name);
  } catch {
    return type === "income" ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  }
}

export function saveCachedCategory(categoryName: string, type: "income" | "expense"): void {
  const trimmed = categoryName.trim();
  if (!trimmed) return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY);
    let list: SavedCategory[] = raw ? JSON.parse(raw) : [];
    const exists = list.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === type
    );
    if (!exists) {
      list.push({ name: trimmed, type });
      localStorage.setItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to save category cache:", e);
  }
}

export function deleteCachedCategory(categoryName: string, type?: "income" | "expense"): void {
  const trimmed = categoryName.trim();
  if (!trimmed) return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY);
    if (!raw) return;
    let list: SavedCategory[] = JSON.parse(raw);
    list = list.filter(c => {
      const nameMatches = c.name.toLowerCase() === trimmed.toLowerCase();
      if (!nameMatches) return true;
      if (type) return c.type !== type;
      return false;
    });
    localStorage.setItem(LOCAL_STORAGE_FINANCE_CATEGORIES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to delete category from cache:", e);
  }
}

export const financeService = {
  /**
   * Fetches manual income & expense transactions from Supabase,
   * with local storage fallback if the table doesn't exist yet.
   */
  async getTransactions(): Promise<FinanceTransaction[]> {
    try {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const mapped: FinanceTransaction[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          amount: parseFloat(item.amount.toString()),
          date: item.date,
          description: item.description,
          category: item.category || undefined,
          payment_method: item.payment_method || undefined,
          order_id: item.order_id || null,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        saveCachedFinanceTransactions(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn("Supabase finance_transactions query fallback to local cache:", e);
    }

    // Fallback to local storage
    return getCachedFinanceTransactions();
  },

  /**
   * Creates or updates a manual finance transaction (income or expense)
   */
  async saveTransaction(
    txData: Omit<FinanceTransaction, "id" | "created_at" | "updated_at">,
    existingId?: string
  ): Promise<FinanceTransaction> {
    const nowIso = new Date().toISOString();
    const id = existingId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`);

    const record: FinanceTransaction = {
      id,
      type: txData.type,
      amount: txData.amount,
      date: txData.date,
      description: txData.description,
      category: txData.category,
      payment_method: txData.payment_method,
      order_id: txData.order_id || null,
      created_at: nowIso,
      updated_at: nowIso
    };

    // Update local cache immediately for zero latency
    const current = getCachedFinanceTransactions();
    const idx = current.findIndex((t) => t.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...record, updated_at: nowIso };
    } else {
      current.unshift(record);
    }
    saveCachedFinanceTransactions(current);

    // Sync to Supabase
    try {
      const payload = {
        id: record.id,
        type: record.type,
        amount: record.amount,
        date: record.date,
        description: record.description,
        category: record.category || null,
        payment_method: record.payment_method || null,
        order_id: record.order_id || null,
        updated_at: nowIso
      };

      if (existingId) {
        await supabase
          .from("finance_transactions")
          .update(payload)
          .eq("id", existingId);
      } else {
        await supabase
          .from("finance_transactions")
          .insert({ ...payload, created_at: nowIso });
      }
    } catch (e) {
      console.warn("Supabase save finance transaction error (persisted locally):", e);
    }

    return record;
  },

  /**
   * Deletes a manual transaction by ID
   */
  async deleteTransaction(id: string): Promise<void> {
    // Remove from local cache
    const current = getCachedFinanceTransactions();
    const updated = current.filter((t) => t.id !== id);
    saveCachedFinanceTransactions(updated);

    // Delete in Supabase
    try {
      await supabase
        .from("finance_transactions")
        .delete()
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase delete finance transaction error:", e);
    }
  }
};
