import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Scale, HelpCircle } from "lucide-react";
import "./TermsConditions.css";

interface TocItem {
  id: string;
  label: string;
}

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState("intro");

  const tocItems: TocItem[] = [
    { id: "intro", label: "1. Introduction" },
    { id: "eligibility", label: "2. Eligibility to Use" },
    { id: "orders", label: "3. Orders & Custom Products" },
    { id: "pricing", label: "4. Pricing & Payments" },
    { id: "confirmation", label: "5. Order Confirmation" },
    { id: "production", label: "6. Production & Delivery" },
    { id: "customization", label: "7. Customization Responsibility" },
    { id: "returns", label: "8. Returns & Refunds" },
    { id: "cancellations", label: "9. Cancellations" },
    { id: "property", label: "10. Intellectual Property" },
    { id: "conduct", label: "11. User Conduct" },
    { id: "liability", label: "12. Limitation of Liability" },
    { id: "thirdparty", label: "13. Third-Party Services" },
    { id: "privacy-ref", label: "14. Privacy Reference" },
    { id: "updates", label: "15. Policy Updates" },
    { id: "contact-info", label: "16. Contact Information" }
  ];

  // Handle active section highlighting on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      
      for (const item of tocItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // Account for sticky navbar header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="terms-page-container">
      {/* 1. HERO SECTION */}
      <header className="terms-hero reveal-element">
        <div className="container">
          <div className="terms-badge">
            <Scale size={14} />
            <span>Policies & Guidelines</span>
          </div>
          <h1 className="terms-title">Terms & Conditions</h1>
          <p className="terms-subtitle">
            Please read these terms carefully before using our website or placing an order with Faza Gift House.
          </p>
          <div className="terms-hero-divider" />
        </div>
      </header>

      {/* 2. MAIN CONTENT BODY LAYOUT */}
      <main className="container terms-layout">
        
        {/* Left Side: Sticky Table of Contents Sidebar */}
        <aside className="terms-sidebar">
          <div className="terms-toc-card">
            <h4 className="terms-toc-header">Navigation</h4>
            <ul className="terms-toc-list">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`terms-toc-link ${activeSection === item.id ? "active" : ""}`}
                    onClick={(e) => handleScrollToSection(item.id, e)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Side: Main Terms Content */}
        <article className="terms-content">
          
          {/* Important Notice Box (custom orders callout) */}
          <div className="custom-order-notice-box reveal-element">
            <div className="notice-icon-wrapper">
              <HelpCircle size={22} />
            </div>
            <div className="notice-content">
              <h4>Important Notice for Custom Orders</h4>
              <p>
                Customized products are created specifically for each customer. Minor variations in color, texture, or finish may occur due to handcrafted production methods.
              </p>
            </div>
          </div>

          <section id="intro" className="terms-section reveal-element">
            <h2>1. Introduction</h2>
            <p>
              Welcome to the Faza Gift House website. These Terms & Conditions govern your access to and use of our online catalog, e-commerce storefront, admin tools, and purchasing services. By accessing our platform, customizing awards, or submitting orders, you agree to comply with and be bound by these legal rules.
            </p>
            <p>
              If you do not agree with any part of these terms, please do not use our website, place custom orders, or register administrative sessions.
            </p>
          </section>

          <section id="eligibility" className="terms-section reveal-element">
            <h2>2. Eligibility to Use</h2>
            <p>
              By placing an order on this website, you warrant that you are at least 18 years of age (or have explicit parental/guardian consent) and are legally capable of entering into binding contracts. You must provide true, complete, and accurate registration and delivery details during purchase.
            </p>
          </section>

          <section id="orders" className="terms-section reveal-element">
            <h2>3. Orders & Custom Products</h2>
            <p>
              Faza Gift House specializes in handcrafted, personalized premium trophies, plaques, and custom gifts.
            </p>
            <ul>
              <li><strong>Customization Instructions:</strong> It is your responsibility to verify all engraving texts, names, dates, size choices, and material selections before finishing your order request.</li>
              <li><strong>Product Sizing:</strong> Sizing displays (Small, Medium, Large) refer to bounding parameters specified in centimeters. Check dimensions carefully.</li>
              <li><strong>Database Records:</strong> All orders, along with personalized customer name and address entries, are stored securely inside our Supabase database.</li>
            </ul>
          </section>

          <section id="pricing" className="terms-section reveal-element">
            <h2>4. Pricing & Payments</h2>
            <p>
              All prices shown in our catalog are in Indian Rupees (₹). Sizing and material selections dynamically alter the calculated price display based on our catalog matrix.
            </p>
            <ul>
              <li><strong>Taxes and Shipping:</strong> Surcharge items (such as delivery fees or specific packaging charges) are calculated dynamically and listed as "Additional Charges" in your billing summary.</li>
              <li><strong>Secure Transactions:</strong> All financial entries are processed via secure third-party gateway solutions. We do not store complete credit card or banking numbers.</li>
              <li><strong>Billing Balance:</strong> Order calculations log Subtotal, Discount adjustments, Paid Amount, and Pending Balance. Remaining balances must be cleared in accordance with order terms.</li>
            </ul>
          </section>

          <section id="confirmation" className="terms-section reveal-element">
            <h2>5. Order Confirmation</h2>
            <p>
              Placing an order is an offer to purchase. Upon submission, you will receive an order record (e.g. an order reference ID such as <code>FD-1000</code>). A contract is formed only when we confirm production startup or dispatch details.
            </p>
          </section>

          <section id="production" className="terms-section reveal-element">
            <h2>6. Production & Delivery</h2>
            <p>
              Since each award is finished individually, production timelines vary depending on item quantity, material (wood, acrylic, glass), and current order queues.
            </p>
            <ul>
              <li><strong>Shipping Address:</strong> We ship to the address listed in the order record. If a delivery failure occurs due to inaccurate address logs, reshipping costs will be billed to the customer.</li>
              <li><strong>Tracking:</strong> When dispatched, we update the logistics record with a Tracking ID (AWB number), accessible in our order records.</li>
            </ul>
          </section>

          <section id="customization" className="terms-section reveal-element">
            <h2>7. Product Customization Responsibility</h2>
            <p>
              When uploading custom logos or texts, you declare that you own the rights to the graphic assets or have obtained legal permission to reproduce them. Faza Gift House reserves the right to decline processing graphics or texts that contain abusive language, copyright infringement, or materials deemed inappropriate.
            </p>
          </section>

          <section id="returns" className="terms-section reveal-element">
            <h2>8. Returns & Refunds</h2>
            <p>
              Because customized awards are created to individual specifications, they are generally non-returnable and non-refundable.
            </p>
            <ul>
              <li><strong>Exceptions:</strong> Returns or replacement runs are only authorized if there is a manufacturing defect, typographical mistake on our part (different from the text submitted), or transit damage.</li>
              <li><strong>Notification:</strong> Defects or damages must be reported to our team within 48 hours of shipment receipt, accompanied by order receipt logs and photos.</li>
            </ul>
          </section>

          <section id="cancellations" className="terms-section reveal-element">
            <h2>9. Cancellations</h2>
            <p>
              Orders for customized products cannot be cancelled once engraving setup or material cutting has commenced. If you need to modify an order, contact us immediately. If production has not started, modifications or cancellations will be handled as a courtesy.
            </p>
          </section>

          <section id="property" className="terms-section reveal-element">
            <h2>10. Intellectual Property</h2>
            <p>
              All website graphics, branding rows, fonts, scripts, layouts, icons, and invoice designs are the property of Faza Gift House. Custom templates and database catalog records are protected under trademark and intellectual property rights. You may not reproduce, copy, or redistribute elements without written consent.
            </p>
          </section>

          <section id="conduct" className="terms-section reveal-element">
            <h2>11. User Conduct</h2>
            <p>
              You agree not to bypass security controls, attempt unauthorized access to the admin dashboard panel, insert malicious scripts, or run automated web crawlers that interfere with the database connectivity or increase network latency.
            </p>
          </section>

          <section id="liability" className="terms-section reveal-element">
            <h2>12. Limitation of Liability</h2>
            <p>
              Faza Gift House, Vercel hostings, and Supabase integrations are provided "as is". In no event shall we be liable for indirect, incidental, or consequential damages (such as lost profits or event delays) arising out of product purchases, late shipping, or database maintenance shutdowns.
            </p>
          </section>

          <section id="thirdparty" className="terms-section reveal-element">
            <h2>13. Third-Party Services</h2>
            <p>
              We integrate third-party solutions such as WhatsApp links (for query redirection) and external script libraries. We are not responsible for the uptime, security, or practices of these external platforms.
            </p>
          </section>

          <section id="privacy-ref" className="terms-section reveal-element">
            <h2>14. Privacy Reference</h2>
            <p>
              Any personal data provided during purchase, billing, or administration is governed by our Privacy Policy, which details database storage under Row Level Security and serverless heartbeat triggers.
            </p>
          </section>

          <section id="updates" className="terms-section reveal-element">
            <h2>15. Policy Updates</h2>
            <p>
              We reserve the right to revise these terms at any time. Changes will be posted on this page and will take effect immediately. Continued use of the website following updates indicates your acceptance.
            </p>
            <p className="policy-last-updated">
              <em>Last Modified: June 6, 2026</em>
            </p>
          </section>

          {/* Contact Section */}
          <section id="contact-info" className="terms-section contact-terms-section reveal-element">
            <h2>16. Contact Information</h2>
            <p>
              If you have any questions or require clarification regarding these Terms & Conditions, please contact us:
            </p>
            
            <div className="terms-contact-card">
              <div className="terms-contact-brand">Faza Gift House</div>
              
              <div className="terms-contact-info-list">
                <div className="terms-info-item">
                  <Mail size={18} className="terms-info-icon" />
                  <div>
                    <span className="terms-info-label">Email Support</span>
                    <a href="mailto:info@fazagifthouse.com" className="terms-info-val">info@fazagifthouse.com</a>
                  </div>
                </div>

                <div className="terms-info-item">
                  <Phone size={18} className="terms-info-icon" />
                  <div>
                    <span className="terms-info-label">Call / WhatsApp</span>
                    <a href="tel:+919188086244" className="terms-info-val">+91 91880 86244</a>
                  </div>
                </div>

                <div className="terms-info-item">
                  <MapPin size={18} className="terms-info-icon" />
                  <div>
                    <span className="terms-info-label">Office Address</span>
                    <span className="terms-info-val text-address">Malappuram, Kerala, India</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </article>

      </main>

    </div>
  );
}
