import { useCallback, useEffect, useState } from 'react';
import { AboutAndResources } from './components/AboutAndResources';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { NewsModal } from './components/NewsModal';
import { NewsSection } from './components/NewsSection';
import { StaffSection } from './components/StaffSection';
import {
  DEFAULT_BELL_SCHEDULE,
  DEFAULT_SITE_SETTINGS,
  FALLBACK_NEWS,
  FALLBACK_STAFF,
} from './data/fallbackData';
import {
  ApiUnavailableError,
  fetchNews,
  fetchSchedule,
  fetchSettings,
  fetchStaff,
} from './services/api';
import type {
  BellScheduleData,
  Language,
  NewsItem,
  SiteSettings,
  StaffMember,
} from './types';

const PREVIEW_SCHEDULE_KEY = 'school56_preview_schedule';
const PREVIEW_SETTINGS_KEY = 'school56_preview_settings';

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('uz');
  const [isAdminView, setIsAdminView] = useState<boolean>(
    () => window.location.pathname === '/admin'
  );
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<BellScheduleData>(() =>
    readStoredJson(PREVIEW_SCHEDULE_KEY, DEFAULT_BELL_SCHEDULE)
  );
  const [settings, setSettings] = useState<SiteSettings>(() =>
    readStoredJson(PREVIEW_SETTINGS_KEY, DEFAULT_SITE_SETTINGS)
  );

  // Sync HTML lang attribute and document title with selected language & settings
  useEffect(() => {
    document.documentElement.lang = lang;
    const schoolTitle = lang === 'uz' ? settings.school_name_uz : settings.school_name_ru;
    document.title = `${schoolTitle} | ${
      lang === 'uz' ? 'Davlatobod tumani' : 'Давлатобадский район'
    }`;
  }, [lang, settings]);

  // Sync browser back/forward navigation with /admin view
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleAdminView = () => {
    setIsAdminView((prev) => {
      const next = !prev;
      const targetPath = next ? '/admin' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const data = await fetchNews();
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setIsDemoMode(true);
        setNews(FALLBACK_NEWS);
      } else {
        setNewsError(err instanceof Error ? err.message : 'Failed to load news');
      }
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      const data = await fetchStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setIsDemoMode(true);
        setStaff(FALLBACK_STAFF);
      } else {
        setStaffError(err instanceof Error ? err.message : 'Failed to load staff');
      }
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const loadSiteConfig = useCallback(async () => {
    try {
      const remoteSchedule = await fetchSchedule();
      if (remoteSchedule?.shift1 && remoteSchedule?.shift2) {
        setSchedule(remoteSchedule);
      }
    } catch {
      // Keep local/default schedule if /api/schedule is not configured
    }

    try {
      const remoteSettings = await fetchSettings();
      if (remoteSettings?.school_name_uz) {
        setSettings(remoteSettings);
      }
    } catch {
      // Keep local/default settings if /api/settings is not configured
    }
  }, []);

  useEffect(() => {
    void loadNews();
    void loadStaff();
    void loadSiteConfig();
  }, [loadNews, loadStaff, loadSiteConfig]);

  const handleScheduleSaved = (nextSchedule: BellScheduleData) => {
    setSchedule(nextSchedule);
    try {
      localStorage.setItem(PREVIEW_SCHEDULE_KEY, JSON.stringify(nextSchedule));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleSettingsSaved = (nextSettings: SiteSettings) => {
    setSettings(nextSettings);
    try {
      localStorage.setItem(PREVIEW_SETTINGS_KEY, JSON.stringify(nextSettings));
    } catch {
      // Ignore storage quota errors
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        lang={lang}
        onChangeLang={setLang}
        isAdminView={isAdminView}
        onToggleAdmin={toggleAdminView}
      />

      {isAdminView ? (
        <AdminPanel
          lang={lang}
          news={news}
          staff={staff}
          schedule={schedule}
          settings={settings}
          isDemoMode={isDemoMode}
          onEnableDemoMode={() => setIsDemoMode(true)}
          onNewsCreated={(item) => setNews((prev) => [item, ...prev])}
          onNewsUpdated={(updated) =>
            setNews((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
          }
          onNewsDeleted={(id) => setNews((prev) => prev.filter((item) => item.id !== id))}
          onStaffCreated={(member) => setStaff((prev) => [...prev, member])}
          onStaffUpdated={(updated) =>
            setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
          }
          onStaffDeleted={(id) => setStaff((prev) => prev.filter((m) => m.id !== id))}
          onScheduleSaved={handleScheduleSaved}
          onSettingsSaved={handleSettingsSaved}
          onClose={toggleAdminView}
        />
      ) : (
        <main className="flex-1">
          <HeroSection lang={lang} isDemoMode={isDemoMode} settings={settings} />
          <AboutAndResources lang={lang} settings={settings} schedule={schedule} />
          <StaffSection
            lang={lang}
            staff={staff}
            loading={staffLoading}
            error={staffError}
            onRetry={loadStaff}
          />
          <NewsSection
            lang={lang}
            news={news}
            loading={newsLoading}
            error={newsError}
            onRetry={loadNews}
            onSelectArticle={setSelectedArticle}
          />
        </main>
      )}

      <Footer lang={lang} settings={settings} />

      <NewsModal
        article={selectedArticle}
        lang={lang}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
}
