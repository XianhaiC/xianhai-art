"use client";

import { useEffect, useState } from "react";

const NAV_HEIGHT = 72;
const LARGE_PX = 160;
const SMALL_PX = 22;
const SCROLL_DISTANCE = 400; // px of scroll over which animation runs

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function Header() {
  const [progress, setProgress] = useState(0); // 0 = top, 1 = fully in nav

  useEffect(() => {
    function onScroll() {
      const p = Math.min(Math.max(window.scrollY / SCROLL_DISTANCE, 0), 1);
      setProgress(p);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fontSize = lerp(LARGE_PX, SMALL_PX, progress);

  // Vertical: center of viewport → center of nav bar
  const topCenter = typeof window !== "undefined"
    ? window.innerHeight / 2 - fontSize / 2
    : 300;
  const topNav = (NAV_HEIGHT - fontSize) / 2;
  const logoTop = lerp(topCenter, topNav, progress);

  return (
    <>
      {/* Nav bar background + links — fades in with scroll */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: `${NAV_HEIGHT}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 60px",
          backgroundColor: `rgba(255, 255, 255, ${progress})`,
          pointerEvents: progress > 0.5 ? "auto" : "none",
        }}
      >
        <ul
          style={{
            display: "flex",
            gap: "36px",
            listStyle: "none",
            opacity: progress,
          }}
        >
          {["Works", "About", "Contact"].map((label) => (
            <li key={label}>
              <a
                href={`#${label.toLowerCase()}`}
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "var(--ink)")}
                onMouseLeave={(e) => (e.target.style.color = "var(--muted)")}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo — scroll-driven, no CSS transitions */}
      <a
        href="#"
        style={{
          position: "fixed",
          zIndex: 101,
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--ink)",
          fontSize: `${fontSize}px`,
          left: "50%",
          transform: "translateX(-50%)",
          top: `${logoTop}px`,
          lineHeight: 1,
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        先海
      </a>

      {/* Hero content — fades out as you scroll */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 60px 80px",
          opacity: Math.max(0, 1 - progress * 3),
          pointerEvents: progress > 0.3 ? "none" : "auto",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            letterSpacing: "0.04em",
            maxWidth: "360px",
            lineHeight: 1.7,
            marginBottom: "48px",
          }}
        >
          Original 2D digital paintings. Each piece available as a limited fine
          art print, shipped worldwide.
        </p>

        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              display: "block",
              width: "32px",
              height: "1px",
              backgroundColor: "var(--muted)",
            }}
          />
          Scroll to explore
        </p>
      </section>
    </>
  );
}
