"use client";

import { useEffect, useRef, useState } from "react";
import useAberration from "@/hooks/useAberration";

const BASE_ITEMS = ["先海", "Digital Paintings", "Limited Editions", "Fine Art Prints"];
const ITEMS = Array.from({ length: 12 }, () => BASE_ITEMS).flat();

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
  gap: "32px",
  paddingRight: "48px",
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  fontFamily: "var(--font-sans)",
  fontWeight: 300,
  color: "#ffffff",
};

const DOT_STYLE = {
  display: "inline-block",
  width: "4px",
  height: "4px",
  borderRadius: "50%",
  backgroundColor: "#ffffff",
  opacity: 0.5,
  flexShrink: 0,
};

function Track({ translateX }) {
  return (
    <div style={{ ...TRACK_STYLE, transform: `translateY(-50%) translateX(${translateX}px)` }}>
      {[...ITEMS, ...ITEMS].map((item, i) => (
        <span key={i} style={ITEM_STYLE}>
          {item}
          <span style={DOT_STYLE} />
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
    <div style={{ position: "relative", width: "100%", height: "40px" }}>

      {/* Magenta — slowest */}
      <div style={{
        position: "absolute", left: 0, right: 0, zIndex: 1,
        top: `${spread}px`,
        height: "40px",
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
        height: "40px",
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
        height: "40px",
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
        height: "40px",
        backgroundColor: "#000000",
        overflow: "hidden",
      }}>
        <Track translateX={offset - 2400} />
      </div>

    </div>
  );
}
