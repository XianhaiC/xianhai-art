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
      <img
        src="/art-simple-logo.png"
        alt="先海"
        style={{ height: "32px", width: "auto" }}
      />

      <ul
        style={{
          display: "flex",
          gap: "28px",
          listStyle: "none",
        }}
      >
        {[
          { label: "Instagram", href: "#" },
          { label: "Twitter", href: "https://x.com/muruuu" },
          { label: "Shop", href: "#" },
        ].map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#666666",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.target.style.color = "#666666")}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <span
        style={{
          fontSize: "11px",
          color: "#666666",
          letterSpacing: "0.06em",
        }}
      >
        © 2026 先海. All rights reserved.
      </span>
    </footer>
  );
}
