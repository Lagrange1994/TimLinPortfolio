import { lazy, Suspense, useEffect } from 'react';
import './styles/portfolio.css';
import './styles/tailwind.css';
import { LangProvider } from './context/LangContext';
import { useRiseReveal } from './utils/useRiseReveal';
import { usePauseOffscreenAnimations } from './utils/usePauseOffscreenAnimations';
import { startSceneQualityGovernor } from './utils/sceneQualityGovernor';
import { fallBackToStaticScenes, staticScenesOn } from './utils/staticScenes';
import Loader from './components/Loader';
import BeamsBackground from './components/BeamsBackground';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BackToTop from './components/BackToTop';
import ChatPanel from './components/ChatPanel';
import LazyUnit from './components/LazyUnit';
import ErrorBoundary from './components/ErrorBoundary';
import LazySectionFallback from './components/LazySectionFallback';

// Everything below the hero is split out of the main chunk — About (24KB
// source), Skills (111KB — the biggest single component, echarts tracking
// chart included), Portfolio (70KB) and Contact (16KB) have no reason to sit
// in the same bundle Hero/Navbar/BeamsBackground need parsed before first
// paint. Each becomes its own chunk, fetched in parallel with main.js rather
// than adding to it. Each Suspense boundary reserves an approximate section
// height while its module is in flight: a null fallback makes the document
// collapse to zero height and shifts every later section when the import
// resolves. Each is also wrapped in its own
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
  // one-shot check as HeroSection / BeamsBackground) — nothing to govern;
  // same for a desktop already on static scenes. If the lowest quality
  // level still can't keep up, the governor swaps the scenes for the
  // images too (see staticScenes.ts).
  useEffect(() => {
    if (window.innerWidth < 768 || staticScenesOn()) return;
    return startSceneQualityGovernor(() => fallBackToStaticScenes());
  }, []);

  return (
    <LangProvider>
      <Loader />
      <BeamsBackground />
      <Navbar />
      <HeroSection />
      <LazyUnit name="about"><ErrorBoundary><Suspense fallback={<LazySectionFallback name="about" />}><AboutSection /></Suspense></ErrorBoundary></LazyUnit>
      <ErrorBoundary><Suspense fallback={<LazySectionFallback name="skills" />}><SkillsSection /></Suspense></ErrorBoundary>
      <LazyUnit name="portfolio"><ErrorBoundary><Suspense fallback={<LazySectionFallback name="portfolio" />}><PortfolioSection /></Suspense></ErrorBoundary></LazyUnit>
      <LazyUnit name="contact"><ErrorBoundary><Suspense fallback={<LazySectionFallback name="contact" />}><ContactSection /></Suspense></ErrorBoundary></LazyUnit>
      <BackToTop />
      <ChatPanel />
    </LangProvider>
  );
}
