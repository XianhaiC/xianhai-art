"use client";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "60px 60px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderTop: "1px solid var(--divider)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "15px",
          fontWeight: 300,
          letterSpacing: "0.1em",
        }}
      >
        先海
      </span>

      <ul
        style={{
          display: "flex",
          gap: "28px",
          listStyle: "none",
        }}
      >
        {["Instagram", "Twitter", "Shop"].map((label) => (
          <li key={label}>
            <a
              href="#"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
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

      <span
        style={{
          fontSize: "11px",
          color: "var(--muted)",
          letterSpacing: "0.06em",
        }}
      >
        © 2026 先海. All rights reserved.
      </span>
    </footer>
  );
}
