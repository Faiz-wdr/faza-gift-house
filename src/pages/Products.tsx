import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import { SlidersHorizontal, X, ArrowRight, MessageCircle } from "lucide-react";
import type { Product } from "../data/productsData";
import BulkCTA from "../components/BulkCTA";
import { getSizeLabel, getMaterialPrice } from "../components/PopularProducts";
import { productService } from "../services/productService";
import { bannerService } from "../services/bannerService";

// Swiper CSS
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import "../components/PopularProducts.css";
import "./Products.css";



export default function Products() {
  // Filters & Sorting State
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Dynamic Products State
  const [products, setProducts] = useState<Product[]>([]);

  // Ad Banners State
  const [adBanners, setAdBanners] = useState<{ id: string; image: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      // Load Ad Banners
      try {
        const dbBanners = await bannerService.getBanners({ forPublic: true });
        if (dbBanners) {
          setAdBanners(dbBanners);
        }
      } catch (e) {
        console.error("Error loading ad banners from Supabase:", e);
      }

      // Load Products
      try {
        const dbProducts = await productService.getProducts({ forPublic: true });
        if (dbProducts) {
          const mapped = dbProducts.map((p) => productService.mapAdminProductToPublic(p));
          setProducts(mapped);
        }
      } catch (e) {
        console.error("Error loading products from Supabase:", e);
      }
    }
    loadData();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedMaterial, selectedSize, sortBy]);

  // Helper to extract a single price from product for sorting
  const getProductPriceForSorting = (product: Product) => {
    if (selectedMaterial !== "all") {
      const price = product.materials[selectedMaterial as keyof typeof product.materials];
      if (price !== undefined) return price;
    }
    // Else, return the cheapest available price
    const availablePrices = Object.values(product.materials).filter(Boolean) as number[];
    return Math.min(...availablePrices);
  };

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    // Material filter
    if (selectedMaterial !== "all") {
      if (!product.materials[selectedMaterial as keyof typeof product.materials]) {
        return false;
      }
    }
    // Size filter
    if (selectedSize !== "all") {
      const cleanSize = selectedSize.replace(/\s+/g, "");
      const hasMatch = product.sizes.some(
        (size) => size.replace(/\s+/g, "") === cleanSize
      );
      if (!hasMatch) return false;
    }
    return true;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "popularity") {
      return b.popularity - a.popularity;
    } else if (sortBy === "price-low-high") {
      return getProductPriceForSorting(a) - getProductPriceForSorting(b);
    } else if (sortBy === "price-high-low") {
      return getProductPriceForSorting(b) - getProductPriceForSorting(a);
    } else if (sortBy === "newest") {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
    return 0;
  });

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, sortedProducts.length));
  };

  // Unique Product Card component inside Products.tsx for local state control
  function CatalogCard({ product }: { product: Product }) {
    const [activeSizeIdx, setActiveSizeIdx] = useState(0);

    const handleOrderClick = () => {
      const sizeStr = product.sizes[activeSizeIdx] || product.sizes[0];
      // Get the first available material as a default if selectedMaterial is 'all'
      let activeMat = selectedMaterial;
      if (selectedMaterial === "all") {
        if (product.materials.acrylic) activeMat = "acrylic";
        else if (product.materials.wood) activeMat = "wood";
        else activeMat = "glass";
      }

      const priceVal = getMaterialPrice(product, activeMat as any, activeSizeIdx) ||
        Object.values(product.materials)[0];

      const text = `Hello Faza Gift House, I would like to order/get a quote for:
Product: *${product.title}*
Material: *${activeMat.toUpperCase()}*
Size: *${sizeStr}*
Est. Price: *₹${priceVal}*`;

      window.open(`https://wa.me/919188086244?text=${encodeURIComponent(text)}`, "_blank");
    };

    return (
      <div className="product-card reveal-element">
        <div className="product-image-container" onClick={handleOrderClick} style={{ cursor: "pointer" }}>
          <img src={product.image} alt={product.title} className="product-card-image" />
          <div className="card-quick-view">
            <span>Order on WhatsApp</span>
            <MessageCircle size={16} />
          </div>
        </div>
        <div className="product-details">
          <h3 className="product-title" onClick={handleOrderClick} style={{ cursor: "pointer" }}>{product.title}</h3>

          {/* Size Select chips */}
          <div className="product-sizes">
            <div className="size-chips">
              {product.sizes.map((sz, i) => (
                <button
                  key={i}
                  className={`size-chip ${activeSizeIdx === i ? "active" : ""}`}
                  onClick={() => setActiveSizeIdx(i)}
                >
                  {getSizeLabel(sz, i, product.sizes.length)}
                </button>
              ))}
            </div>
          </div>

          {/* Available pricing list */}
          <div className="pricing-grid">
            {product.materials.wood && (
              <div className={`price-pill ${selectedMaterial === "wood" ? "highlight" : ""}`}>
                <span>Multi-Wood ₹ {getMaterialPrice(product, "wood", activeSizeIdx)}</span>
              </div>
            )}
            {product.materials.acrylic && (
              <div className={`price-pill ${selectedMaterial === "acrylic" ? "highlight" : ""}`}>
                <span>Acrylic ₹ {getMaterialPrice(product, "acrylic", activeSizeIdx)}</span>
              </div>
            )}
            {product.materials.glass && (
              <div className={`price-pill ${selectedMaterial === "glass" ? "highlight" : ""}`}>
                <span>Glass ₹ {getMaterialPrice(product, "glass", activeSizeIdx)}</span>
              </div>
            )}
          </div>

          <button className="btn btn-card-order" onClick={handleOrderClick}>
            Get Custom Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* SECTION 1: Memento Ad / Hero Slider */}
      {adBanners.length > 0 && (
        <section className="products-hero-section">
          <div className="container">
            <div className="products-hero-slider">
              <Swiper
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                pagination={{
                  clickable: true,
                  el: ".products-slider-pagination",
                }}
                loop={adBanners.length > 1}
                className="products-swiper"
              >
                {adBanners.map((slide, idx) => (
                  <SwiperSlide key={slide.id || idx} className="products-slide">
                    <div className="products-slide-image-wrapper">
                      <img src={slide.image} alt={`Ad Banner ${idx + 1}`} className="products-slide-image" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {/* Pagination Bullet Container */}
              <div className="products-slider-pagination"></div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Products Listing (Core) */}
      <section className="catalog-section">
        <div className="container">

          {/* Header Row */}
          <div className="catalog-header reveal-element">
            <div className="header-left">
              <h1 className="catalog-title">Explore Products</h1>
            </div>

            <div className="header-right">
              {/* Mobile Filter Toggle Button */}
              <button
                className="btn btn-filter-toggle"
                onClick={() => setMobileFiltersOpen(true)}
                id="catalog-mobile-filter-btn"
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
              </button>

              {/* Sorting Dropdown */}
              <div className="sort-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                  id="catalog-sort-select"
                  aria-label="Sort products list"
                >
                  <option value="popularity">Sort by Popularity</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="newest">Sort by Newest</option>
                </select>
              </div>
            </div>
          </div>

          <div className="catalog-layout">

            {/* Sidebar Filters (Desktop) */}
            <aside className="catalog-sidebar reveal-element">
              <div className="filter-group">
                <h4 className="filter-group-title">Filter by Material</h4>
                <div className="filter-options">
                  <button
                    className={`filter-btn ${selectedMaterial === "all" ? "active" : ""}`}
                    onClick={() => setSelectedMaterial("all")}
                  >
                    All Materials
                  </button>
                  <button
                    className={`filter-btn ${selectedMaterial === "wood" ? "active" : ""}`}
                    onClick={() => setSelectedMaterial("wood")}
                  >
                    Multi-Wood
                  </button>
                  <button
                    className={`filter-btn ${selectedMaterial === "acrylic" ? "active" : ""}`}
                    onClick={() => setSelectedMaterial("acrylic")}
                  >
                    Acrylic
                  </button>
                  <button
                    className={`filter-btn ${selectedMaterial === "glass" ? "active" : ""}`}
                    onClick={() => setSelectedMaterial("glass")}
                  >
                    Glass
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <h4 className="filter-group-title">Filter by Size</h4>
                <div className="filter-options">
                  <button
                    className={`filter-btn ${selectedSize === "all" ? "active" : ""}`}
                    onClick={() => setSelectedSize("all")}
                  >
                    All Sizes
                  </button>
                  <button
                    className={`filter-btn ${selectedSize === "13 x 15 CM" ? "active" : ""}`}
                    onClick={() => setSelectedSize("13 x 15 CM")}
                  >
                    13 x 15 CM
                  </button>
                  <button
                    className={`filter-btn ${selectedSize === "13 x 17 CM" ? "active" : ""}`}
                    onClick={() => setSelectedSize("13 x 17 CM")}
                  >
                    13 x 17 CM
                  </button>
                  <button
                    className={`filter-btn ${selectedSize === "15 x 17 CM" ? "active" : ""}`}
                    onClick={() => setSelectedSize("15 x 17 CM")}
                  >
                    15 x 17 CM
                  </button>
                </div>
              </div>
            </aside>

            {/* Catalog Grid Area */}
            <div className="catalog-content">
              {sortedProducts.length > 0 ? (
                <>
                  <div className="catalog-grid">
                    {sortedProducts.slice(0, visibleCount).map((product) => (
                      <CatalogCard key={product.id} product={product} />
                    ))}
                  </div>

                  {visibleCount < sortedProducts.length && (
                    <div className="load-more-container reveal-element">
                      <button
                        className="btn btn-secondary btn-load-more"
                        onClick={handleLoadMore}
                        id="catalog-load-more-btn"
                      >
                        <span>Load More Products</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-products-container reveal-element">
                  <h3>No mementos match your selection.</h3>
                  <p>Try resetting the material or size filters to explore other designs.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setSelectedMaterial("all"); setSelectedSize("all"); }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: CTA Banner (Reused) */}
      <BulkCTA />

      {/* MOBILE FILTERS DRAWER */}
      <div className={`filters-drawer-overlay ${mobileFiltersOpen ? "open" : ""}`} onClick={() => setMobileFiltersOpen(false)}>
        <div className="filters-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h3>Filter Catalog</h3>
            <button className="drawer-close-btn" onClick={() => setMobileFiltersOpen(false)} aria-label="Close Filters">
              <X size={20} />
            </button>
          </div>

          <div className="drawer-body">
            <div className="drawer-filter-group">
              <h4 className="drawer-group-title">Material</h4>
              <div className="drawer-options">
                {["all", "wood", "acrylic", "glass"].map((mat) => (
                  <button
                    key={mat}
                    className={`drawer-option-btn ${selectedMaterial === mat ? "active" : ""}`}
                    onClick={() => { setSelectedMaterial(mat); setMobileFiltersOpen(false); }}
                  >
                    {mat === "all" ? "All Materials" : mat.charAt(0).toUpperCase() + mat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-filter-group">
              <h4 className="drawer-group-title">Size Options</h4>
              <div className="drawer-options">
                {["all", "13 x 15 CM", "13 x 17 CM", "15 x 17 CM"].map((sz) => (
                  <button
                    key={sz}
                    className={`drawer-option-btn ${selectedSize === sz ? "active" : ""}`}
                    onClick={() => { setSelectedSize(sz); setMobileFiltersOpen(false); }}
                  >
                    {sz === "all" ? "All Sizes" : sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <button
              className="btn btn-green w-100"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filter Results ({sortedProducts.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
