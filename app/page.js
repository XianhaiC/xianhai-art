import ArtworkList from "@/components/ArtworkList";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollTicker from "@/components/ScrollTicker";

export default function HomePage() {
  return (
    <main>
      <Header />
      <ScrollTicker />
      <ArtworkList />
      <Footer />
    </main>
  );
}
