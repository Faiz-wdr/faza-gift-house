import Hero from "../components/Hero";
import PopularProducts from "../components/PopularProducts";
import BulkCTA from "../components/BulkCTA";
import Testimonials from "../components/Testimonials";

export default function Home() {
  return (
    <main>
      <Hero />
      <PopularProducts />
      <BulkCTA />
      <Testimonials />
    </main>
  );
}
