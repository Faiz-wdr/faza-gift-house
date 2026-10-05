import { motion } from "framer-motion";
import "./Hero.css";

const heroCards = [
  {
    id: 1,
    title: "Crystal Faceted Award",
    src: "/memento_crystal.png",
    rotation: -7,
    yOffset: 6,
  },
  {
    id: 2,
    title: "Classic Arch Memento",
    src: "/memento_orange.png",
    rotation: -2.5,
    yOffset: -6,
  },
  {
    id: 3,
    title: "Foliage Quill Award",
    src: "/memento_green.png",
    rotation: 2.5,
    yOffset: -6,
  },
  {
    id: 4,
    title: "Sunset Crest Shield",
    src: "/memento_purple.png",
    rotation: 7,
    yOffset: 6,
  },
];

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
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
        <motion.div
          className="hero-content-centered"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Centered Main Title (3 lines in mobile) */}
          <motion.h1 className="hero-title" variants={itemVariants}>
            A place to <br className="hero-title-br-mobile" />
            celebrate your <br className="hero-title-br" />
            <span className="hero-highlight">masterpiece.</span>
          </motion.h1>

          {/* CTA Buttons after Hero heading */}
          <motion.div className="hero-actions" variants={itemVariants}>
            <button
              className="btn-hero-primary"
              onClick={() => handleScrollToSection("products")}
              id="hero-browse-products-btn"
            >
              Mementos
            </button>
            <button
              className="btn-hero-secondary"
              onClick={() => handleScrollToSection("contact")}
              id="hero-contact-us-btn"
            >
              Get a Quote
            </button>
          </motion.div>

          {/* 4 Cards Showcase in Center */}
          <motion.div className="hero-cards-wrapper" variants={itemVariants}>
            <div className="hero-cards-deck">
              {heroCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  className={`hero-fanned-card card-${idx + 1}`}
                  initial={{ opacity: 0, y: 35, rotate: 0 }}
                  animate={{ opacity: 1, y: card.yOffset, rotate: card.rotation }}
                  transition={{
                    duration: 0.75,
                    delay: 0.15 + idx * 0.08,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={{
                    y: -16,
                    rotate: 0,
                    scale: 1.06,
                    zIndex: 25,
                    transition: { duration: 0.25, ease: "easeOut" }
                  }}
                  onClick={() => handleScrollToSection("products")}
                  title={card.title}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleScrollToSection("products");
                    }
                  }}
                >
                  <div className="card-image-frame">
                    <img
                      src={card.src}
                      alt={card.title}
                      className="card-media-img"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
