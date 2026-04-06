"use client";

import { useEffect, useRef, useState } from "react";
import AberrationButton from "@/components/AberrationButton";
import ImageMagnifier from "@/components/ImageMagnifier";
import useAberration from "@/hooks/useAberration";

export default function ArtworkRow({ artwork, index, total }) {
  const rowRef = useRef(null);
  const imgRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [magnifying, setMagnifying] = useState(false);

  const isImageLeft = index % 2 === 0;
  const number = String(total - index).padStart(2, "0");
  const aberration = useAberration();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  const imageBlock = (
    <div
      style={{
        overflow: "hidden",
        cursor: "zoom-in",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
      onClick={() => setMagnifying(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Video overlay — shown on hover if video exists */}
      {artwork.video && (
        <video
          src={artwork.video}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      )}
      <img
        ref={imgRef}
        src={artwork.image}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );

  const infoBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: isImageLeft ? "0 0 0 20px" : "0 20px 0 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", position: "relative" }}>
        {/* Magenta ghost */}
        <span aria-hidden="true" style={{
          position: "absolute", top: `${aberration}px`, left: 0,
          fontFamily: "var(--font-counter)", fontSize: "160px", fontWeight: 100,
          fontStyle: "italic", lineHeight: 1, letterSpacing: "-0.04em",
          color: "#ff00ff", pointerEvents: "none", whiteSpace: "nowrap",
          transition: "top 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
        }}>{number}</span>
        {/* Yellow ghost */}
        <span aria-hidden="true" style={{
          position: "absolute", top: `${aberration * 0.67}px`, left: 0,
          fontFamily: "var(--font-counter)", fontSize: "160px", fontWeight: 100,
          fontStyle: "italic", lineHeight: 1, letterSpacing: "-0.04em",
          color: "#ffff00", pointerEvents: "none", whiteSpace: "nowrap",
          transition: "top 0.28s cubic-bezier(0.25, 1, 0.5, 1)",
        }}>{number}</span>
        {/* Cyan ghost */}
        <span aria-hidden="true" style={{
          position: "absolute", top: `${aberration * 0.33}px`, left: 0,
          fontFamily: "var(--font-counter)", fontSize: "160px", fontWeight: 100,
          fontStyle: "italic", lineHeight: 1, letterSpacing: "-0.04em",
          color: "#00ffff", pointerEvents: "none", whiteSpace: "nowrap",
          transition: "top 0.14s cubic-bezier(0.25, 1, 0.5, 1)",
        }}>{number}</span>
        {/* Main number */}
        <span style={{
          fontFamily: "var(--font-counter)", fontSize: "160px", fontWeight: 100,
          fontStyle: "italic", lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.04em",
          position: "relative",
        }}>
          {number}
        </span>
        <img
          src="/sparkle.png"
          alt=""
          aria-hidden="true"
          style={{ height: "32px", width: "auto", marginBottom: "25px", position: "relative" }}
        />
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "var(--muted)",
          lineHeight: 1.75,
          maxWidth: "320px",
          marginTop: "4px",
        }}
      >
        {artwork.description}
      </p>

      <div
        style={{
          display: "flex",
          gap: "32px",
          marginTop: "8px",
        }}
      >
        {[
          { label: "Medium", value: "Digital" },
          { label: "Print size", value: artwork.printSize },
          { label: "Resolution", value: artwork.resolution },
          { label: "Edition", value: "50" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: "13px", color: "var(--ink)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginTop: "16px",
        }}
      >
        <AberrationButton href="#">Order print</AberrationButton>
        <a
          href="#"
          style={{
            fontSize: "11px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--muted)",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          View full
        </a>
      </div>
    </div>
  );

  return (
    <>
    {magnifying && (
      <ImageMagnifier
        src={artwork.image}
        imageRef={imgRef}
        onClose={() => setMagnifying(false)}
      />
    )}
    <div ref={rowRef}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "stretch",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.7s ease",
        }}
      >
        {isImageLeft ? (
          <>
            {/* Image — stretches to full row height, no padding */}
            <div style={{ alignSelf: "stretch" }}>{imageBlock}</div>
            {/* Info — centered vertically, with padding */}
            <div style={{ display: "flex", alignItems: "center", padding: "60px" }}>
              {infoBlock}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", padding: "60px" }}>
              {infoBlock}
            </div>
            <div style={{ alignSelf: "stretch" }}>{imageBlock}</div>
          </>
        )}
      </div>

      {/* Divider — not after last row */}
      {index < total - 1 && (
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--divider)",
          }}
        />
      )}
    </div>
    </>
  );
}
