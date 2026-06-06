import { supabase } from "../lib/supabase";
import { storageService } from "./storageService";
import type { AdminProduct } from "../components/admin/ProductPreviewModal";
import { productsData } from "../data/productsData";

function initializeAdminProductsFromMock(): AdminProduct[] {
  return productsData.map((p) => {
    const isSmallEnabled = p.sizes.some((s) => s.includes("13 x 15"));
    const isMediumEnabled = p.sizes.some((s) => s.includes("13 x 17"));
    const isLargeEnabled = p.sizes.some((s) => s.includes("15 x 17"));
    
    const sizes = {
      small: { enabled: isSmallEnabled, width: "13", height: "15" },
      medium: { enabled: isMediumEnabled, width: "13", height: "17" },
      large: { enabled: isLargeEnabled, width: "15", height: "17" }
    };

    const materials = {
      wood: p.materials.wood !== undefined,
      acrylic: p.materials.acrylic !== undefined,
      glass: p.materials.glass !== undefined
    };

    const pricingMatrix: { [s: string]: { [m: string]: string } } = {
      small: {
        wood: p.materials.wood?.toString() || "",
        acrylic: p.materials.acrylic?.toString() || "",
        glass: p.materials.glass?.toString() || ""
      },
      medium: { wood: "", acrylic: "", glass: "" },
      large: {
        wood: p.materials.wood?.toString() || "",
        acrylic: p.materials.acrylic?.toString() || "",
        glass: p.materials.glass?.toString() || ""
      }
    };

    return {
      id: `FD-${1000 + p.id}`,
      title: p.title,
      image: p.image,
      enableSizes: p.sizes.length > 0,
      sizes,
      enableMaterials: Object.keys(p.materials).length > 0,
      materials,
      pricingMatrix,
      sizePrices: { small: "", medium: "", large: "" },
      materialPrices: { wood: "", acrylic: "", glass: "" },
      basePrice: "40",
      featured: p.popularity >= 90
    };
  });
}

