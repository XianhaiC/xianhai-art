"use client";

import { useEffect, useState } from "react";

const BASE_ITEMS = ["先海", "Digital Paintings", "Limited Editions", "Fine Art Prints"];
// Repeat enough times so the strip is always wider than the viewport even after translation
const ITEMS = Array.from({ length: 12 }, () => BASE_ITEMS).flat();

export default function ScrollTicker() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function onScroll() {
      // Scroll down → strip slides right, revealing content from the left
      setOffset(window.scrollY * 0.35);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        borderTop: "1px solid var(--ink)",
        borderBottom: "1px solid var(--ink)",
        backgroundColor: "var(--ink)",
        padding: "12px 0",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0",
          whiteSpace: "nowrap",
          transform: `translateX(${offset - 2400}px)`,
          willChange: "transform",
        }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "32px",
              paddingRight: "48px",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#ffffff",
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
            }}
          >
            {item}
            <span
              style={{
                display: "inline-block",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                opacity: 0.5,
                flexShrink: 0,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
