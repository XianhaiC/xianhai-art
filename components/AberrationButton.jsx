"use client";

import { useEffect, useRef, useState } from "react";

export default function AberrationButton({ href, children, style }) {
  const [aberration, setAberration] = useState(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const decayRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const now = Date.now();
      const dt = Math.max(now - lastTime.current, 1);
      const delta = window.scrollY - lastScrollY.current;
      const velocity = delta / dt;

      lastScrollY.current = window.scrollY;
      lastTime.current = now;

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

  const baseStyle = {
    fontSize: "10px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--bg)",
    backgroundColor: "var(--ink)",
    padding: "11px 24px",
    borderRadius: "999px",
    display: "inline-block",
    position: "relative",
    ...style,
  };

  const ghostStyle = {
    position: "absolute",
    inset: 0,
    borderRadius: "999px",
    padding: "11px 24px",
    fontSize: "10px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };

  return (
    <a href={href} style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {/* Magenta ghost */}
      <span style={{
        ...ghostStyle,
        top: `${aberration}px`,
        backgroundColor: "#ff00ff",
        color: "#ff00ff",
        transition: "top 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>{children}</span>

      {/* Yellow ghost */}
      <span style={{
        ...ghostStyle,
        top: `${aberration * 0.67}px`,
        backgroundColor: "#ffff00",
        color: "#ffff00",
        transition: "top 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>{children}</span>

      {/* Cyan ghost */}
      <span style={{
        ...ghostStyle,
        top: `${aberration * 0.33}px`,
        backgroundColor: "#00ffff",
        color: "#00ffff",
        transition: "top 0.14s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>{children}</span>

      {/* Main button on top */}
      <span style={baseStyle}>{children}</span>
    </a>
  );
}