export const productService = {
  /**
   * Fetches all products and joins related sizes, materials, and pricing data
   */
  async getProducts(options?: { forPublic?: boolean }): Promise<AdminProduct[]> {
    const forPublic = options?.forPublic ?? false;
    const hasLocalSession = typeof window !== "undefined" && localStorage.getItem("faza_local_session");
    const isSupabaseUnconfigured = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key-here";

    // 1. If in local session mode (admin) AND not a public-facing request, load from local storage
    //    Public-facing pages always try Supabase first to show real data
    if ((hasLocalSession && !forPublic) || isSupabaseUnconfigured) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("faza_local_products");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      
      // Fallback: load mock products
      const initial = initializeAdminProductsFromMock();
      if (typeof window !== "undefined") {
        localStorage.setItem("faza_local_products", JSON.stringify(initial));
      }
      return initial;
    }

    try {
      const [prodsRes, sizesRes, matsRes, pricesRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: true }),
        supabase.from("product_sizes").select("*"),
        supabase.from("product_materials").select("*"),
        supabase.from("product_pricing").select("*")
      ]);

      if (prodsRes.error) throw prodsRes.error;
      if (sizesRes.error) throw sizesRes.error;
      if (matsRes.error) throw matsRes.error;
      if (pricesRes.error) throw pricesRes.error;

      const dbProducts = prodsRes.data || [];
      const dbSizes = sizesRes.data || [];
      const dbMaterials = matsRes.data || [];
      const dbPricing = pricesRes.data || [];

      // Map database relational tables to the AdminProduct frontend interface
      const list = dbProducts.map((p) => {
        // Find sizes matching product primary key
        const pSizes = dbSizes.filter((s) => s.product_id === p.id);
        const sizes = {
          small: { enabled: false, width: "13", height: "15" },
          medium: { enabled: false, width: "13", height: "17" },
          large: { enabled: false, width: "15", height: "17" }
        };
        pSizes.forEach((s) => {
          const key = s.size_name as "small" | "medium" | "large";
          if (sizes[key]) {
            sizes[key] = {
              enabled: s.enabled,
              width: s.width || sizes[key].width,
              height: s.height || sizes[key].height
            };
          }
        });

        // Find materials matching product primary key
        const pMats = dbMaterials.filter((m) => m.product_id === p.id);
        const materials = {
          wood: false,
          acrylic: false,
          glass: false
        };
        pMats.forEach((m) => {
          const key = m.material_name as "wood" | "acrylic" | "glass";
          if (key in materials) {
            materials[key] = m.enabled;
          }
        });

        // Construct pricing matrix
        const pricingMatrix: { [s: string]: { [m: string]: string } } = {
          small: { wood: "", acrylic: "", glass: "" },
          medium: { wood: "", acrylic: "", glass: "" },
          large: { wood: "", acrylic: "", glass: "" }
        };

        const pPrices = dbPricing.filter((pr) => pr.product_id === p.id);
        pPrices.forEach((pr) => {
          const sKey = pr.size_name;
          const mKey = pr.material_name;
          if (pricingMatrix[sKey] && mKey in pricingMatrix[sKey]) {
            pricingMatrix[sKey][mKey] = pr.price.toString();
          }
        });

        // Find base price (fallback or first available enabled price)
        let basePrice = "40";
        const enabledPrice = pPrices.find((pr) => parseFloat(pr.price.toString()) > 0);
        if (enabledPrice) {
          basePrice = enabledPrice.price.toString();
        }

        return {
          id: p.product_id,
          dbUuid: p.id,
          title: p.name,
          image: p.image_url || "/placeholder.png",
          enableSizes: pSizes.length > 0,
          sizes,
          enableMaterials: pMats.length > 0,
          materials,
          pricingMatrix,
          sizePrices: { small: "", medium: "", large: "" },
          materialPrices: { wood: "", acrylic: "", glass: "" },
          basePrice,
          featured: p.featured_on_homepage
        };
      });

      // Backup to localStorage and return if we fetched actual records
      if (list.length > 0) {
        localStorage.setItem("faza_local_products", JSON.stringify(list));
        return list;
      }

      // If database was successfully queried but had 0 products, try to load cached local products
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("faza_local_products");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      // Fallback to initial mock products if everything is empty
      return initializeAdminProductsFromMock();
    } catch (dbError) {
      console.warn("Supabase fetch products failed, checking local cache fallback:", dbError);
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("faza_local_products");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      return initializeAdminProductsFromMock();
    }
  },

  /**
   * Saves a product (Add/Edit) upserting product info and configuration matrices
   */
  async saveProduct(adminProd: AdminProduct): Promise<void> {
    if (typeof window !== "undefined" && localStorage.getItem("faza_local_session")) {
      const stored = localStorage.getItem("faza_local_products");
      let list: AdminProduct[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      const idx = list.findIndex((p) => p.id === adminProd.id);
      if (idx !== -1) {
        list[idx] = adminProd;
      } else {
        list.push(adminProd);
      }
      localStorage.setItem("faza_local_products", JSON.stringify(list));
      return;
    }

    // 1. Check if product already exists by product_id
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("product_id", adminProd.id)
      .maybeSingle();

    const productPayload = {
      product_id: adminProd.id,
      name: adminProd.title,
      image_url: adminProd.image,
      featured_on_homepage: adminProd.featured,
      popularity: 80 // Default popularity scale
    };

    let productIdUuid: string;

    if (existingProduct) {
      // Edit mode: Update product
      productIdUuid = existingProduct.id;
      
      const { error: updateError } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", productIdUuid);

      if (updateError) throw updateError;

      // Delete old image asset from Storage if a new one is uploaded
      if (existingProduct.image_url && existingProduct.image_url !== adminProd.image) {
        await storageService.deleteAsset(existingProduct.image_url);
      }
    } else {
      // Add mode: Insert product
      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();

      if (insertError) throw insertError;
      productIdUuid = insertedProduct.id;
    }

    // 2. Refresh Sizes configuration
    // Clean old sizing rows
    await supabase.from("product_sizes").delete().eq("product_id", productIdUuid);

    const sizesPayload = (["small", "medium", "large"] as const).map((sz) => {
      const config = adminProd.sizes[sz];
      return {
        product_id: productIdUuid,
        size_name: sz,
        width: config.width,
        height: config.height,
        enabled: config.enabled
      };
    });

    const { error: sizesError } = await supabase
      .from("product_sizes")
      .insert(sizesPayload);
    if (sizesError) throw sizesError;

    // 3. Refresh Materials configuration
    // Clean old materials rows
    await supabase.from("product_materials").delete().eq("product_id", productIdUuid);

    const materialsPayload = (["wood", "acrylic", "glass"] as const).map((mat) => {
      const isEnabled = adminProd.materials[mat];
      return {
        product_id: productIdUuid,
        material_name: mat,
        enabled: isEnabled
      };
    });

    const { error: matsError } = await supabase
      .from("product_materials")
      .insert(materialsPayload);
    if (matsError) throw matsError;

    // 4. Refresh Pricing Matrix rows
    // Clean old pricing rows
    await supabase.from("product_pricing").delete().eq("product_id", productIdUuid);

    const pricingPayload: { product_id: string; size_name: string; material_name: string; price: number }[] = [];

    // Push only enabled matrix combinations
    (["small", "medium", "large"] as const).forEach((sz) => {
      if (!adminProd.sizes[sz].enabled) return;

      (["wood", "acrylic", "glass"] as const).forEach((mat) => {
        if (!adminProd.materials[mat]) return;

        const priceVal = parseFloat(adminProd.pricingMatrix[sz]?.[mat] || "0");
        if (priceVal > 0) {
          pricingPayload.push({
            product_id: productIdUuid,
            size_name: sz,
            material_name: mat,
            price: priceVal
          });
        }
      });
    });

    if (pricingPayload.length > 0) {
      const { error: pricingError } = await supabase
        .from("product_pricing")
        .insert(pricingPayload);
      if (pricingError) throw pricingError;
    }
  },

  /**
   * Deletes a product from the database and cleans up its storage binary
   */
  async deleteProduct(productIdCode: string): Promise<void> {
    if (typeof window !== "undefined" && localStorage.getItem("faza_local_session")) {
      const stored = localStorage.getItem("faza_local_products");
      let list: AdminProduct[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      list = list.filter((p) => p.id !== productIdCode);
      localStorage.setItem("faza_local_products", JSON.stringify(list));
      return;
    }

    const { data: product, error: findError } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("product_id", productIdCode)
      .maybeSingle();

    if (findError) throw findError;
    if (!product) return;

    // Delete record from database (cascades automatically to sizes, materials, prices)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) throw deleteError;

    // Delete associated image binary
    if (product.image_url) {
      await storageService.deleteAsset(product.image_url);
    }
  },

  mapAdminProductToPublic(ap: AdminProduct) {
    const apSizes = ap.sizes || {
      small: { enabled: false, width: "", height: "" },
      medium: { enabled: false, width: "", height: "" },
      large: { enabled: false, width: "", height: "" }
    };
    
    const apMaterials = ap.materials || {
      wood: false,
      acrylic: false,
      glass: false
    };

    const apPricing = ap.pricingMatrix || {
      small: { wood: "", acrylic: "", glass: "" },
      medium: { wood: "", acrylic: "", glass: "" },
      large: { wood: "", acrylic: "", glass: "" }
    };

    const materials: { wood?: number; acrylic?: number; glass?: number } = {};
    const matKeys = ["wood", "acrylic", "glass"] as const;
    
    const sizes: string[] = [];
    const sizeKeys: string[] = [];
    const sizeKeysOrdered = ["small", "medium", "large"] as const;
    
    sizeKeysOrdered.forEach((sKey) => {
      const config = apSizes[sKey];
      if (config && config.enabled) {
        sizes.push(`${config.width || ""} x ${config.height || ""} CM`);
        sizeKeys.push(sKey);
      }
    });

    matKeys.forEach((mKey) => {
      if (apMaterials[mKey]) {
        const firstEnabledSize = sizeKeysOrdered.find((sKey) => apSizes[sKey]?.enabled);
        if (firstEnabledSize) {
          const price = parseFloat(apPricing[firstEnabledSize]?.[mKey] || "0");
          if (price > 0) {
            materials[mKey] = price;
          }
        }
      }
    });

    // Fallback: If no material price was resolved, resolve at least one price
    if (Object.keys(materials).length === 0) {
      const baseVal = parseFloat(ap.basePrice || "40");
      if (apMaterials.wood) materials.wood = baseVal;
      else if (apMaterials.acrylic) materials.acrylic = baseVal;
      else if (apMaterials.glass) materials.glass = baseVal;
      else materials.acrylic = baseVal; // ultimate fallback
    }

    return {
      id: parseInt(ap.id?.replace(/\D/g, "") || "") || Math.floor(Math.random() * 1000),
      title: ap.title || "Untitled Product",
      image: ap.image || "/placeholder.png",
      materials,
      sizes: sizes.length > 0 ? sizes : ["13 x 15 CM"],
      sizeKeys: sizeKeys.length > 0 ? sizeKeys : ["small"],
      popularity: ap.featured ? 95 : 70,
      featured: !!ap.featured,
      dateAdded: "2026-06-05",
      pricingMatrix: apPricing,
      productCode: ap.id || `FD-${Math.floor(Math.random() * 10000)}`
    };
  }
};
