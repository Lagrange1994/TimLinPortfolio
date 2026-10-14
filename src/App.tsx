import { lazy, Suspense, useEffect } from 'react';
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
import BackToTop from './components/BackToTop';
import ChatPanel from './components/ChatPanel';
import LazyUnit from './components/LazyUnit';
import ErrorBoundary from './components/ErrorBoundary';

// Everything below the hero is split out of the main chunk — About (24KB
// source), Skills (111KB — the biggest single component, echarts tracking
// chart included), Portfolio (70KB) and Contact (16KB) have no reason to sit
// in the same bundle Hero/Navbar/BeamsBackground need parsed before first
// paint. Each becomes its own chunk, fetched in parallel with main.js rather
// than adding to it; Suspense fallback is `null` because LazyUnit already
// renders these at their natural flow height on first mount (no reserved
// space to fill) — same as the brief gap LazyUnit itself leaves on a
// cold remount, not a new failure mode. Each is also wrapped in its own
// ErrorBoundary: a rejected import() (stale tab after a redeploy requesting
// a deleted chunk hash, or a flaky network) throws during render, and with
// nothing to catch it React unmounts the whole tree, not just the failed
// section. The boundary renders nothing on error instead, same as the null
// Suspense fallback — one section goes missing rather than the whole page.
const AboutSection = lazy(() => import('./components/AboutSection'));
const SkillsSection = lazy(() => import('./components/SkillsSection'));
const PortfolioSection = lazy(() => import('./components/PortfolioSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

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
      <LazyUnit name="about"><ErrorBoundary><Suspense fallback={null}><AboutSection /></Suspense></ErrorBoundary></LazyUnit>
      <ErrorBoundary><Suspense fallback={null}><SkillsSection /></Suspense></ErrorBoundary>
      <LazyUnit name="portfolio"><ErrorBoundary><Suspense fallback={null}><PortfolioSection /></Suspense></ErrorBoundary></LazyUnit>
      <LazyUnit name="contact"><ErrorBoundary><Suspense fallback={null}><ContactSection /></Suspense></ErrorBoundary></LazyUnit>
      <BackToTop />
      <ChatPanel />
    </LangProvider>
  );
}
