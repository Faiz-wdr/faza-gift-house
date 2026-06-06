import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

// Swiper CSS
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import "./Hero.css";

// Product images generated previously
const heroImages = [
  {
    src: "/memento_orange.png",
    alt: "Orange Custom Prize Memento",
  },
  {
    src: "/memento_green.png",
    alt: "Green Custom Prize Memento",
  },
  {
    src: "/memento_purple.png",
    alt: "Purple Custom Prize Memento",
  },
];

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.85, 
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      } 
    },
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header id="home" className="hero-section">
      <div className="container hero-container">
        {/* Left side content */}
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1 className="hero-title" variants={itemVariants}>
            Custom Mementos Made for Your <span>Special Moments</span>
          </motion.h1>
          
          <motion.p className="hero-subtitle" variants={itemVariants}>
            Personalized gifts handcrafted to preserve your most cherished memories. 
            From organic wood to polished acrylic.
          </motion.p>

          <motion.div className="hero-actions" variants={itemVariants}>
            <button 
              className="btn btn-primary"
              onClick={() => handleScrollToSection("products")}
              id="hero-browse-products-btn"
            >
              Browse Products
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => handleScrollToSection("contact")}
              id="hero-contact-us-btn"
            >
              Contact Us
            </button>
          </motion.div>
        </motion.div>

        {/* Right side slider */}
        <div className="hero-slider-container">
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
              el: ".hero-custom-pagination",
            }}
            loop={true}
            className="hero-swiper"
          >
            {heroImages.map((img, idx) => (
              <SwiperSlide key={idx} className="hero-slide">
                <div className="hero-image-wrapper">
                  <img src={img.src} alt={img.alt} className="hero-slide-image" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Custom dots wrapper matching design */}
          <div className="hero-custom-pagination"></div>
        </div>
      </div>
    </header>
  );
}
