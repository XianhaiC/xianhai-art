import ArtworkList from "@/components/ArtworkList";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/GrainOverlay";
import Header from "@/components/Header";
import ScrollTicker from "@/components/ScrollTicker";

export default function HomePage() {
  return (
    <>
      <GrainOverlay driftSpeed={0.2} maxOpacity={1.5} noiseScale={1.0} colorRGB="#ffd712" />
      <main>
        <Header />
        <ScrollTicker />
        <ArtworkList />
        <Footer />
      </main>
    </>
  );
}
