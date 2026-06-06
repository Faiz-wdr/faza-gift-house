import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/products");
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="contact" className="footer">
      <div className="container footer-container">
        
        {/* Left Column: Brand & Socials */}
        <div className="footer-col footer-brand">
          <h3 className="footer-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Faza <span>Gift House</span>
          </h3>
          <p className="footer-desc">
            Crafting memories into tangible art. Hand-finished premium mementos 
            delivered with care and passion to commemorate your greatest milestones.
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="mailto:info@fazagifthouse.com" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>

        {/* Middle Column: Nav Links */}
        <div className="footer-col footer-links">
          <h4 className="footer-heading">Navigation</h4>
          <ul>
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
          </ul>
        </div>

        {/* Right Column: Contact Details */}
        <div className="footer-col footer-contact">
          <h4 className="footer-heading">Contact Details</h4>
          <ul className="contact-list">
            <li>
              <MapPin size={18} className="contact-icon" />
              <span>12 Plaza Complex, Phase 3, Industrial Area, New Delhi, Pin-110020</span>
            </li>
            <li>
              <Phone size={18} className="contact-icon" />
              <a href="tel:+919188086244">+91 91880 86244</a>
            </li>
            <li>
              <Mail size={18} className="contact-icon" />
              <a href="mailto:info@fazagifthouse.com">info@fazagifthouse.com</a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p className="copyright">
            &copy; {currentYear} Faza Gift House. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
