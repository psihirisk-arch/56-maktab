import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { TEACHER_CATEGORIES } from '../config/defaults';
import { translations } from '../i18n';
import type { Language, Teacher } from '../types';

interface TeachersPageProps {
  lang: Language;
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function TeachersPage({
  lang,
  teachers,
  loading,
  error,
  onRetry,
}: TeachersPageProps) {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Clear localized dropdown selections when language changes to keep values aligned
  useEffect(() => {
    setSelectedSubject('');
    setSelectedCategory('');
  }, [lang]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    for (const teacher of teachers) {
      const value = (lang === 'uz' ? teacher.subject_uz : teacher.subject_ru).trim();
      if (value) set.add(value);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [teachers, lang]);

  const categoryOptions = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();

    for (const cat of TEACHER_CATEGORIES) {
      const label = lang === 'uz' ? cat.uz : cat.ru;
      if (!seen.has(label)) {
        seen.add(label);
        ordered.push(label);
      }
    }

    const extra: string[] = [];
    for (const teacher of teachers) {
      const value = (lang === 'uz' ? teacher.category_uz : teacher.category_ru).trim();
      if (value && !seen.has(value)) {
        seen.add(value);
        extra.push(value);
      }
    }
    extra.sort((a, b) => a.localeCompare(b));

    return [...ordered, ...extra];
  }, [teachers, lang]);

  const filteredTeachers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const subject = (lang === 'uz' ? teacher.subject_uz : teacher.subject_ru).trim();
      const category = (lang === 'uz' ? teacher.category_uz : teacher.category_ru).trim();

      if (query && !teacher.full_name.toLowerCase().includes(query)) {
        return false;
      }
      if (selectedSubject && subject !== selectedSubject) {
        return false;
      }
      if (selectedCategory && category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [teachers, lang, searchQuery, selectedSubject, selectedCategory]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedSubject || selectedCategory
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedCategory('');
  };

  return (
    <section id="teachers" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#047857] uppercase">
            {t.teachers.kicker}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#0F2544] tracking-tight text-balance">
            {t.teachers.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">{t.teachers.subtitle}</p>
        </div>

        {/* Search & Filter Toolbar */}
        {!loading && !error && teachers.length > 0 && (
          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Search by Full Name */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.teachers.searchPlaceholder}
                  aria-label={t.teachers.searchPlaceholder}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                />
              </div>

              {/* Filter by Subject */}
              <div className="md:col-span-3">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  aria-label={t.teachers.allSubjects}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544] cursor-pointer"
                >
                  <option value="">{t.teachers.allSubjects}</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Category */}
              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label={t.teachers.allCategories}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544] cursor-pointer"
                >
                  <option value="">{t.teachers.allCategories}</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count / Reset */}
              <div className="md:col-span-1 flex md:justify-end items-center">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0F2544] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.teachers.resetFilters}</span>
                  </button>
                ) : (
                  <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
                    {filteredTeachers.length} / {teachers.length}
                  </span>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <p className="mt-3 text-xs text-slate-500 tabular-nums">
                {t.teachers.countLabel}:{' '}
                <span className="font-semibold text-[#0F2544]">
                  {filteredTeachers.length}
                </span>{' '}
                / {teachers.length}
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
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
            <p className="text-sm text-slate-600">{t.teachers.error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2544] hover:bg-[#173560] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.teachers.retry}</span>
            </button>
          </div>
        )}

        {!loading && !error && teachers.length === 0 && (
          <div className="mt-10 p-10 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-500">
            {t.teachers.empty}
          </div>
        )}

        {!loading && !error && teachers.length > 0 && filteredTeachers.length === 0 && (
          <div className="mt-10 p-10 bg-white border border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-600">{t.teachers.noResults}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0F2544] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.teachers.resetFilters}</span>
            </button>
          </div>
        )}

        {!loading && !error && filteredTeachers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => {
              const subject = lang === 'uz' ? teacher.subject_uz : teacher.subject_ru;
              const category = (lang === 'uz' ? teacher.category_uz : teacher.category_ru).trim();
              const experience = (teacher.experience_years || '').trim();
              const bio = (lang === 'uz' ? teacher.bio_uz : teacher.bio_ru).trim();

              const metaParts: string[] = [];
              if (category) metaParts.push(category);
              if (experience) metaParts.push(`${experience} ${t.teachers.experienceSuffix}`);

              return (
                <article
                  key={teacher.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-square w-full bg-slate-100 border-b border-slate-200 overflow-hidden">
                    <SafeImage
                      src={teacher.photo_url}
                      alt={teacher.full_name}
                      variant="staff"
                      fallbackLabel={teacher.full_name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif text-xl font-semibold text-[#0F2544] leading-snug">
                        {teacher.full_name}
                      </h2>
                      <p className="mt-1.5 text-sm font-medium text-[#047857]">{subject}</p>
                      {bio && (
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{bio}</p>
                      )}
                    </div>

                    {metaParts.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600 tabular-nums">
                        {metaParts.join(' · ')}
                      </div>
                    )}
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
