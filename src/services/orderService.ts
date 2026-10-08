import { supabase } from "../lib/supabase";
import type { Order, OrderItem } from "../components/admin/AdminOrders";

const LOCAL_STORAGE_ORDERS_KEY = "faza_saved_orders";

export function getCachedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedOrders(orders: Order[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders to cache:", e);
  }
}

export const orderService = {
  /**
   * Fetches all orders with joined customers and order item products,
   * with local storage fallback if the database query fails or is empty.
   */
  async getOrders(): Promise<Order[]> {
    try {
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers:customer_id (name, phone, address),
          order_items (
            *,
            products:product_id (product_id, name, image_url)
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && dbOrders && dbOrders.length > 0) {
        const list: Order[] = dbOrders.map((o: any) => {
          const customer = o.customers || { name: "", phone: "", address: "" };
          const dbItems = o.order_items || [];

          const items: OrderItem[] = dbItems.map((item: any) => {
            const prod = item.products || { product_id: "", name: "", image_url: "" };
            const unitPrice = item.unit_price != null ? parseFloat(String(item.unit_price)) : 0;
            const totalPrice = item.total_price != null ? parseFloat(String(item.total_price)) : 0;
            return {
              productId: prod.product_id || item.product_id || "custom-item",
              productTitle: prod.name || item.size_name || "Custom Memento",
              productImage: prod.image_url || "/placeholder.png",
              size: item.size_name || "",
              material: item.material_name || "",
              qty: Number(item.quantity) || 1,
              price: isNaN(unitPrice) ? 0 : unitPrice,
              total: isNaN(totalPrice) ? 0 : totalPrice
            };
          });

          const subtotal = items.reduce((sum, item) => sum + item.total, 0);
          const rawTotal = o.total_amount != null ? parseFloat(String(o.total_amount)) : 0;
          const grandTotal = isNaN(rawTotal) ? subtotal : rawTotal;
          const additionalCharges = Math.max(0, grandTotal - subtotal);

          let orderDateStr = new Date().toISOString().split("T")[0];
          if (o.created_at) {
            try {
              const parsed = new Date(o.created_at);
              if (!isNaN(parsed.getTime())) {
                orderDateStr = parsed.toISOString().split("T")[0];
              }
            } catch {
              // Keep default
            }
          }

          const rawPaid = o.paid_amount != null ? parseFloat(String(o.paid_amount)) : 0;
          const rawPending = o.pending_amount != null ? parseFloat(String(o.pending_amount)) : 0;

          return {
            id: o.order_id || String(o.id || "ORD"),
            dbUuid: o.id,
            customerName: customer.name || "Customer",
            customerPhone: customer.phone || "",
            customerAddress: customer.address || "",
            orderDate: orderDateStr,
            deliveryDate: o.delivery_date || undefined,
            status: (o.status || "Pending") as "Delivered" | "Pending" | "In Progress",
            payment: (o.payment_status || "Pending") as "Paid" | "Pending" | "Partial",
            trackingId: o.tracking_id || "",
            items,
            subtotal,
            additionalCharges,
            grandTotal,
            paidAmount: isNaN(rawPaid) ? 0 : rawPaid,
            pendingAmount: isNaN(rawPending) ? 0 : rawPending
          };
        });

        // Merge with locally cached orders so any locally created orders are not lost
        const cached = getCachedOrders();
        const merged = [...list];
        const unSynced: Order[] = [];
        cached.forEach((co) => {
          if (!merged.some((m) => m.id === co.id)) {
            merged.push(co);
            unSynced.push(co);
          }
        });

        // Auto-sync any local-only orders up to Supabase in the background
        if (unSynced.length > 0) {
          unSynced.forEach((uo) => {
            orderService.syncOrderToSupabase(uo).catch((err) => {
              console.warn("Background auto-sync order error:", err);
            });
          });
        }

        saveCachedOrders(merged);
        return merged;
      }
    } catch (dbError) {
      console.warn("Supabase fetch orders failed, falling back to cached orders:", dbError);
    }

    return getCachedOrders();
  },

  /**
   * Synchronizes an individual order to Supabase
   */
  async syncOrderToSupabase(order: Order): Promise<void> {
    try {
      // 1. Upsert customer profile
      const custName = (order.customerName && order.customerName.trim()) || "Walk-in Customer";
      let customerIdUuid: string | null = null;

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("name", custName)
        .maybeSingle();

      if (existingCustomer) {
        customerIdUuid = existingCustomer.id;
        await supabase
          .from("customers")
          .update({
            phone: order.customerPhone || "",
            address: order.customerAddress || ""
          })
          .eq("id", customerIdUuid);
      } else {
        const { data: newCustomer, error: custInsertError } = await supabase
          .from("customers")
          .insert({
            name: custName,
            phone: order.customerPhone || "",
            address: order.customerAddress || ""
          })
          .select("id")
          .single();

        if (newCustomer) {
          customerIdUuid = newCustomer.id;
        } else if (custInsertError) {
          console.warn("Supabase customer insert warning:", custInsertError);
        }
      }

      if (!customerIdUuid) {
        console.warn("Customer could not be resolved in Supabase, order will be stored locally.");
        return;
      }

      // 2. Upsert Order
      const orderPayload = {
        order_id: order.id,
        customer_id: customerIdUuid,
        status: order.status || "Pending",
        payment_status: order.payment || "Pending",
        total_amount: order.grandTotal || 0,
        paid_amount: order.paidAmount || 0,
        pending_amount: order.pendingAmount || 0,
        tracking_id: order.trackingId || "",
        delivery_date: order.deliveryDate || null
      };

      let orderIdUuid: string | null = null;
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();

      if (existingOrder) {
        orderIdUuid = existingOrder.id;
        await supabase
          .from("orders")
          .update(orderPayload)
          .eq("id", orderIdUuid);
      } else {
        const { data: newOrder, error: ordError } = await supabase
          .from("orders")
          .insert(orderPayload)
          .select("id")
          .single();

        if (newOrder) {
          orderIdUuid = newOrder.id;
        } else if (ordError) {
          console.warn("Supabase order insert warning:", ordError);
        }
      }

      if (!orderIdUuid) {
        return;
      }

      // 3. Re-populate Order Items
      await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderIdUuid);

      // Fetch matching products for foreign keys
      const { data: dbProds } = await supabase
        .from("products")
        .select("id, product_id");

      const defaultProductUuid = dbProds && dbProds.length > 0 ? dbProds[0].id : null;

      if (order.items && order.items.length > 0) {
        const itemsPayload = order.items
          .map((item) => {
            const matchedProd = dbProds?.find(
              (p) => p.product_id === item.productId || p.id === item.productId
            );
            const targetUuid = matchedProd?.id || defaultProductUuid;
            if (!targetUuid) return null;

            return {
              order_id: orderIdUuid,
              product_id: targetUuid,
              size_name: item.size || "Standard",
              material_name: item.material || "Standard",
              quantity: Math.max(1, Number(item.qty) || 1),
              unit_price: Math.max(0, Number(item.price) || 0),
              total_price: Math.max(0, Number(item.total) || 0)
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (itemsPayload.length > 0) {
          await supabase.from("order_items").insert(itemsPayload);
        }
      }
    } catch (syncErr) {
      console.warn("Supabase order sync error:", syncErr);
    }
  },

  /**
   * Saves an order. Immediately persists to local storage cache for zero-latency
   * and offline resilience, then asynchronously synchronizes to Supabase.
   */
  async saveOrder(order: Order): Promise<void> {
    // 1. Immediately persist to local cache
    const current = getCachedOrders();
    const existingIndex = current.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...order };
    } else {
      current.unshift(order);
    }
    saveCachedOrders(current);

    // 2. Also persist customer details to cache
    if (order.customerName && order.customerName.trim()) {
      saveCachedCustomer({
        name: order.customerName.trim(),
        phone: order.customerPhone || "",
        address: order.customerAddress || ""
      });
    }

    // 3. Synchronize with Supabase database
    await this.syncOrderToSupabase(order);
  },

  /**
   * Deletes an order from local cache and attempts database removal
   */
  async deleteOrder(orderIdCode: string): Promise<void> {
    // 1. Remove from local cache
    const current = getCachedOrders();
    const updated = current.filter((o) => o.id !== orderIdCode);
    saveCachedOrders(updated);

    // 2. Remove from Supabase if connected
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_id", orderIdCode)
        .maybeSingle();

      if (order) {
        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);
      }
    } catch (syncErr) {
      console.warn("Supabase deleteOrder warning:", syncErr);
    }
  },

  /**
   * Fetches all registered customer profiles
   */
  async getCustomers(): Promise<CustomerProfile[]> {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("name, phone, address")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map((c: any) => ({
        name: c.name || "",
        phone: c.phone || "",
        address: c.address || ""
      }));
    } catch (dbError) {
      console.error("Supabase fetch customers failed:", dbError);
      return [];
    }
  },

  /**
   * Upserts a customer profile record
   */
  async saveCustomer(customer: CustomerProfile): Promise<void> {
    if (!customer.name.trim()) return;
    try {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("name", customer.name.trim())
        .maybeSingle();

      if (existing) {
        await supabase
          .from("customers")
          .update({
            phone: customer.phone,
            address: customer.address
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("customers")
          .insert({
            name: customer.name.trim(),
            phone: customer.phone,
            address: customer.address
          });
      }
    } catch (e) {
      console.error("Supabase saveCustomer error:", e);
    }
  },

  /**
   * Deletes a customer profile record
   */
  async deleteCustomer(customerName: string): Promise<void> {
    if (!customerName.trim()) return;
    try {
      await supabase
        .from("customers")
        .delete()
        .eq("name", customerName.trim());
    } catch (e) {
      console.error("Supabase deleteCustomer error:", e);
    }
  }
};

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
}

const LOCAL_STORAGE_CUSTOMERS_KEY = "faza_saved_customers";

export function getCachedCustomers(): CustomerProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedCustomer(customer: CustomerProfile) {
  if (!customer.name.trim()) return;
  try {
    const current = getCachedCustomers();
    const existingIndex = current.findIndex(
      (c) =>
        c.name.trim().toLowerCase() === customer.name.trim().toLowerCase() ||
        (customer.phone && c.phone && c.phone.trim() === customer.phone.trim())
    );
    if (existingIndex >= 0) {
      current[existingIndex] = {
        name: customer.name.trim(),
        phone: customer.phone ? customer.phone.trim() : current[existingIndex].phone,
        address: customer.address ? customer.address.trim() : current[existingIndex].address,
      };
    } else {
      current.push({
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      });
    }
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error("Failed to save customer cache:", e);
  }
}

export function deleteCachedCustomer(customerName: string) {
  if (!customerName.trim()) return;
  try {
    const current = getCachedCustomers();
    const updated = current.filter(
      (c) => c.name.trim().toLowerCase() !== customerName.trim().toLowerCase()
    );
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete customer from cache:", e);
  }
}

