import { Star } from "lucide-react";
import "./Testimonials.css";

interface Testimonial {
  id: number;
  rating: number;
  text: string;
  name: string;
  role: string;
  avatar: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: 1,
    rating: 5,
    text: "The acrylic award was stunning. The clarity and the way it catches light is incredible. WhatsApp ordering was so easy!",
    name: "Rahul Sharma",
    role: "Corporate Lead, Tech Solutions",
    avatar: "/avatar_rahul.png",
  },
  {
    id: 2,
    rating: 5,
    text: "This acrylic award was stunning. The clarity and the way it catches light is incredible. WhatsApp ordering was so easy!",
    name: "Ivan Reskich",
    role: "Co-Founder, Craft Agency",
    avatar: "/avatar_ivan.png",
  },
  {
    id: 3,
    rating: 5,
    text: "This award is award-winning. The clarity and the way it catches light is incredible. WhatsApp ordering was so easy!",
    name: "Alaa Bathool",
    role: "Design Lead, Velvet Studio",
    avatar: "/avatar_alaa.png",
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        {/* Title */}
        <div className="testimonials-header reveal-element">
          <h2 className="testimonials-title">Trusted by Thousands</h2>
        </div>

        {/* Cards Grid */}
        <div className="testimonials-grid">
          {testimonialsData.map((item) => (
            <div key={item.id} className="testimonial-card reveal-element">
              {/* Stars */}
              <div className="testimonial-stars">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--accent-color)" stroke="var(--accent-color)" />
                ))}
              </div>

              {/* Text */}
              <p className="testimonial-text">“{item.text}”</p>

              {/* User Info */}
              <div className="testimonial-user">
                <img src={item.avatar} alt={item.name} className="testimonial-avatar" />
                <div className="testimonial-meta">
                  <h4 className="testimonial-name">{item.name}</h4>
                  <span className="testimonial-role">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
