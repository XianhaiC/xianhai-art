"use client";

import { useEffect, useRef, useState } from "react";

export default function ArtworkRow({ artwork, index, total }) {
  const rowRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isImageLeft = index % 2 === 0;
  const number = String(index + 1).padStart(2, "0");

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
        cursor: "pointer",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
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
        src={artwork.image}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transform: hovered ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.6s ease",
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
      <span
        style={{
          fontSize: "11px",
          letterSpacing: "0.14em",
          color: "var(--muted)",
        }}
      >
        {number} / {String(total).padStart(2, "0")}
      </span>

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
          { label: "Print size", value: "A3 / A2" },
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
        <a
          href="#"
          style={{
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--bg)",
            backgroundColor: "var(--ink)",
            padding: "11px 24px",
            borderRadius: "999px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Order print
        </a>
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
    <div ref={rowRef}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "stretch",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
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
  );
}
