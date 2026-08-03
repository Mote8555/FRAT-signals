import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import TrustMetrics from "../components/landing/TrustMetrics";
import Problem from "../components/landing/Problem";
import Comparison from "../components/landing/Comparison";
import Pipeline from "../components/landing/Pipeline";
import DashboardPreview from "../components/landing/DashboardPreview";
import Features from "../components/landing/Features";
import Markets from "../components/landing/Markets";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-gray-50 font-sans bg-slate-950">
      <Navbar />
      <main>
        <Hero />
        <TrustMetrics />
        <Problem />
        <Comparison />
        <Pipeline />
        <DashboardPreview />
        <Features />
        <Markets />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
