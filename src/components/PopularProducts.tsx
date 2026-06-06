import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Product } from "../data/productsData";
import { productService } from "../services/productService";
import "./PopularProducts.css";

// Helper to label sizes as S, M, L based on array indices
export const getSizeLabel = (size: string, index: number, totalSizes: number): string => {
  if (totalSizes === 1) return `M: ${size}`;
  if (totalSizes === 2) {
    return index === 0 ? `S: ${size}` : `L: ${size}`;
  }
  if (totalSizes === 3) {
    if (index === 0) return `S: ${size}`;
    if (index === 1) return `M: ${size}`;
    return `L: ${size}`;
  }
  return size;
};

// Helper to calculate price depending on size selection
export const getMaterialPrice = (
  product: Product & { pricingMatrix?: any; sizeKeys?: string[] },
  material: "wood" | "acrylic" | "glass",
  sizeIdx: number
) => {
  // Use custom pricing matrix if available
  if (product.pricingMatrix && product.sizeKeys) {
    const sizeKey = product.sizeKeys[sizeIdx];
    if (sizeKey) {
      const priceStr = product.pricingMatrix[sizeKey]?.[material];
      const parsedPrice = parseFloat(priceStr || "0");
      if (parsedPrice > 0) {
        return parsedPrice;
      }
    }
  }

  // Fallback to static offset calculations
  const basePrice = product.materials[material];
  if (basePrice === undefined) return null;
  
  const totalSizes = product.sizes.length;
  if (totalSizes === 2 && sizeIdx === 1) {
    return basePrice + 15;
  }
  if (totalSizes === 3) {
    if (sizeIdx === 1) return basePrice + 10;
    if (sizeIdx === 2) return basePrice + 20;
  }
  return basePrice;
};

function ProductCard({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState(0);

  return (
    <div className="product-card reveal-element">
      <div className="product-image-container">
        <img src={product.image} alt={product.title} className="product-card-image" />
      </div>
      <div className="product-details">
        <h3 className="product-title">{product.title}</h3>
        
        {/* Size Selection Chips */}
        <div className="product-sizes">
          <div className="size-chips">
            {product.sizes.map((size, idx) => (
              <button
                key={idx}
                className={`size-chip ${selectedSize === idx ? "active" : ""}`}
                onClick={() => setSelectedSize(idx)}
                aria-label={`Select size ${size}`}
              >
                {getSizeLabel(size, idx, product.sizes.length)}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Matrix */}
        <div className="pricing-grid">
          {product.materials.wood !== undefined && (
            <div className="price-pill">
              <span>Multi-Wood ₹ {getMaterialPrice(product, "wood", selectedSize)}</span>
            </div>
          )}
          {product.materials.acrylic !== undefined && (
            <div className="price-pill">
              <span>Acrylic ₹ {getMaterialPrice(product, "acrylic", selectedSize)}</span>
            </div>
          )}
          {product.materials.glass !== undefined && (
            <div className="price-pill">
              <span>Glass ₹ {getMaterialPrice(product, "glass", selectedSize)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadPopularProducts() {
      try {
        const dbProducts = await productService.getProducts({ forPublic: true });
        if (dbProducts) {
          const mapped = dbProducts.map((p) => productService.mapAdminProductToPublic(p));
          
          // Filter to only show featured products
          const featured = mapped.filter((p) => p.featured);
          if (featured.length > 0) {
            setProducts(featured.slice(0, 6));
          } else {
            // Sort by popularity and take first 6
            const sorted = [...mapped].sort((a, b) => b.popularity - a.popularity);
            setProducts(sorted.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("Error loading popular products from Supabase:", err);
      }
    }
    loadPopularProducts();
  }, []);

  return (
    <section id="products" className="products-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header reveal-element">
          <h2 className="section-title">Popular Products</h2>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products-container reveal-element" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>No popular products found.</p>
          </div>
        )}

        {/* View All CTA */}
        <div className="view-all-container reveal-element">
          <Link to="/products" className="view-all-link" id="products-view-all-link">
            <span>View All</span>
            <ArrowRight size={16} className="arrow-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
