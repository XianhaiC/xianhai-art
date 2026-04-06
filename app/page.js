import ArtworkList from "@/components/ArtworkList";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/GrainOverlay";
import Header from "@/components/Header";
import ScrollTicker from "@/components/ScrollTicker";

export default function HomePage() {
  return (
    <main>
      <GrainOverlay driftSpeed={0.2} maxOpacity={0.9} noiseScale={1.0} />
      <Header />
      <ScrollTicker />
      <ArtworkList />
      <Footer />
    </main>
  );
}
