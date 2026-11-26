import { RefreshCw } from 'lucide-react';
import { translations } from '../i18n';
import type { Language, StaffMember } from '../types';
import { SafeImage } from './SafeImage';

interface StaffSectionProps {
  lang: Language;
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function StaffSection({ lang, staff, loading, error, onRetry }: StaffSectionProps) {
  const t = translations[lang];

  return (
    <section id="staff" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
            {t.staff.kicker}
          </p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544] tracking-tight text-balance">
            {t.staff.title}
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.staff.subtitle}</p>
        </div>

        {loading && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
              >
                <div className="w-full aspect-square rounded-lg bg-slate-100 mb-5" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 p-8 bg-white border border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">{t.staff.error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.staff.retry}</span>
            </button>
          </div>
        )}

        {!loading && !error && staff.length === 0 && (
          <div className="mt-10 p-10 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
            {t.staff.empty}
          </div>
        )}

        {!loading && !error && staff.length > 0 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((person) => {
              const position = lang === 'uz' ? person.position_uz : person.position_ru;
              return (
                <article
                  key={person.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-square w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
                    <SafeImage
                      src={person.photo_url}
                      alt={person.full_name}
                      variant="staff"
                      fallbackLabel={person.full_name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-[#0F2544] leading-snug">
                        {person.full_name}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium text-[#047857]">{position}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{t.staff.receptionLabel}:</span>{' '}
                      <span className="tabular-nums">{person.reception_hours}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
