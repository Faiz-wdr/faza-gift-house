import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, ShieldAlert } from "lucide-react";
import "./PrivacyPolicy.css";

interface TocItem {
  id: string;
  label: string;
}

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("collect");

  const tocItems: TocItem[] = [
    { id: "collect", label: "Information We Collect" },
    { id: "use", label: "How We Use Your Information" },
    { id: "payment", label: "Payment Information" },
    { id: "personalization", label: "Product Personalization" },
    { id: "cookies", label: "Cookies & Tracking" },
    { id: "sharing", label: "Sharing of Information" },
    { id: "security", label: "Data Security" },
    { id: "records", label: "Order Records" },
    { id: "thirdparty", label: "Third-Party Services" },
    { id: "children", label: "Children’s Privacy" },
    { id: "rights", label: "Your Rights" },
    { id: "changes", label: "Changes to This Policy" },
    { id: "contact-policy", label: "Contact Us" }
  ];

  // Handle active section highlighting on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check current scroll position to update active TOC section
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
    <div className="privacy-page-container">
      {/* 1. HERO SECTION */}
      <header className="privacy-hero reveal-element">
        <div className="container">
          <div className="privacy-badge">
            <ShieldAlert size={14} />
            <span>Privacy & Security</span>
          </div>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">
            Your privacy and trust are important to us. This page explains how Faza Gift House collects, uses, and protects your information.
          </p>
          <div className="privacy-hero-divider" />
        </div>
      </header>

      {/* 2. MAIN CONTENT BODY LAYOUT */}
      <main className="container privacy-layout">
        
        {/* Left Side: Sticky Table of Contents Sidebar */}
        <aside className="privacy-sidebar">
          <div className="toc-card">
            <h4 className="toc-header">Table of Contents</h4>
            <ul className="toc-list">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`toc-link ${activeSection === item.id ? "active" : ""}`}
                    onClick={(e) => handleScrollToSection(item.id, e)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Side: Main Policy Content */}
        <article className="privacy-content">
          
          <section id="collect" className="policy-section reveal-element">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you make purchases, personalize items, place custom orders, or register an administrator profile. This personal data may include:
            </p>
            <ul>
              <li><strong>Contact Information:</strong> Name, shipping address, billing address, phone number, and email address.</li>
              <li><strong>Personalization Details:</strong> Texts, quotes, dates, custom titles, names, sizes, materials, and specific graphic requests chosen for memento engravings.</li>
              <li><strong>Account Credentials:</strong> Secure password hashes and login session details for administrator profiles.</li>
            </ul>
          </section>

          <section id="use" className="policy-section reveal-element">
            <h2>2. How We Use Your Information</h2>
            <p>
              We utilize your personal information to deliver a tailored, high-fidelity crafting and purchasing experience. Specifically, your data is used to:
            </p>
            <ul>
              <li>Process and fulfill orders, including arranging shipping and packaging.</li>
              <li>Engrave and finish custom orders precisely to your sizing and material requests.</li>
              <li>Communicate order status updates, payment confirmations, and logistics tracking IDs.</li>
              <li>Provide customer service, address support inquiries, and resolve quality inquiries.</li>
              <li>Secure the administration dashboard and prevent fraudulent transactions.</li>
            </ul>
          </section>

          <section id="payment" className="policy-section reveal-element">
            <h2>3. Payment Information</h2>
            <p>
              Your security is our absolute priority. All payment transactions on Faza Gift House are processed through secure, industry-leading third-party payment gateways. We do not store, process, or have direct access to your complete financial credentials, such as credit card numbers, CVVs, or online banking passwords. The gateway securely returns only the transaction status and confirmation details needed to complete your order receipt.
            </p>
          </section>

          <section id="personalization" className="policy-section reveal-element">
            <h2>4. Product Personalization</h2>
            <p>
              To create custom trophies, plaques, and mementos, we upload and store customer-submitted texts, options, and titles in our secure catalog. Sizing grids, pricing matrices, and material selections are stored in Supabase storage and database instances. We retain personalization parameters strictly for quality assurance, order logging, and layout reference for future re-runs or replacements.
            </p>
          </section>

          <section id="cookies" className="policy-section reveal-element">
            <h2>5. Cookies & Tracking</h2>
            <p>
              We use lightweight cookies, session variables, and local storage variables (such as <code>faza_local_session</code> and caching mechanisms) to enhance your browsing experience:
            </p>
            <ul>
              <li>Keep you logged in securely as an administrator during active dashboard sessions.</li>
              <li>Cache catalog structures locally for quick rendering and low bandwidth usage.</li>
              <li>Analyze web traffic metrics to improve layout performance and search capabilities.</li>
            </ul>
            <p>
              You can configure your browser to reject cookies or prompt you before accepting them. However, doing so may disable administrative access and certain interactive order customization features.
            </p>
          </section>

          <section id="sharing" className="policy-section reveal-element">
            <h2>6. Sharing of Information</h2>
            <p>
              We do not sell, rent, trade, or share your personal data with third parties for marketing purposes. Your information is shared exclusively with critical fulfillment entities:
            </p>
            <ul>
              <li><strong>Logistics Partners:</strong> Courier and delivery services tasked with shipping your custom awards to your physical address.</li>
              <li><strong>Hosting & Database Providers:</strong> Vercel (for serverless function triggers and page rendering) and Supabase (for database storage under strict RLS configurations).</li>
              <li><strong>Legal Compliance:</strong> If required by law, subpoena, or regulation to protect the rights and safety of our customers and business.</li>
            </ul>
          </section>

          <section id="security" className="policy-section reveal-element">
            <h2>7. Data Security</h2>
            <p>
              We employ strict technical and organizational safeguards to secure your personal data. We utilize SSL encryption for all web communications and Row Level Security (RLS) policies inside Supabase to restrict unauthenticated database writes and reads. While we strive to protect your data with state-of-the-art protections, no transmission over the internet or database storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section id="records" className="policy-section reveal-element">
            <h2>8. Order Records</h2>
            <p>
              We keep comprehensive records of customer orders (containing invoice lists, subtotal computations, names, and delivery addresses) to support the generate-invoice tool, manage accounting, handle dispute claims, and verify physical delivery statuses.
            </p>
          </section>

          <section id="thirdparty" className="policy-section reveal-element">
            <h2>9. Third-Party Services</h2>
            <p>
              Our website links to or utilizes third-party platforms such as WhatsApp (for query redirection and messaging pings) and third-party script CDNs. These services operate under their own privacy protocols. We encourage you to review their respective privacy policies before engaging or sharing custom details.
            </p>
          </section>

          <section id="children" className="policy-section reveal-element">
            <h2>10. Children’s Privacy</h2>
            <p>
              Our store and custom memento catalogs are not designed for or targeted at children under the age of 13. We do not knowingly compile or request personal data from individuals under 13 years of age. If we discover that a child under 13 has provided us with personal information, we will delete it from our systems immediately.
            </p>
          </section>

          <section id="rights" className="policy-section reveal-element">
            <h2>11. Your Rights</h2>
            <p>
              Depending on your location, you hold certain rights regarding your personal information, which include:
            </p>
            <ul>
              <li>The right to request access to the personal data we store about you.</li>
              <li>The right to correct inaccurate or outdated information in your records.</li>
              <li>The right to request the erasure of your personal data, subject to tax, bookkeeping, or transaction logging legal requirements.</li>
            </ul>
            <p>
              To exercise these rights, please contact our support team using the contact information below.
            </p>
          </section>

          <section id="changes" className="policy-section reveal-element">
            <h2>12. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Privacy Policy at any time. Any changes will be posted on this page with an updated "Last Modified" date at the bottom. We encourage you to review this page periodically to remain informed about how we safeguard your personal information.
            </p>
            <p className="policy-last-updated">
              <em>Last Modified: June 6, 2026</em>
            </p>
          </section>

          {/* 3. CONTACT BOX SECTION */}
          <section id="contact-policy" className="policy-section contact-policy-section reveal-element">
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions, inquiries, or concerns regarding our privacy practices or data security, please feel free to reach out directly to our team:
            </p>
            
            <div className="privacy-contact-card">
              <div className="contact-card-brand">Faza Gift House</div>
              
              <div className="contact-card-info-list">
                <div className="card-info-item">
                  <Mail size={18} className="card-info-icon" />
                  <div>
                    <span className="card-info-label">Email Support</span>
                    <a href="mailto:info@fazagifthouse.com" className="card-info-val">info@fazagifthouse.com</a>
                  </div>
                </div>

                <div className="card-info-item">
                  <Phone size={18} className="card-info-icon" />
                  <div>
                    <span className="card-info-label">Call / WhatsApp</span>
                    <a href="tel:+919188086244" className="card-info-val">+91 91880 86244</a>
                  </div>
                </div>

                <div className="card-info-item">
                  <MapPin size={18} className="card-info-icon" />
                  <div>
                    <span className="card-info-label">Office Address</span>
                    <span className="card-info-val text-address">Malappuram, Kerala, India</span>
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
