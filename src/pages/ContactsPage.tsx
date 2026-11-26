import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { translations } from '../i18n';
import type { Language, SiteSettings } from '../types';

interface ContactsPageProps {
  lang: Language;
  settings: SiteSettings;
}

export function ContactsPage({ lang, settings }: ContactsPageProps) {
  const t = translations[lang];
  const address = lang === 'uz' ? settings.address_uz : settings.address_ru;
  const workingHours = lang === 'uz' ? settings.working_hours_uz : settings.working_hours_ru;

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
            {t.contacts.kicker}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F2544] tracking-tight text-balance">
            {t.contacts.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.contacts.subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.footer.addressLabel}
                </h2>
                <p className="mt-1 text-base font-medium text-[#0F2544]">{address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Phone className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.footer.phoneLabel}
                </h2>
                <a
                  href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                  className="mt-1 inline-block text-base font-mono font-medium text-[#0F2544] hover:text-[#047857] tabular-nums"
                >
                  {settings.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Mail className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.footer.emailLabel}
                </h2>
                <a
                  href={`mailto:${settings.email}`}
                  className="mt-1 inline-block text-base font-mono font-medium text-[#0F2544] hover:text-[#047857]"
                >
                  {settings.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-[#047857] mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t.footer.hoursLabel}
                </h2>
                <p className="mt-1 text-base font-medium text-[#0F2544] tabular-nums">
                  {workingHours}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between bg-[#0B1D36] text-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex-1 min-h-[240px]">
              <svg
                viewBox="0 0 600 320"
                className="w-full h-full object-cover"
                aria-hidden="true"
              >
                <rect width="600" height="320" fill="#10294B" />
                <path
                  d="M0 70 H600 M0 190 H600 M120 0 V320 M340 0 V320 M490 0 V320"
                  stroke="#1D4073"
                  strokeWidth="3"
                />
                <path d="M0 140 L600 115" stroke="#2B5797" strokeWidth="6" />
                <rect
                  x="195"
                  y="104"
                  width="120"
                  height="56"
                  rx="6"
                  fill="#173560"
                  stroke="#3B6BB3"
                  strokeWidth="1.5"
                />
                <circle cx="255" cy="132" r="24" fill="#059669" fillOpacity="0.25" />
                <circle
                  cx="255"
                  cy="132"
                  r="8"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="px-6 py-4 bg-[#09172B] flex items-center justify-between gap-4 border-t border-[#173560]">
              <span className="font-mono text-xs text-slate-300 tabular-nums">
                {t.footer.mapCoords}
              </span>
              <a
                href="https://www.openstreetmap.org/?mlat=41.0056&mlon=71.6083#map=15/41.0056/71.6083"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
              >
                <span>{t.footer.openMap}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
