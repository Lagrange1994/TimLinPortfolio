'use client';

import Image from 'next/image';
import { useLang } from '@/context/LanguageContext';

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
          {/* LEFT: photo + info */}
          <div className="flex flex-col gap-4 stagger-item" id="about-left" style={{ width: '100%' }}>

            {/* Photo + Quick Facts row */}
            <div id="photo-qf-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '1rem' }}>
              {/* Photo */}
              <div style={{ position: 'relative', width: 160, height: 185, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -4, borderRadius: 999, background: 'linear-gradient(135deg,rgba(108,99,255,0.5),rgba(255,101,132,0.3))', filter: 'blur(18px)', zIndex: 0 }} />
                <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 999, overflow: 'hidden', zIndex: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#0a0a0f' }}>
                  <Image src="/img/about_me.jpg" alt="Tim Lin" fill style={{ objectFit: 'cover', objectPosition: 'top center' }} />
                </div>
                <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f1a12', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
                    Open for Opportunities
                  </span>
                </div>
              </div>

              {/* Quick Facts */}
              <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '1rem 1.25rem' }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(150,150,170,0.6)', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Quick Facts</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Name', 'Tim Lin'],
                      ['Location', 'Taipei, Taiwan'],
                      ['Focus', 'Enterprise UI/UX'],
                      ['Email', 'lyfun0202@gmail.com'],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '4px 0', fontSize: 12, color: 'rgba(150,150,170,0.7)', width: 72, verticalAlign: 'top' }}>{label}</td>
                        <td style={{ padding: '4px 0', fontSize: 12, color: label === 'Name' ? '#fff' : 'rgba(220,220,230,0.8)', fontWeight: label === 'Name' ? 600 : undefined }}>{value}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: '4px 0', fontSize: 12, color: 'rgba(150,150,170,0.7)', verticalAlign: 'top' }}>Status</td>
                      <td style={{ padding: '4px 0' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                          Open for work
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
          <div className="flex flex-col gap-5 stagger-item" id="about-right" style={{ width: '100%' }}>
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
