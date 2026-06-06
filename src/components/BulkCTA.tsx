import { MessageCircle } from "lucide-react";
import "./BulkCTA.css";

export default function BulkCTA() {
  const handleWhatsAppRedirect = () => {
    // Standard WhatsApp API URL with a pre-filled custom message
    const message = encodeURIComponent(
      "Hello Faza Gift House, I'm interested in getting a bulk quote for an upcoming event."
    );
    window.open(`https://wa.me/919188086244?text=${message}`, "_blank");
  };

  return (
    <section className="bulk-cta-section">
      <div className="container">
        <div className="bulk-banner reveal-element">
          <div className="bulk-content">
            <h2 className="bulk-title">Need bulk mementos for your event?</h2>
            <p className="bulk-text">
              We offer special pricing for corporate orders, school trophies, 
              weddings, and awards return gifts. Get in touch with us today for a custom quote.
            </p>
            <button 
              className="btn btn-whatsapp" 
              onClick={handleWhatsAppRedirect}
              id="bulk-whatsapp-cta-btn"
            >
              <MessageCircle size={18} />
              <span>Get Quote on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
