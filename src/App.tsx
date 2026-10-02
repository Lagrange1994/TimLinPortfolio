import './styles/portfolio.css';
import './styles/tailwind.css';
import { LangProvider } from './context/LangContext';
import { useRiseReveal } from './utils/useRiseReveal';
import { usePauseOffscreenAnimations } from './utils/usePauseOffscreenAnimations';
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
