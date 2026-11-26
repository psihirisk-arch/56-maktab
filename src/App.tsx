import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  AboutAndResources,
  AboutSection,
  ResourcesSection,
} from './components/AboutAndResources';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { NewsSection } from './components/NewsSection';
import { StaffSection } from './components/StaffSection';
import { DEFAULT_BELL_SCHEDULE, DEFAULT_SITE_SETTINGS } from './config/defaults';
import { ContactsPage } from './pages/ContactsPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { TeachersPage } from './pages/TeachersPage';
import {
  fetchNews,
  fetchSchedule,
  fetchSettings,
  fetchStaff,
  fetchTeachers,
} from './services/api';
import type {
  AdminUser,
  BellScheduleData,
  Language,
  NewsItem,
  SiteSettings,
  StaffMember,
  Teacher,
} from './types';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function AppShell() {
  const [lang, setLang] = useState<Language>('uz');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState<boolean>(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<BellScheduleData>(DEFAULT_BELL_SCHEDULE);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    document.documentElement.lang = lang;
    const schoolTitle = lang === 'uz' ? settings.school_name_uz : settings.school_name_ru;
    document.title = `${schoolTitle} | ${
      lang === 'uz' ? 'Davlatobod tumani' : 'Давлатобадский район'
    }`;
  }, [lang, settings]);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const data = await fetchNews();
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : 'Failed to load news');
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
      setStaffError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setTeachersLoading(true);
    setTeachersError(null);
    try {
      const data = await fetchTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      setTeachersError(err instanceof Error ? err.message : 'Failed to load teachers');
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  const loadSiteConfig = useCallback(async () => {
    try {
      const [remoteSchedule, remoteSettings] = await Promise.all([
        fetchSchedule(),
        fetchSettings(),
      ]);
      if (remoteSchedule?.shift1 && remoteSchedule?.shift2) {
        setSchedule(remoteSchedule);
      }
      if (remoteSettings?.school_name_uz) {
        setSettings(remoteSettings);
      }
    } catch {
      // Keep default shapes if config endpoint fails momentarily
    }
  }, []);

  useEffect(() => {
    void loadNews();
    void loadStaff();
    void loadTeachers();
    void loadSiteConfig();
  }, [loadNews, loadStaff, loadTeachers, loadSiteConfig]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ScrollToTop />
      <Header lang={lang} onChangeLang={setLang} />

      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <main>
                <HeroSection lang={lang} settings={settings} />
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
                  limit={10}
                  showAllButton
                />
              </main>
            }
          />

          <Route
            path="/about"
            element={
              <main>
                <AboutSection
                  lang={lang}
                  settings={settings}
                  schedule={schedule}
                  isStandalonePage
                />
              </main>
            }
          />

          <Route
            path="/staff"
            element={
              <main>
                <StaffSection
                  lang={lang}
                  staff={staff}
                  loading={staffLoading}
                  error={staffError}
                  onRetry={loadStaff}
                  isStandalonePage
                />
              </main>
            }
          />

          <Route
            path="/teachers"
            element={
              <main>
                <TeachersPage
                  lang={lang}
                  teachers={teachers}
                  loading={teachersLoading}
                  error={teachersError}
                  onRetry={loadTeachers}
                />
              </main>
            }
          />

          <Route
            path="/news"
            element={
              <main>
                <NewsSection
                  lang={lang}
                  news={news}
                  loading={newsLoading}
                  error={newsError}
                  onRetry={loadNews}
                  isStandalonePage
                />
              </main>
            }
          />

          <Route
            path="/news/:id"
            element={
              <main>
                <NewsDetailPage lang={lang} news={news} />
              </main>
            }
          />

          <Route
            path="/resources"
            element={
              <main>
                <ResourcesSection lang={lang} isStandalonePage />
              </main>
            }
          />

          <Route path="/documents" element={<Navigate to="/resources" replace />} />

          <Route
            path="/contacts"
            element={
              <main>
                <ContactsPage lang={lang} settings={settings} />
              </main>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminPanel
                lang={lang}
                token={authToken}
                currentAdmin={currentAdmin}
                onAuthSuccess={(token, admin) => {
                  setAuthToken(token);
                  setCurrentAdmin(admin);
                }}
                onAuthClear={() => {
                  setAuthToken(null);
                  setCurrentAdmin(null);
                }}
                news={news}
                staff={staff}
                teachers={teachers}
                schedule={schedule}
                settings={settings}
                onNewsCreated={(item) =>
                  setNews((prev) =>
                    [item, ...prev].sort((a, b) => {
                      const tA = new Date(a.created_at).getTime() || 0;
                      const tB = new Date(b.created_at).getTime() || 0;
                      return tB !== tA ? tB - tA : Number(b.id) - Number(a.id);
                    })
                  )
                }
                onNewsUpdated={(updated) =>
                  setNews((prev) =>
                    prev
                      .map((item) => (item.id === updated.id ? updated : item))
                      .sort((a, b) => {
                        const tA = new Date(a.created_at).getTime() || 0;
                        const tB = new Date(b.created_at).getTime() || 0;
                        return tB !== tA ? tB - tA : Number(b.id) - Number(a.id);
                      })
                  )
                }
                onNewsDeleted={(id) =>
                  setNews((prev) => prev.filter((item) => item.id !== id))
                }
                onStaffCreated={(member) => setStaff((prev) => [...prev, member])}
                onStaffUpdated={(updated) =>
                  setStaff((prev) =>
                    prev.map((m) => (m.id === updated.id ? updated : m))
                  )
                }
                onStaffDeleted={(id) =>
                  setStaff((prev) => prev.filter((m) => m.id !== id))
                }
                onTeacherCreated={(teacher) => setTeachers((prev) => [...prev, teacher])}
                onTeacherUpdated={(updated) =>
                  setTeachers((prev) =>
                    prev.map((tItem) => (tItem.id === updated.id ? updated : tItem))
                  )
                }
                onTeacherDeleted={(id) =>
                  setTeachers((prev) => prev.filter((tItem) => tItem.id !== id))
                }
                onScheduleSaved={setSchedule}
                onSettingsSaved={setSettings}
              />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Footer lang={lang} settings={settings} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
