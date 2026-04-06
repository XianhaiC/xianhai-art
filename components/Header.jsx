"use client";

import { useEffect, useRef, useState } from "react";

const NAV_HEIGHT = 72;
const LARGE_PX = 420;
const SMALL_PX = 44;
const SCROLL_DISTANCE = 400; // px of scroll over which animation runs

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function Header() {
  const [progress, setProgress] = useState(0);
  const [aberration, setAberration] = useState(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const decayRef = useRef(null);

  useEffect(() => {
    // Sync immediately to current scroll position on mount (handles page reload mid-scroll)
    const p = Math.min(Math.max(window.scrollY / SCROLL_DISTANCE, 0), 1);
    setProgress(p);
    lastScrollY.current = window.scrollY;
  }, []);

  useEffect(() => {
    function onScroll() {
      const now = Date.now();
      const dt = Math.max(now - lastTime.current, 1);
      const delta = window.scrollY - lastScrollY.current;
      const velocity = delta / dt;

      lastScrollY.current = window.scrollY;
      lastTime.current = now;

      const p = Math.min(Math.max(window.scrollY / SCROLL_DISTANCE, 0), 1);
      setProgress(p);
      setAberration(Math.max(Math.min(velocity * 18, 18), -18));

      if (decayRef.current) clearTimeout(decayRef.current);
      decayRef.current = setTimeout(() => setAberration(0), 150);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (decayRef.current) clearTimeout(decayRef.current);
    };
  }, []);

  const fontSize = lerp(LARGE_PX, SMALL_PX, progress);
  const logoAberration = progress >= 1 ? 0 : aberration;

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

      {/* Logo — scroll-driven with chromatic aberration */}
      <a
        href="#"
        style={{
          position: "fixed",
          zIndex: 101,
          left: "50%",
          transform: "translateX(-50%)",
          top: `${logoTop}px`,
          userSelect: "none",
          lineHeight: 0,
        }}
      >
        {/* Magenta ghost — slowest */}
        <div style={{
          position: "absolute", top: `${logoAberration}px`, left: 0,
          transition: "top 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
          pointerEvents: "none",
        }}>
          <img src="/art-logo.png" alt="" aria-hidden="true" style={{
            height: `${fontSize}px`, width: "auto", display: "block",
            filter: "brightness(0) saturate(1) invert(13%) sepia(99%) saturate(7404%) hue-rotate(309deg) brightness(96%) contrast(103%)",
          }} />
        </div>
        {/* Yellow ghost — medium */}
        <div style={{
          position: "absolute", top: `${logoAberration * 0.67}px`, left: 0,
          transition: "top 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
          pointerEvents: "none",
        }}>
          <img src="/art-logo.png" alt="" aria-hidden="true" style={{
            height: `${fontSize}px`, width: "auto", display: "block",
            filter: "brightness(0) saturate(1) invert(94%) sepia(94%) saturate(743%) hue-rotate(358deg) brightness(103%) contrast(107%)",
          }} />
        </div>
        {/* Cyan ghost — fastest */}
        <div style={{
          position: "absolute", top: `${logoAberration * 0.33}px`, left: 0,
          transition: "top 0.14s cubic-bezier(0.25, 1, 0.5, 1)",
          pointerEvents: "none",
        }}>
          <img src="/art-logo.png" alt="" aria-hidden="true" style={{
            height: `${fontSize}px`, width: "auto", display: "block",
            filter: "brightness(0) saturate(1) invert(88%) sepia(53%) saturate(4417%) hue-rotate(152deg) brightness(101%) contrast(101%)",
          }} />
        </div>
        {/* Main logo on top */}
        <img
          src="/art-logo.png"
          alt="先海"
          style={{
            height: `${fontSize}px`,
            width: "auto",
            display: "block",
            position: "relative",
          }}
        />
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
