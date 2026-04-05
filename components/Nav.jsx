"use client";

export default function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "28px 60px",
        backgroundColor: "var(--bg)",
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "18px",
          fontWeight: 300,
          letterSpacing: "0.1em",
          color: "var(--ink)",
        }}
      >
        先海
      </a>

      <ul
        style={{
          display: "flex",
          gap: "36px",
          listStyle: "none",
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
  );
}
