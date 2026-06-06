import type { AdminProduct } from "../components/admin/ProductPreviewModal";

const CSV_HEADERS = [
  "ID",
  "Title",
  "Image",
  "Featured",
  "EnableSizes",
  "SmallEnabled",
  "SmallWidth",
  "SmallHeight",
  "MediumEnabled",
  "MediumWidth",
  "MediumHeight",
  "LargeEnabled",
  "LargeWidth",
  "LargeHeight",
  "EnableMaterials",
  "WoodEnabled",
  "AcrylicEnabled",
  "GlassEnabled",
  "SmallWoodPrice",
  "SmallAcrylicPrice",
  "SmallGlassPrice",
  "MediumWoodPrice",
  "MediumAcrylicPrice",
  "MediumGlassPrice",
  "LargeWoodPrice",
  "LargeAcrylicPrice",
  "LargeGlassPrice",
  "BasePrice"
];

function escapeCSV(val: string): string {
  if (!val) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Triggers a browser download of the products list formatted as a CSV
 */
export function exportToCSV(products: AdminProduct[]) {
  const csvRows = [CSV_HEADERS.join(",")];
  
  for (const p of products) {
    const values = [
      escapeCSV(p.id),
      escapeCSV(p.title),
      escapeCSV(p.image),
      p.featured ? "true" : "false",
      p.enableSizes ? "true" : "false",
      p.sizes.small.enabled ? "true" : "false",
      escapeCSV(p.sizes.small.width),
      escapeCSV(p.sizes.small.height),
      p.sizes.medium.enabled ? "true" : "false",
      escapeCSV(p.sizes.medium.width),
      escapeCSV(p.sizes.medium.height),
      p.sizes.large.enabled ? "true" : "false",
      escapeCSV(p.sizes.large.width),
      escapeCSV(p.sizes.large.height),
      p.enableMaterials ? "true" : "false",
      p.materials.wood ? "true" : "false",
      p.materials.acrylic ? "true" : "false",
      p.materials.glass ? "true" : "false",
      escapeCSV(p.pricingMatrix.small?.wood || ""),
      escapeCSV(p.pricingMatrix.small?.acrylic || ""),
      escapeCSV(p.pricingMatrix.small?.glass || ""),
      escapeCSV(p.pricingMatrix.medium?.wood || ""),
      escapeCSV(p.pricingMatrix.medium?.acrylic || ""),
      escapeCSV(p.pricingMatrix.medium?.glass || ""),
      escapeCSV(p.pricingMatrix.large?.wood || ""),
      escapeCSV(p.pricingMatrix.large?.acrylic || ""),
      escapeCSV(p.pricingMatrix.large?.glass || ""),
      escapeCSV(p.basePrice)
    ];
    csvRows.push(values.join(","));
  }
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses CSV raw text into AdminProduct elements
 */
export function parseCSV(csvContent: string): AdminProduct[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];
  
  const headers = parseCSVLine(lines[0]);
  const parsedProducts: AdminProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 5) continue; // Skip empty/invalid rows
    
    const getVal = (headerName: string, fallback = ""): string => {
      const idx = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
      if (idx === -1 || idx >= row.length) return fallback;
      return row[idx];
    };
    
    const getBool = (headerName: string, fallback = false): boolean => {
      const val = getVal(headerName).toLowerCase();
      if (val === "true" || val === "1" || val === "yes") return true;
      if (val === "false" || val === "0" || val === "no") return false;
      return fallback;
    };
    
    const id = getVal("ID") || `FD-${Math.floor(1000 + Math.random() * 9000)}`;
    const title = getVal("Title", "Unnamed Product");
    const image = getVal("Image", "");
    const featured = getBool("Featured", false);
    const enableSizes = getBool("EnableSizes", true);
    
    const sizes = {
      small: {
        enabled: getBool("SmallEnabled", true),
        width: getVal("SmallWidth", "13"),
        height: getVal("SmallHeight", "15")
      },
      medium: {
        enabled: getBool("MediumEnabled", false),
        width: getVal("MediumWidth", "13"),
        height: getVal("MediumHeight", "17")
      },
      large: {
        enabled: getBool("LargeEnabled", true),
        width: getVal("LargeWidth", "15"),
        height: getVal("LargeHeight", "17")
      }
    };
    
    const enableMaterials = getBool("EnableMaterials", true);
    const materials = {
      wood: getBool("WoodEnabled", true),
      acrylic: getBool("AcrylicEnabled", true),
      glass: getBool("GlassEnabled", true)
    };
    
    const pricingMatrix = {
      small: {
        wood: getVal("SmallWoodPrice", ""),
        acrylic: getVal("SmallAcrylicPrice", ""),
        glass: getVal("SmallGlassPrice", "")
      },
      medium: {
        wood: getVal("MediumWoodPrice", ""),
        acrylic: getVal("MediumAcrylicPrice", ""),
        glass: getVal("MediumGlassPrice", "")
      },
      large: {
        wood: getVal("LargeWoodPrice", ""),
        acrylic: getVal("LargeAcrylicPrice", ""),
        glass: getVal("LargeGlassPrice", "")
      }
    };
    
    const basePrice = getVal("BasePrice", "40");
    
    const product: AdminProduct = {
      id,
      title,
      image,
      enableSizes,
      sizes,
      enableMaterials,
      materials,
      pricingMatrix,
      sizePrices: { small: "30", medium: "40", large: "50" },
      materialPrices: { wood: "22", acrylic: "50", glass: "55" },
      basePrice,
      featured
    };
    
    parsedProducts.push(product);
  }
  
  return parsedProducts;
}
