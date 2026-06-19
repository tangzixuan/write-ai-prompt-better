import Header from "./components/Header";
import Hero from "./components/Hero";
import WhatIsPrompt from "./components/WhatIsPrompt";
import Resources from "./components/Resources";
import SkillsSection from "./components/SkillsSection";
import ExtensionPromo from "./components/ExtensionPromo";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <WhatIsPrompt />
        <Resources />
        <SkillsSection />
        <ExtensionPromo />
      </main>
      <Footer />
    </div>
  );
}
