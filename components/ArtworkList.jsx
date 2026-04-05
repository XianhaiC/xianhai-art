import ArtworkRow from "@/components/ArtworkRow";
import { artworks } from "@/lib/artworks";

export default function ArtworkList() {
  return (
    <section id="works" style={{ paddingTop: "40px" }}>
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          padding: "0 60px",
          marginBottom: "40px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted)",
            whiteSpace: "nowrap",
          }}
        >
          Selected works
        </span>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "var(--divider)" }}
        />
      </div>

      {artworks.map((artwork, index) => (
        <ArtworkRow
          key={artwork.id}
          artwork={artwork}
          index={index}
          total={artworks.length}
        />
      ))}
    </section>
  );
}
