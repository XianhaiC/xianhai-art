export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 60px 80px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "20px",
        }}
      >
        Digital illustration &amp; fine art prints
      </p>

      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(52px, 8vw, 96px)",
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}
      >
        先海
      </h1>

      <p
        style={{
          marginTop: "28px",
          fontSize: "13px",
          color: "var(--muted)",
          letterSpacing: "0.04em",
          maxWidth: "360px",
          lineHeight: 1.7,
        }}
      >
        Original 2D digital paintings. Each piece available as a limited fine
        art print, shipped worldwide.
      </p>

      <p
        style={{
          marginTop: "60px",
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
  );
}
