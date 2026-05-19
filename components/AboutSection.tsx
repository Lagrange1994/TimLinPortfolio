'use client';

import Image from 'next/image';
import { useLang } from '@/context/LanguageContext';
import ProfileCard from './ProfileCard';

const DOMAIN_TAGS = ['Law Enforcement', 'Healthcare', 'Environmental Monitoring', 'Entertainment'];
const AI_TOOLS = ['Gemini', 'Claude', 'Stitch', 'Rodin'];

export default function AboutSection() {
  const { t } = useLang();

  return (
    <section id="about" className="snap-section bg-p-dark-light md:flex md:items-center">
      <div className="container max-w-8xl mx-auto px-8 w-full">
        <div className="section-header stagger-item">
          <h2>About <span className="gradient-text">Me</span></h2>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-16" id="about-cols">
          {/* LEFT: ProfileCard */}
          <div className="flex flex-col gap-4 stagger-item md:[flex:1]" id="about-left">

            {/* ProfileCard replaces static photo */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProfileCard
                avatarUrl="/img/about_me.png"
                name="Tim Lin"
                title="UI/UX Designer & Web Dev"
                handle="timlin"
                status="Open for work"
                contactText="Contact Me"
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={false}
                behindGlowEnabled={true}
                behindGlowColor="rgba(108, 99, 255, 0.6)"
                innerGradient="linear-gradient(145deg,#3d3580aa 0%,#6C63FF44 50%,#FF658433 100%)"
                onContactClick={() => { window.location.href = 'mailto:lyfun0202@gmail.com'; }}
              />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0.875rem', overflow: 'hidden' }}>
              {[['5+', 'Years'], ['10+', 'Projects'], ['4', 'Domains']].map(([num, label], i) => (
                <div key={label} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.09)' : undefined }}>
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1, margin: '0 0 3px 0' }}>{num}</p>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(150,150,170,0.6)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* AI Workflow */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(150,150,170,0.6)', fontWeight: 600, margin: '0 0 0.6rem 0' }}>AI Workflow</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AI_TOOLS.map(tool => (
                  <span key={tool} style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(220,220,230,0.85)', fontSize: 12 }}>{tool}</span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: text */}
          <div className="flex flex-col gap-5 stagger-item md:[flex:2]" id="about-right">
            <h3
              className="font-bold font-heading text-white leading-tight stagger-item"
              style={{ fontSize: 'clamp(1.25rem,2.5vw,1.75rem)' }}
              dangerouslySetInnerHTML={{ __html: t.about_role }}
            />
            <p className="text-gray-300 leading-relaxed stagger-item" style={{ fontSize: 'clamp(0.8rem,1.2vw,0.95rem)' }} dangerouslySetInnerHTML={{ __html: t.about_p1 }} />
            <p className="text-gray-300 leading-relaxed stagger-item" style={{ fontSize: 'clamp(0.8rem,1.2vw,0.95rem)' }} dangerouslySetInnerHTML={{ __html: t.about_p2 }} />
            <p className="text-gray-300 leading-relaxed stagger-item" style={{ fontSize: 'clamp(0.8rem,1.2vw,0.95rem)' }} dangerouslySetInnerHTML={{ __html: t.about_p3 }} />

            <div className="flex flex-wrap gap-2 stagger-item">
              {DOMAIN_TAGS.map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(220,220,230,0.85)', fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.04)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
