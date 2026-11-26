import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SafeImage } from '../components/SafeImage';
import { formatDate, translations } from '../i18n';
import { fetchNewsById } from '../services/api';
import type { Language, NewsItem } from '../types';

interface NewsDetailPageProps {
  lang: Language;
  news: NewsItem[];
}

export function NewsDetailPage({ lang, news }: NewsDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const t = translations[lang];

  const cachedArticle = news.find((item) => String(item.id) === String(id)) || null;
  const [article, setArticle] = useState<NewsItem | null>(cachedArticle);
  const [loading, setLoading] = useState<boolean>(!cachedArticle);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (cachedArticle) {
      setArticle(cachedArticle);
      setLoading(false);
      setNotFound(false);
      return;
    }

    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setNotFound(false);

    fetchNewsById(id)
      .then((data) => {
        if (!active) return;
        setArticle(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, cachedArticle]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-6">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-10 w-3/4 bg-slate-200 rounded" />
          <div className="aspect-[16/9] w-full bg-slate-100 rounded-xl" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
            <div className="h-4 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !article) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#0F2544]">{t.news.notFound}</h1>
          <Link
            to="/news"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.news.backToAllNews}</span>
          </Link>
        </div>
      </section>
    );
  }

  const title = lang === 'uz' ? article.title_uz : article.title_ru;
  const content = lang === 'uz' ? article.content_uz : article.content_ru;
  const summary = lang === 'uz' ? article.summary_uz?.trim() : article.summary_ru?.trim();
  const paragraphs = content.split(/\n+/).filter(Boolean);

  return (
    <article className="py-12 lg:py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2544] hover:text-[#047857] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.news.backToAllNews}</span>
        </Link>

        <div className="mt-6 text-xs font-medium text-slate-500">
          <span>{t.news.modalCategory}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={article.created_at} className="tabular-nums">
            {formatDate(article.created_at, lang)}
          </time>
        </div>

        <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-[#0F2544] leading-tight text-balance">
          {title}
        </h1>

        {summary && (
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-prose">{summary}</p>
        )}

        <div className="mt-8 aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          <SafeImage
            src={article.image_url}
            alt={title}
            variant="news"
            fallbackLabel={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mt-8 space-y-4 max-w-prose text-base text-slate-700 leading-relaxed">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0F2544] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.news.backToAllNews}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
