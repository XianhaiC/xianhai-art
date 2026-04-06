"use client";

import { useEffect, useRef, useState } from "react";

export default function ImageMagnifier({ src, imageRef, onClose }) {
  const [mousePos, setMousePos] = useState(null);
  const [rect, setRect] = useState(null);

  const ZOOM = 3;

  useEffect(() => {
    if (imageRef?.current) {
      setRect(imageRef.current.getBoundingClientRect());
    }
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, imageRef]);

  function onMouseMove(e) {
    if (!rect) return;
    setMousePos({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    });
  }

  if (!rect) return null;

  const bgX = mousePos ? mousePos.x * 100 : 50;
  const bgY = mousePos ? mousePos.y * 100 : 50;
  const isZoomed = mousePos !== null;

  return (
    <>
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          backgroundColor: "rgba(0,0,0,0.75)",
          cursor: "zoom-out",
        }}
      />

      {/* Zoom layer — exactly over the original image */}
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={() => setMousePos(null)}
        onClick={onClose}
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          zIndex: 201,
          cursor: isZoomed ? "crosshair" : "zoom-out",
          overflow: "hidden",
        }}
      >
        {/* Base image — dims when cursor is over */}
        <img
          src={src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: isZoomed ? 0.12 : 1,
            transition: "opacity 0.25s ease",
          }}
        />

        {/* Magnified layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: isZoomed ? 1 : 0,
            transition: "opacity 0.25s ease",
            backgroundImage: `url(${src})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Crosshair */}
        {isZoomed && (
          <>
            <div style={{
              position: "absolute",
              left: `${mousePos.x * 100}%`,
              top: 0, bottom: 0,
              width: "1px",
              backgroundColor: "rgba(255,255,255,0.3)",
              pointerEvents: "none",
              transform: "translateX(-50%)",
            }} />
            <div style={{
              position: "absolute",
              top: `${mousePos.y * 100}%`,
              left: 0, right: 0,
              height: "1px",
              backgroundColor: "rgba(255,255,255,0.3)",
              pointerEvents: "none",
              transform: "translateY(-50%)",
            }} />
          </>
        )}

        {/* Zoom indicator */}
        {isZoomed && (
          <div style={{
            position: "absolute",
            bottom: "12px",
            right: "16px",
            fontSize: "11px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.45)",
            pointerEvents: "none",
          }}>
            {ZOOM}×
          </div>
        )}
      </div>

      {/* Esc hint */}
      <div style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 202,
        fontSize: "11px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
        pointerEvents: "none",
      }}>
        Esc or click to close
      </div>
    </>
  );
}
