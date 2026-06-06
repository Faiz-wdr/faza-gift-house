import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const location = useLocation();

  useEffect(() => {
    const isNoScrollRoute = location.pathname === "/admin" || location.pathname === "/login";
    
    if (isNoScrollRoute) {
      // Clean up Lenis classes and reset overflow styling
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
      document.body.classList.remove("lenis", "lenis-smooth", "lenis-stopped");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.height = "";
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [location.pathname]);

  return <>{children}</>;
}
