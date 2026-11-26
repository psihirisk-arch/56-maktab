import { useState } from 'react';
import { Lock, Menu, X } from 'lucide-react';
import { translations } from '../i18n';
import type { Language } from '../types';

interface HeaderProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  isAdminView: boolean;
  onToggleAdmin: () => void;
}

export function Header({ lang, onChangeLang, isAdminView, onToggleAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const navItems = [
    { href: '#hero', label: t.nav.home },
    { href: '#about', label: t.nav.about },
    { href: '#staff', label: t.nav.staff },
    { href: '#news', label: t.nav.news },
    { href: '#resources', label: t.nav.resources },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (isAdminView) {
      onToggleAdmin();
      setTimeout(() => {
        const el = document.querySelector(href);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Clean Single-Line School Brand */}
        <a
          href="#hero"
          onClick={(e) => {
            if (isAdminView) {
              e.preventDefault();
              onToggleAdmin();
            }
          }}
          className="flex items-center gap-2.5 text-[#0F2544] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2544] rounded-md"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="32" height="32" rx="7" fill="#0F2544" />
            <path
              d="M16 6L24 10.5V16.5C24 21.3 20.6 25.4 16 26.8C11.4 25.4 8 21.3 8 16.5V10.5L16 6Z"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            <path
              d="M12.5 14.5L16 12.5L19.5 14.5V19.5L16 21.5L12.5 19.5V14.5Z"
              fill="#059669"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </svg>
          <span className="font-serif text-lg font-semibold tracking-tight whitespace-nowrap shrink-0">
            {t.brandShort}
          </span>
        </a>

        {/* Zone 2: Primary Navigation Links */}
        {!isAdminView && (
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-1 text-slate-600 hover:text-[#0F2544] border-b-2 border-transparent hover:border-[#059669] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F2544]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Zone 3: Language Switcher + Admin CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Language"
            className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => onChangeLang('uz')}
              aria-pressed={lang === 'uz'}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'uz'
                  ? 'bg-white text-[#0F2544] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              O&apos;Z
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('ru')}
              aria-pressed={lang === 'ru'}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'ru'
                  ? 'bg-white text-[#0F2544] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RU
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onToggleAdmin();
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2544] ${
              isAdminView
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                : 'bg-[#0F2544] text-white hover:bg-[#173560]'
            }`}
          >
            {!isAdminView && <Lock className="w-3.5 h-3.5 shrink-0" />}
            <span>{isAdminView ? t.backToSite : t.adminButton}</span>
          </button>

          {!isAdminView && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Menu"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {!isAdminView && mobileMenuOpen && (
        <nav
          aria-label="Mobile"
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-[#0F2544] hover:bg-slate-50 rounded-lg transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
