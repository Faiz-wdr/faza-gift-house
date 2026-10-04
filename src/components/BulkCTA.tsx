import { useRef, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import "./BulkCTA.css";

export default function BulkCTA() {
  const bannerRef = useRef<HTMLDivElement>(null);

  const handleWhatsAppRedirect = () => {
    // Standard WhatsApp API URL with a pre-filled custom message
    const message = encodeURIComponent(
      "Hello Faza Gift House, I'm interested in getting a bulk quote for an upcoming event."
    );
    window.open(`https://wa.me/919188086244?text=${message}`, "_blank");
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const banner = bannerRef.current;
    if (!banner) return;
    const rect = banner.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalised parallax offset (-18px to +18px)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((x - centerX) / centerX) * 20;
    const tiltY = ((y - centerY) / centerY) * 20;

    banner.style.setProperty("--mouse-x", `${x}px`);
    banner.style.setProperty("--mouse-y", `${y}px`);
    banner.style.setProperty("--parallax-x", `${tiltX}px`);
    banner.style.setProperty("--parallax-y", `${tiltY}px`);
    banner.style.setProperty("--spotlight-opacity", "1");
  }, []);

  const handleMouseLeave = useCallback(() => {
    const banner = bannerRef.current;
    if (!banner) return;
    banner.style.setProperty("--spotlight-opacity", "0");
    banner.style.setProperty("--parallax-x", "0px");
    banner.style.setProperty("--parallax-y", "0px");
  }, []);

  return (
    <section className="bulk-cta-section">
      <div className="container">
        <div 
          ref={bannerRef}
          className="bulk-banner reveal-element"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Dynamic lightweight animated check background */}
          <div className="bulk-check-pattern" aria-hidden="true" />
          <div className="bulk-check-spotlight" aria-hidden="true" />
          <div className="bulk-cursor-glow" aria-hidden="true" />
          <div className="bulk-glow-orb glow-top-left" aria-hidden="true" />
          <div className="bulk-glow-orb glow-bottom-right" aria-hidden="true" />

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
