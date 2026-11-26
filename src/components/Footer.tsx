import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { translations } from '../i18n';
import type { Language, SiteSettings } from '../types';

interface FooterProps {
  lang: Language;
  settings: SiteSettings;
}

export function Footer({ lang, settings }: FooterProps) {
  const t = translations[lang];
  const schoolName = lang === 'uz' ? settings.school_name_uz : settings.school_name_ru;
  const address = lang === 'uz' ? settings.address_uz : settings.address_ru;
  const workingHours = lang === 'uz' ? settings.working_hours_uz : settings.working_hours_ru;

  return (
    <footer className="bg-[#0B1D36] text-slate-300 border-t border-[#173560]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* School Identity */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 text-white">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect width="32" height="32" rx="7" fill="#173560" />
                <path
                  d="M16 6L24 10.5V16.5C24 21.3 20.6 25.4 16 26.8C11.4 25.4 8 21.3 8 16.5V10.5L16 6Z"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />
                <path
                  d="M12.5 14.5L16 12.5L19.5 14.5V19.5L16 21.5L12.5 19.5V14.5Z"
                  fill="#059669"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
              </svg>
              <span className="font-serif text-lg font-semibold text-white tracking-tight">
                {schoolName}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              {t.footer.aboutText}
            </p>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t.footer.contactTitle}
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="sr-only">{t.footer.addressLabel}</dt>
                  <dd className="text-slate-300">{address}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <dt className="sr-only">{t.footer.phoneLabel}</dt>
                  <dd>
                    <a
                      href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
                      className="text-slate-300 hover:text-white transition-colors tabular-nums"
                    >
                      {settings.phone}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <dt className="sr-only">{t.footer.emailLabel}</dt>
                  <dd>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {settings.email}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="pt-1 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{t.footer.hoursLabel}:</span>{' '}
                <span className="tabular-nums">{workingHours}</span>
              </div>
            </dl>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t.footer.linksTitle}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#hero" className="text-slate-300 hover:text-white transition-colors">
                  {t.nav.home}
                </a>
              </li>
              <li>
                <a href="#about" className="text-slate-300 hover:text-white transition-colors">
                  {t.nav.about}
                </a>
              </li>
              <li>
                <a href="#staff" className="text-slate-300 hover:text-white transition-colors">
                  {t.nav.staff}
                </a>
              </li>
              <li>
                <a href="#news" className="text-slate-300 hover:text-white transition-colors">
                  {t.nav.news}
                </a>
              </li>
              <li>
                <a href="#resources" className="text-slate-300 hover:text-white transition-colors">
                  {t.nav.resources}
                </a>
              </li>
            </ul>
          </div>

          {/* Location Map Card for Davlatobod, Namangan */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t.footer.mapTitle}
            </h3>
            <a
              href="https://www.openstreetmap.org/?mlat=41.0056&mlon=71.6083#map=15/41.0056/71.6083"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 block rounded-xl overflow-hidden border border-[#1E3F70] bg-[#0F2544] hover:border-emerald-500/60 transition-colors"
            >
              <div className="relative h-32 w-full overflow-hidden">
                <svg
                  viewBox="0 0 320 140"
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                >
                  <rect width="320" height="140" fill="#10294B" />
                  <path
                    d="M0 32 H320 M0 88 H320 M64 0 V140 M184 0 V140 M265 0 V140"
                    stroke="#1D4073"
                    strokeWidth="2"
                  />
                  <path d="M0 64 L320 52" stroke="#2B5797" strokeWidth="4" />
                  <rect
                    x="92"
                    y="46"
                    width="66"
                    height="32"
                    rx="4"
                    fill="#173560"
                    stroke="#3B6BB3"
                    strokeWidth="1"
                  />
                  <circle cx="125" cy="62" r="14" fill="#059669" fillOpacity="0.22" />
                  <circle
                    cx="125"
                    cy="62"
                    r="5"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs bg-[#09172B]">
                <span className="font-mono text-slate-400 truncate tabular-nums">
                  {t.footer.mapCoords}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 group-hover:text-emerald-300 shrink-0 whitespace-nowrap">
                  {t.footer.openMap}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#173560] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{t.footer.copyright}</p>
          <p className="font-mono tabular-nums">emaktab.uz · my.maktab.uz · gov.uz</p>
        </div>
      </div>
    </footer>
  );
}
