import { supabase } from "../lib/supabase";
import type { Order, OrderItem } from "../components/admin/AdminOrders";

export const orderService = {
  /**
   * Fetches all orders with joined customers and order item products
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

      if (error) throw error;
      if (!dbOrders) return [];

      const list = dbOrders.map((o: any) => {
        const customer = o.customers || { name: "", phone: "", address: "" };
        const dbItems = o.order_items || [];

        const items: OrderItem[] = dbItems.map((item: any) => {
          const prod = item.products || { product_id: "", name: "", image_url: "" };
          const unitPrice = item.unit_price != null ? parseFloat(String(item.unit_price)) : 0;
          const totalPrice = item.total_price != null ? parseFloat(String(item.total_price)) : 0;
          return {
            productId: prod.product_id,
            productTitle: prod.name,
            productImage: prod.image_url || "/placeholder.png",
            size: item.size_name,
            material: item.material,
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

      return list;
    } catch (dbError) {
      console.error("Supabase fetch orders failed:", dbError);
      return [];
    }
  },

  /**
   * Saves an order, including customer upsert and bulk insertion of line items
   */
  async saveOrder(order: Order): Promise<void> {
    // 1. Upsert customer profile
    let customerIdUuid: string;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("name", order.customerName)
      .eq("phone", order.customerPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerIdUuid = existingCustomer.id;
      // Update address details in customer record
      await supabase
        .from("customers")
        .update({ address: order.customerAddress })
        .eq("id", customerIdUuid);
    } else {
      // Create a new customer profile
      const { data: newCustomer, error: custError } = await supabase
        .from("customers")
        .insert({
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress
        })
        .select("id")
        .single();

      if (custError) throw custError;
      customerIdUuid = newCustomer.id;
    }

    // 2. Prepare Order Payload
    const orderPayload = {
      order_id: order.id,
      customer_id: customerIdUuid,
      status: order.status,
      payment_status: order.payment,
      total_amount: order.grandTotal,
      paid_amount: order.paidAmount,
      pending_amount: order.pendingAmount,
      tracking_id: order.trackingId,
      delivery_date: order.deliveryDate || null
    };

    let orderIdUuid: string;
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingOrder) {
      orderIdUuid = existingOrder.id;
      const { error: ordError } = await supabase
        .from("orders")
        .update(orderPayload)
        .eq("id", orderIdUuid);

      if (ordError) throw ordError;
    } else {
      const { data: newOrder, error: ordError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (ordError) throw ordError;
      orderIdUuid = newOrder.id;
    }

    // 3. Re-populate Order Items
    // Clean old order lines
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderIdUuid);

    // Fetch matching products to gather internal database UUID keys
    const productIds = order.items.map((i) => i.productId);
    const { data: dbProds, error: prodsError } = await supabase
      .from("products")
      .select("id, product_id")
      .in("product_id", productIds);

    if (prodsError) throw prodsError;

    const itemsPayload = order.items.map((item) => {
      const dbProd = dbProds?.find((p) => p.product_id === item.productId);
      if (!dbProd) {
        throw new Error(`Product with ID code ${item.productId} was not found in catalog database.`);
      }
      return {
        order_id: orderIdUuid,
        product_id: dbProd.id,
        size_name: item.size,
        material_name: item.material,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.total
      };
    });

    if (itemsPayload.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;
    }
  },

  /**
   * Deletes an order and cascades automatically to line items
   */
  async deleteOrder(orderIdCode: string): Promise<void> {
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id")
      .eq("order_id", orderIdCode)
      .maybeSingle();

    if (findError) throw findError;
    if (!order) return;

    // Cascades delete to order_items automatically via PostgreSQL FK delete cascades
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (deleteError) throw deleteError;
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

