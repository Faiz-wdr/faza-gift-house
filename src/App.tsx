import { useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import SmoothScroll from "./components/SmoothScroll";
import useScrollReveal from "./hooks/useScrollReveal";

import "./App.css";

// Scroll restoration component for React Router
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll to top on route change
    window.scrollTo({ top: 0, left: 0 });
    
    // Dispatch scroll event to notify Lenis and update calculations
    window.dispatchEvent(new Event("scroll"));
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  
  // Re-bind scroll reveal observer on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("scroll"));
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useScrollReveal();

  // Hide the global website navbar and footer on admin and login paths
  const isNoLayoutRoute = location.pathname === "/login" || location.pathname === "/admin";

  return (
    <>
      <ScrollToTop />
      {!isNoLayoutRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
      </Routes>
      {!isNoLayoutRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <SmoothScroll>
        <AppContent />
      </SmoothScroll>
    </Router>
  );
}

export default App;
