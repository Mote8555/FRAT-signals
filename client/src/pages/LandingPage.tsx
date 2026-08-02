import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Methodology from "../components/landing/Methodology";
import Pairs from "../components/landing/Pairs";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-50 font-sans bg-slate-950">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Methodology />
        <Pairs />
      </main>
      <Footer />
    </div>
  );
}
