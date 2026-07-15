import './styles/portfolio.css';
import './styles/tailwind.css';
import { LangProvider } from './context/LangContext';
import { useRiseReveal } from './utils/useRiseReveal';
import { useMobileCardSquircle } from './utils/useMobileCardSquircle';
import Loader from './components/Loader';
import BeamsBackground from './components/BeamsBackground';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import SkillsSection from './components/SkillsSection';
import PortfolioSection from './components/PortfolioSection';
import ContactSection from './components/ContactSection';
import ChatPanel from './components/ChatPanel';

export default function App() {
  useRiseReveal();
  useMobileCardSquircle();

  return (
    <LangProvider>
      <Loader />
      <BeamsBackground />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SkillsSection />
      <PortfolioSection />
      <ContactSection />
      <ChatPanel />
    </LangProvider>
  );
}
