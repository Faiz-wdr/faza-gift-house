import { useEffect } from "react";

export default function useScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -80px 0px", // triggers slightly before entering view
      threshold: 0.1, // trigger when 10% of element is visible
    };

    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          // Once revealed, we can unobserve if we only want it to animate once
          intersectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all currently existing reveal elements
    const observeAll = () => {
      const revealElements = document.querySelectorAll(".reveal-element:not(.revealed)");
      revealElements.forEach((el) => intersectionObserver.observe(el));
    };

    observeAll();

    // Watch for dynamically added elements (e.g., products loaded from API)
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              // Check if the added node itself is a reveal-element
              if (node.classList.contains("reveal-element") && !node.classList.contains("revealed")) {
                intersectionObserver.observe(node);
              }
              // Check children of the added node
              const children = node.querySelectorAll(".reveal-element:not(.revealed)");
              if (children.length > 0) {
                children.forEach((el) => intersectionObserver.observe(el));
              }
            }
          }
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}
