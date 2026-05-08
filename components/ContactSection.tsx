'use client';

import { useLang } from '@/context/LanguageContext';

const CONTACT_ITEMS = [
  { icon: 'ph-fill ph-map-pin', label: 'Location', value: 'Taipei, Taiwan' },
  { icon: 'ph-fill ph-envelope-simple', label: 'Email', value: 'lyfun0202@gmail.com' },
  { icon: 'ph-fill ph-phone', label: 'Phone', value: '+886-928051947' },
];

export default function ContactSection() {
  const { t } = useLang();

  return (
    <div id="contact" className="snap-section snap-section-last flex flex-col">
      <section className="flex-grow py-20 flex items-center">
        <div className="container max-w-8xl mx-auto px-8 w-full">
          <div className="section-header stagger-item">
            <h2>Contact <span className="gradient-text">Me</span></h2>
          </div>
          <div>
            <h3
              className="text-lg md:text-2xl font-bold mb-8 lg:text-left text-center font-heading stagger-item"
              dangerouslySetInnerHTML={{ __html: t.contact_sub }}
            />
          </div>
          <div className="flex flex-col gap-12 items-center">
            <div className="w-full">
              <div className="card p-8 rounded-lg h-full stagger-item">
                <h3 className="text-lg md:text-2xl font-bold mb-6 font-heading">Contact Info</h3>
                <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                  {CONTACT_ITEMS.map(item => (
                    <div key={item.label} className="flex items-start md:flex-1">
                      <div className="w-12 h-12 bg-[#6C63FF]/20 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <i className={`${item.icon} text-[#6C63FF]`} style={{ fontSize: 20 }} />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-base font-medium mb-1 font-heading">{item.label}</h4>
                        <p className="text-xs md:text-base text-gray-400">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <h4 className="text-xs md:text-base font-medium mb-4 font-heading">Follow Me</h4>
                  <div className="flex">
                    <a
                      href="https://github.com/Lagrange1994"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass-btn px-4 py-2 rounded-full"
                    >
                      <i className="ph-fill ph-github-logo mr-2" style={{ fontSize: 20 }} />
                      <span className="text-xs sm:text-sm">github.com/Lagrange1994</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-p-dark-light py-6 w-full text-left">
        <div className="w-full px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-2 md:mb-0">
              <a href="#" className="text-2xl font-bold gradient-text-brand font-heading">
                Tim<span className="text-white">Lin</span>
              </a>
              <p className="text-xs md:text-base text-gray-400 mt-2">UI/UX Designer &amp; Web Developer</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-4 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-4 md:mb-0">© 2025 Tim Lin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
