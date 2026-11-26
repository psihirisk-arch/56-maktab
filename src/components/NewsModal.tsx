import { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatDate, translations } from '../i18n';
import type { Language, NewsItem } from '../types';
import { SafeImage } from './SafeImage';

interface NewsModalProps {
  article: NewsItem | null;
  lang: Language;
  onClose: () => void;
}

export function NewsModal({ article, lang, onClose }: NewsModalProps) {
  const t = translations[lang];

  useEffect(() => {
    if (!article) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [article, onClose]);

  if (!article) return null;

  const title = lang === 'uz' ? article.title_uz : article.title_ru;
  const content = lang === 'uz' ? article.content_uz : article.content_ru;
  const paragraphs = content.split(/\n+/).filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            <span>{t.news.modalCategory}</span>
            <span aria-hidden="true"> · </span>
            <time dateTime={article.created_at} className="tabular-nums">
              {formatDate(article.created_at, lang)}
            </time>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.news.close}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 mb-6">
            <SafeImage
              src={article.image_url}
              alt={title}
              variant="news"
              fallbackLabel={title}
              className="w-full h-full object-cover"
            />
          </div>

          <h2
            id="news-modal-title"
            className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544] leading-snug text-balance"
          >
            {title}
          </h2>

          <div className="mt-6 space-y-4 max-w-prose text-base text-slate-700 leading-relaxed">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-[#0F2544] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {t.news.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
