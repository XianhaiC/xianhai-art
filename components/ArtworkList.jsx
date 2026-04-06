import ArtworkRow from "@/components/ArtworkRow";
import { artworks } from "@/lib/artworks";

export default function ArtworkList() {
  return (
    <section id="works">
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
