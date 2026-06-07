import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import navbarLogo from "../assets/invoice-im.png";
import "./Navbar.css";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    navigate("/products");
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    // We scroll to contact (in the footer)
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Left Side: Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <img src={navbarLogo} alt="Faza Gift House Logo" className="navbar-logo-img" />
          Faza <span>Gift House</span>
        </Link>

        {/* Center Navigation Links */}
        <ul className={`navbar-links ${mobileMenuOpen ? "active" : ""}`}>
          <li>
            <a href="/" onClick={handleHomeClick}>
              Home
            </a>
          </li>
          <li>
            <a href="/products" onClick={handleProductsClick}>
              Products
            </a>
          </li>
          <li>
            <a href="#contact" onClick={handleContactClick}>
              Contact Us
            </a>
          </li>
          <li className="mobile-cta">
            <button className="btn btn-green" onClick={handleContactClick}>Order Now</button>
          </li>
        </ul>

        {/* Right CTA Button */}
        <div className="navbar-cta">
          <button className="btn btn-green" onClick={handleContactClick}>
            Order Now
          </button>
        </div>

        {/* Hamburger Mobile Menu */}
        <button 
          className={`hamburger ${mobileMenuOpen ? "open" : ""}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
          id="navbar-hamburger-btn"
        >
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </button>
      </div>
      
      {/* Mobile Menu Backdrop Overlay */}
      {mobileMenuOpen && (
        <div className="navbar-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}
    </nav>
  );
}
