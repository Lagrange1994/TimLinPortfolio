import { useEffect } from 'react';
import './styles/portfolio.css';
import './styles/tailwind.css';
import { LangProvider } from './context/LangContext';
import { useRiseReveal } from './utils/useRiseReveal';
import { usePauseOffscreenAnimations } from './utils/usePauseOffscreenAnimations';
import { startSceneQualityGovernor } from './utils/sceneQualityGovernor';
import Loader from './components/Loader';
import BeamsBackground from './components/BeamsBackground';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import SkillsSection from './components/SkillsSection';
import PortfolioSection from './components/PortfolioSection';
import ContactSection from './components/ContactSection';
import ChatPanel from './components/ChatPanel';
import LazyUnit from './components/LazyUnit';

export default function App() {
  useRiseReveal();
  usePauseOffscreenAnimations();
  // Phones show still images instead of the Spline scenes (same 768px
  // one-shot check as HeroSection / BeamsBackground) — nothing to govern.
  useEffect(() => {
    if (window.innerWidth < 768) return;
    return startSceneQualityGovernor();
  }, []);

  return (
    <LangProvider>
      <Loader />
      <BeamsBackground />
      <Navbar />
      <HeroSection />
      <LazyUnit name="about"><AboutSection /></LazyUnit>
      <SkillsSection />
      <LazyUnit name="portfolio"><PortfolioSection /></LazyUnit>
      <LazyUnit name="contact"><ContactSection /></LazyUnit>
      <ChatPanel />
    </LangProvider>
  );
}
