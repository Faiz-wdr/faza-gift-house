import { supabase } from "../lib/supabase";
import type { Order, OrderItem } from "../components/admin/AdminOrders";

export const orderService = {
  /**
   * Fetches all orders with joined customers and order item products
   */
  async getOrders(): Promise<Order[]> {
    if (typeof window !== "undefined" && localStorage.getItem("faza_local_session")) {
      const stored = localStorage.getItem("faza_local_orders");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      return [];
    }

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
          return {
            productId: prod.product_id,
            productTitle: prod.name,
            productImage: prod.image_url || "/placeholder.png",
            size: item.size_name,
            material: item.material,
            qty: item.quantity,
            price: parseFloat(item.unit_price.toString()),
            total: parseFloat(item.total_price.toString())
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const grandTotal = parseFloat(o.total_amount.toString());
        const additionalCharges = Math.max(0, grandTotal - subtotal);

        return {
          id: o.order_id,
          dbUuid: o.id,
          customerName: customer.name,
          customerPhone: customer.phone || "",
          customerAddress: customer.address || "",
          orderDate: new Date(o.created_at).toISOString().split("T")[0],
          deliveryDate: o.delivery_date || undefined,
          status: o.status as "Delivered" | "Pending" | "In Progress",
          payment: o.payment_status as "Paid" | "Pending" | "Partial",
          trackingId: o.tracking_id || "",
          items,
          subtotal,
          additionalCharges,
          grandTotal,
          paidAmount: parseFloat(o.paid_amount.toString()),
          pendingAmount: parseFloat(o.pending_amount.toString())
        };
      });

      localStorage.setItem("faza_local_orders", JSON.stringify(list));
      return list;
    } catch (dbError) {
      console.warn("Supabase fetch orders failed, checking local cache fallback:", dbError);
      const stored = localStorage.getItem("faza_local_orders");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      return [];
    }
  },

  /**
   * Saves an order, including customer upsert and bulk insertion of line items
   */
  async saveOrder(order: Order): Promise<void> {
    if (typeof window !== "undefined" && localStorage.getItem("faza_local_session")) {
      const stored = localStorage.getItem("faza_local_orders");
      let list: Order[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      const idx = list.findIndex((o) => o.id === order.id);
      if (idx !== -1) {
        list[idx] = order;
      } else {
        list.push(order);
      }
      localStorage.setItem("faza_local_orders", JSON.stringify(list));
      return;
    }

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
    if (typeof window !== "undefined" && localStorage.getItem("faza_local_session")) {
      const stored = localStorage.getItem("faza_local_orders");
      let list: Order[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      list = list.filter((o) => o.id !== orderIdCode);
      localStorage.setItem("faza_local_orders", JSON.stringify(list));
      return;
    }

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
  }
};
