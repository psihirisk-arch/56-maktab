import { useState } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { translations } from '../i18n';
import type { BellScheduleData, Language, SiteSettings } from '../types';

interface AboutAndResourcesProps {
  lang: Language;
  settings: SiteSettings;
  schedule: BellScheduleData;
}

export function AboutAndResources({ lang, settings, schedule }: AboutAndResourcesProps) {
  const [activeShift, setActiveShift] = useState<'shift1' | 'shift2'>('shift1');
  const t = translations[lang];
  const rows = schedule[activeShift];
  const aboutDescription = lang === 'uz' ? settings.about_uz : settings.about_ru;

  return (
    <>
      {/* About School & Bell Schedule Section */}
      <section id="about" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* School Profile & Highlights */}
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
                {t.about.kicker}
              </p>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544] tracking-tight text-balance">
                {t.about.title}
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
                {aboutDescription}
              </p>

              <div className="mt-8 divide-y divide-slate-200 border-t border-b border-slate-200">
                {t.about.highlights.map((item) => (
                  <div key={item.title} className="py-5">
                    <h3 className="text-base font-semibold text-[#0F2544]">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bell Schedule Panel */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-[#0F2544]">
                    <Clock className="w-4 h-4 text-[#B45309] shrink-0" />
                    <h3 className="font-serif text-xl font-semibold">{t.about.bellTitle}</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t.about.bellSubtitle}</p>
                </div>

                <div
                  role="tablist"
                  aria-label={t.about.bellTitle}
                  className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeShift === 'shift1'}
                    onClick={() => setActiveShift('shift1')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeShift === 'shift1'
                        ? 'bg-white text-[#0F2544] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.about.shift1}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeShift === 'shift2'}
                    onClick={() => setActiveShift('shift2')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeShift === 'shift2'
                        ? 'bg-white text-[#0F2544] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.about.shift2}
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 pr-4">{t.about.lessonCol}</th>
                      <th className="py-2.5 px-4">{t.about.timeCol}</th>
                      <th className="py-2.5 pl-4 text-right">{t.about.breakCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {rows.map((row) => (
                      <tr key={row.lesson} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-4 font-medium text-[#0F2544] tabular-nums whitespace-nowrap">
                          {row.lesson}
                          {t.about.lessonUnit}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs sm:text-sm text-slate-700 tabular-nums whitespace-nowrap">
                          {row.time}
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {row.breakMin === '—' || row.breakMin === '-'
                            ? '—'
                            : `${row.breakMin} ${t.about.minUnit}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Useful State Education Links Section */}
      <section id="resources" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
              {t.resources.kicker}
            </p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544] tracking-tight text-balance">
              {t.resources.title}
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.resources.subtitle}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.resources.items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-6 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-[#0F2544]/40 rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2544]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-[#047857]">
                      {item.domain}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F2544] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </div>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-[#0F2544] group-hover:text-[#173560]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-[#0F2544] flex items-center gap-1.5">
                  <span>{t.resources.visitLabel}</span>
                  <span aria-hidden="true">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
