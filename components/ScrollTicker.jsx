"use client";

import { useEffect, useRef, useState } from "react";
import useAberration from "@/hooks/useAberration";

const BASE_ITEMS = ["先海", "Digital Paintings", "Limited Editions", "Fine Art Prints"];
const ITEMS = Array.from({ length: 12 }, () => BASE_ITEMS).flat();

const H = 80;

const TRACK_STYLE = {
  display: "flex",
  gap: "0",
  whiteSpace: "nowrap",
  willChange: "transform",
  position: "absolute",
  top: "50%",
  left: 0,
};

const ITEM_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "24px",
  paddingRight: "40px",
  fontSize: "13px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontFamily: "var(--font-counter)",
  fontWeight: 100,
  fontStyle: "italic",
  color: "#ffffff",
};

function Track({ translateX }) {
  return (
    <div style={{ ...TRACK_STYLE, transform: `translateY(-50%) translateX(${translateX}px)` }}>
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} style={ITEM_STYLE}>
          {item}
          <img src="/crossx.png" aria-hidden="true" style={{
            height: "14px", width: "auto",
            filter: "brightness(0) invert(1)",
            opacity: 0.6,
            flexShrink: 0,
          }} />
        </span>
      ))}
    </div>
  );
}

export default function ScrollTicker() {
  const [offset, setOffset] = useState(0);
  const spread = useAberration();

  useEffect(() => {
    function onScroll() {
      setOffset(window.scrollY * 0.35);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: `${H}px` }}>

      {/* Magenta — slowest */}
      <div style={{
        position: "absolute", left: 0, right: 0, zIndex: 1,
        top: `${spread}px`,
        height: `${H}px`,
        backgroundColor: "#ff00ff",
        overflow: "hidden",
        transition: "top 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        <Track translateX={offset - 2400} />
      </div>

      {/* Yellow — medium */}
      <div style={{
        position: "absolute", left: 0, right: 0, zIndex: 2,
        top: `${spread * 0.67}px`,
        height: `${H}px`,
        backgroundColor: "#ffff00",
        overflow: "hidden",
        transition: "top 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        <Track translateX={offset - 2400} />
      </div>

      {/* Cyan — fastest */}
      <div style={{
        position: "absolute", left: 0, right: 0, zIndex: 3,
        top: `${spread * 0.33}px`,
        height: `${H}px`,
        backgroundColor: "#00ffff",
        overflow: "hidden",
        transition: "top 0.14s cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        <Track translateX={offset - 2400} />
      </div>

      {/* Black — on top, no transition */}
      <div style={{
        position: "absolute", left: 0, right: 0, zIndex: 4,
        top: 0,
        height: `${H}px`,
        backgroundColor: "#000000",
        overflow: "hidden",
      }}>
        <Track translateX={offset - 2400} />
      </div>

    </div>
  );
}
