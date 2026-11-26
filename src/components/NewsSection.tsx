import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, translations } from '../i18n';
import type { Language, NewsItem } from '../types';
import { SafeImage } from './SafeImage';

interface NewsSectionProps {
  lang: Language;
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  limit?: number;
  showAllButton?: boolean;
  isStandalonePage?: boolean;
}

export function NewsSection({
  lang,
  news,
  loading,
  error,
  onRetry,
  limit,
  showAllButton = false,
  isStandalonePage = false,
}: NewsSectionProps) {
  const t = translations[lang];

  const sortedNews = [...news].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    if (timeB !== timeA) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });

  const visibleNews = typeof limit === 'number' ? sortedNews.slice(0, limit) : sortedNews;

  return (
    <section id="news" className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
              {t.news.kicker}
            </p>
            {isStandalonePage ? (
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F2544] tracking-tight text-balance">
                {t.news.allPageTitle}
              </h1>
            ) : (
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544] tracking-tight text-balance">
                {t.news.title}
              </h2>
            )}
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.news.subtitle}</p>
          </div>

          {showAllButton && sortedNews.length > 0 && (
            <Link
              to="/news"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0F2544] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.news.allNewsButton}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          )}
        </div>

        {loading && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
              >
                <div className="aspect-[4/3] w-full rounded-lg bg-slate-100 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-5 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">{t.news.error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.news.retry}</span>
            </button>
          </div>
        )}

        {!loading && !error && visibleNews.length === 0 && (
          <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-500">
            {t.news.empty}
          </div>
        )}

        {!loading && !error && visibleNews.length > 0 && (
          <>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleNews.map((item) => {
                const title = lang === 'uz' ? item.title_uz : item.title_ru;
                const summary =
                  lang === 'uz'
                    ? item.summary_uz?.trim() || item.content_uz
                    : item.summary_ru?.trim() || item.content_ru;

                return (
                  <article
                    key={item.id}
                    className="group bg-white border border-slate-200 hover:border-[#0F2544]/40 rounded-xl overflow-hidden flex flex-col transition-colors"
                  >
                    <Link
                      to={`/news/${item.id}`}
                      className="block aspect-[4/3] w-full bg-slate-100 border-b border-slate-200 overflow-hidden"
                    >
                      <SafeImage
                        src={item.image_url}
                        alt={title}
                        variant="news"
                        fallbackLabel={title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </Link>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <time
                          dateTime={item.created_at}
                          className="block text-xs font-medium text-slate-500 tabular-nums"
                        >
                          {formatDate(item.created_at, lang)}
                        </time>
                        <h3 className="mt-2 font-serif text-xl font-semibold text-[#0F2544] leading-snug line-clamp-2">
                          <Link
                            to={`/news/${item.id}`}
                            className="hover:text-[#047857] transition-colors"
                          >
                            {title}
                          </Link>
                        </h3>
                        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {summary}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <Link
                          to={`/news/${item.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2544] hover:text-[#047857] transition-colors whitespace-nowrap"
                        >
                          <span>{t.news.readMore}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {showAllButton && (
              <div className="mt-10 flex justify-center">
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{t.news.allNewsButton}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
