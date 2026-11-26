import { ArrowRight } from 'lucide-react';
import { HERO_CAMPUS_IMAGE } from '../data/fallbackData';
import { translations } from '../i18n';
import type { Language, SiteSettings } from '../types';
import { SafeImage } from './SafeImage';

interface HeroSectionProps {
  lang: Language;
  isDemoMode: boolean;
  settings: SiteSettings;
}

export function HeroSection({ lang, isDemoMode, settings }: HeroSectionProps) {
  const t = translations[lang];

  const regionText = lang === 'uz' ? settings.region_uz : settings.region_ru;
  const headline = lang === 'uz' ? settings.hero_headline_uz : settings.hero_headline_ru;
  const subtitle = lang === 'uz' ? settings.hero_subtitle_uz : settings.hero_subtitle_ru;
  const schoolName = lang === 'uz' ? settings.school_name_uz : settings.school_name_ru;

  const stats = [
    { label: t.stats.studentsLabel, value: settings.students_count },
    { label: t.stats.teachersLabel, value: settings.teachers_count },
    { label: t.stats.classesLabel, value: settings.classes_count },
    { label: t.stats.foundedLabel, value: settings.founded_year },
  ];

  return (
    <section id="hero" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Content Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wide text-slate-500 mb-4">
              {regionText}
              {isDemoMode && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="text-[#B45309]">{t.demoNotice}</span>
                </>
              )}
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-semibold leading-[1.15] tracking-tight text-[#0F2544] text-balance max-w-2xl">
              {headline}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#news"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2544]"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>

              <a
                href="#about"
                className="inline-flex items-center px-5 py-3 text-sm font-semibold text-[#0F2544] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2544]"
              >
                {t.hero.secondaryCta}
              </a>
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative flex-1 min-h-[260px] lg:min-h-[360px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <SafeImage
                src={HERO_CAMPUS_IMAGE}
                alt={t.hero.campusCaption}
                variant="hero"
                fallbackLabel={schoolName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-500 italic">{t.hero.campusCaption}</p>
          </div>
        </div>

        {/* Full-Width 4-Column Quick Stats Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`${idx > 0 ? 'lg:border-l lg:border-slate-200 lg:pl-8' : ''}`}
            >
              <div className="font-mono text-2xl sm:text-3xl font-medium text-[#0F2544] tabular-nums tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
