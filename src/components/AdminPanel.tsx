import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  ImagePlus,
  LogOut,
  Newspaper,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { DEFAULT_BELL_SCHEDULE, DEFAULT_SITE_SETTINGS } from '../data/fallbackData';
import { formatDate, translations } from '../i18n';
import {
  ApiAuthError,
  ApiUnavailableError,
  createNews,
  createStaff,
  deleteNews,
  deleteStaff,
  loginAdmin,
  saveSchedule,
  saveSettings,
  updateNews,
  updateStaff,
} from '../services/api';
import type {
  BellLesson,
  BellScheduleData,
  Language,
  NewsItem,
  SiteSettings,
  StaffMember,
} from '../types';
import { SafeImage } from './SafeImage';

const TOKEN_STORAGE_KEY = 'admin_token';

interface AdminPanelProps {
  lang: Language;
  news: NewsItem[];
  staff: StaffMember[];
  schedule: BellScheduleData;
  settings: SiteSettings;
  isDemoMode: boolean;
  onEnableDemoMode: () => void;
  onNewsCreated: (item: NewsItem) => void;
  onNewsUpdated: (item: NewsItem) => void;
  onNewsDeleted: (id: number | string) => void;
  onStaffCreated: (member: StaffMember) => void;
  onStaffUpdated: (member: StaffMember) => void;
  onStaffDeleted: (id: number | string) => void;
  onScheduleSaved: (schedule: BellScheduleData) => void;
  onSettingsSaved: (settings: SiteSettings) => void;
  onClose: () => void;
}

export function AdminPanel({
  lang,
  news,
  staff,
  schedule,
  settings,
  isDemoMode,
  onEnableDemoMode,
  onNewsCreated,
  onNewsUpdated,
  onNewsDeleted,
  onStaffCreated,
  onStaffUpdated,
  onStaffDeleted,
  onScheduleSaved,
  onSettingsSaved,
  onClose,
}: AdminPanelProps) {
  const t = translations[lang];

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [activeTab, setActiveTab] = useState<'news' | 'staff' | 'schedule' | 'settings'>('news');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // News Form State (Create + Edit)
  const [editingNewsId, setEditingNewsId] = useState<number | string | null>(null);
  const [titleUz, setTitleUz] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [contentUz, setContentUz] = useState('');
  const [contentRu, setContentRu] = useState('');
  const [newsImage, setNewsImage] = useState<File | null>(null);
  const newsFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsFeedback, setNewsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteNewsId, setConfirmDeleteNewsId] = useState<number | string | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<number | string | null>(null);

  // Staff Form State (Create + Edit)
  const [editingStaffId, setEditingStaffId] = useState<number | string | null>(null);
  const [fullName, setFullName] = useState('');
  const [positionUz, setPositionUz] = useState('');
  const [positionRu, setPositionRu] = useState('');
  const [receptionHours, setReceptionHours] = useState('');
  const [staffPhoto, setStaffPhoto] = useState<File | null>(null);
  const staffFileInputRef = useRef<HTMLInputElement | null>(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<number | string | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<number | string | null>(null);

  // Bell Schedule Draft State
  const [scheduleDraft, setScheduleDraft] = useState<BellScheduleData>(schedule);
  const [scheduleShift, setScheduleShift] = useState<'shift1' | 'shift2'>('shift1');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Site Settings Draft State
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setScheduleDraft(schedule);
  }, [schedule]);

  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const data = await loginAdmin(username.trim(), password);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        const demoToken = 'demo_preview_token';
        localStorage.setItem(TOKEN_STORAGE_KEY, demoToken);
        setToken(demoToken);
        setPassword('');
      } else if (err instanceof ApiAuthError) {
        setLoginError(t.admin.loginError);
      } else {
        setLoginError(t.admin.networkError);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setLoginError(null);
  };

  // News handlers
  const resetNewsForm = () => {
    setEditingNewsId(null);
    setTitleUz('');
    setTitleRu('');
    setContentUz('');
    setContentRu('');
    setNewsImage(null);
    if (newsFileInputRef.current) newsFileInputRef.current.value = '';
  };

  const startEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setTitleUz(item.title_uz);
    setTitleRu(item.title_ru);
    setContentUz(item.content_uz);
    setContentRu(item.content_ru);
    setNewsImage(null);
    setNewsFeedback(null);
    if (newsFileInputRef.current) newsFileInputRef.current.value = '';
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!titleUz.trim() || !titleRu.trim() || !contentUz.trim() || !contentRu.trim()) {
      setNewsFeedback({ type: 'error', text: t.admin.newsForm.requiredError });
      return;
    }

    setNewsSubmitting(true);
    setNewsFeedback(null);

    const formData = new FormData();
    formData.append('title_uz', titleUz.trim());
    formData.append('title_ru', titleRu.trim());
    formData.append('content_uz', contentUz.trim());
    formData.append('content_ru', contentRu.trim());
    if (newsImage) {
      formData.append('image', newsImage);
    }

    try {
      if (editingNewsId !== null) {
        const updated = await updateNews(editingNewsId, formData, token);
        onNewsUpdated(updated);
        resetNewsForm();
        setNewsFeedback({ type: 'success', text: t.admin.newsForm.successEdit });
      } else {
        const created = await createNews(formData, token);
        onNewsCreated(created);
        resetNewsForm();
        setNewsFeedback({ type: 'success', text: t.admin.newsForm.successAdd });
      }
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        if (editingNewsId !== null) {
          const existing = news.find((n) => n.id === editingNewsId);
          const fallbackUpdated: NewsItem = {
            id: editingNewsId,
            title_uz: titleUz.trim(),
            title_ru: titleRu.trim(),
            content_uz: contentUz.trim(),
            content_ru: contentRu.trim(),
            image_url: newsImage
              ? URL.createObjectURL(newsImage)
              : existing?.image_url ?? null,
            created_at: existing?.created_at ?? new Date().toISOString(),
          };
          onNewsUpdated(fallbackUpdated);
          resetNewsForm();
          setNewsFeedback({ type: 'success', text: t.admin.newsForm.successEdit });
        } else {
          const fallbackCreated: NewsItem = {
            id: Date.now(),
            title_uz: titleUz.trim(),
            title_ru: titleRu.trim(),
            content_uz: contentUz.trim(),
            content_ru: contentRu.trim(),
            image_url: newsImage ? URL.createObjectURL(newsImage) : null,
            created_at: new Date().toISOString(),
          };
          onNewsCreated(fallbackCreated);
          resetNewsForm();
          setNewsFeedback({ type: 'success', text: t.admin.newsForm.successAdd });
        }
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setNewsFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setNewsSubmitting(false);
    }
  };

  const handleDeleteNews = async (id: number | string) => {
    if (!token) return;
    setDeletingNewsId(id);

    try {
      await deleteNews(id, token);
      onNewsDeleted(id);
      if (editingNewsId === id) resetNewsForm();
      setConfirmDeleteNewsId(null);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        onNewsDeleted(id);
        if (editingNewsId === id) resetNewsForm();
        setConfirmDeleteNewsId(null);
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setNewsFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setDeletingNewsId(null);
    }
  };

  // Staff handlers
  const resetStaffForm = () => {
    setEditingStaffId(null);
    setFullName('');
    setPositionUz('');
    setPositionRu('');
    setReceptionHours('');
    setStaffPhoto(null);
    if (staffFileInputRef.current) staffFileInputRef.current.value = '';
  };

  const startEditStaff = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setFullName(member.full_name);
    setPositionUz(member.position_uz);
    setPositionRu(member.position_ru);
    setReceptionHours(member.reception_hours);
    setStaffPhoto(null);
    setStaffFeedback(null);
    if (staffFileInputRef.current) staffFileInputRef.current.value = '';
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!fullName.trim() || !positionUz.trim() || !positionRu.trim() || !receptionHours.trim()) {
      setStaffFeedback({ type: 'error', text: t.admin.staffForm.requiredError });
      return;
    }

    setStaffSubmitting(true);
    setStaffFeedback(null);

    const formData = new FormData();
    formData.append('full_name', fullName.trim());
    formData.append('position_uz', positionUz.trim());
    formData.append('position_ru', positionRu.trim());
    formData.append('reception_hours', receptionHours.trim());
    if (staffPhoto) {
      formData.append('photo', staffPhoto);
    }

    try {
      if (editingStaffId !== null) {
        const updated = await updateStaff(editingStaffId, formData, token);
        onStaffUpdated(updated);
        resetStaffForm();
        setStaffFeedback({ type: 'success', text: t.admin.staffForm.successEdit });
      } else {
        const created = await createStaff(formData, token);
        onStaffCreated(created);
        resetStaffForm();
        setStaffFeedback({ type: 'success', text: t.admin.staffForm.successAdd });
      }
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        if (editingStaffId !== null) {
          const existing = staff.find((m) => m.id === editingStaffId);
          const fallbackUpdated: StaffMember = {
            id: editingStaffId,
            full_name: fullName.trim(),
            position_uz: positionUz.trim(),
            position_ru: positionRu.trim(),
            reception_hours: receptionHours.trim(),
            photo_url: staffPhoto
              ? URL.createObjectURL(staffPhoto)
              : existing?.photo_url ?? null,
          };
          onStaffUpdated(fallbackUpdated);
          resetStaffForm();
          setStaffFeedback({ type: 'success', text: t.admin.staffForm.successEdit });
        } else {
          const fallbackCreated: StaffMember = {
            id: Date.now(),
            full_name: fullName.trim(),
            position_uz: positionUz.trim(),
            position_ru: positionRu.trim(),
            reception_hours: receptionHours.trim(),
            photo_url: staffPhoto ? URL.createObjectURL(staffPhoto) : null,
          };
          onStaffCreated(fallbackCreated);
          resetStaffForm();
          setStaffFeedback({ type: 'success', text: t.admin.staffForm.successAdd });
        }
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setStaffFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: number | string) => {
    if (!token) return;
    setDeletingStaffId(id);

    try {
      await deleteStaff(id, token);
      onStaffDeleted(id);
      if (editingStaffId === id) resetStaffForm();
      setConfirmDeleteStaffId(null);
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        onStaffDeleted(id);
        if (editingStaffId === id) resetStaffForm();
        setConfirmDeleteStaffId(null);
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setStaffFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setDeletingStaffId(null);
    }
  };

  // Schedule handlers
  const handleUpdateLesson = (
    shift: 'shift1' | 'shift2',
    index: number,
    field: keyof BellLesson,
    value: string
  ) => {
    setScheduleDraft((prev) => {
      const updatedList = prev[shift].map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, [shift]: updatedList };
    });
    setScheduleFeedback(null);
  };

  const handleAddLesson = (shift: 'shift1' | 'shift2') => {
    setScheduleDraft((prev) => {
      const nextNum = prev[shift].length + 1;
      return {
        ...prev,
        [shift]: [...prev[shift], { lesson: nextNum, time: '00:00 – 00:45', breakMin: '5' }],
      };
    });
    setScheduleFeedback(null);
  };

  const handleRemoveLesson = (shift: 'shift1' | 'shift2', index: number) => {
    setScheduleDraft((prev) => {
      const filtered = prev[shift]
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, lesson: idx + 1 }));
      return { ...prev, [shift]: filtered };
    });
    setScheduleFeedback(null);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setScheduleSaving(true);
    setScheduleFeedback(null);

    try {
      const saved = await saveSchedule(scheduleDraft, token);
      onScheduleSaved(saved);
      setScheduleFeedback({ type: 'success', text: t.admin.scheduleEditor.savedSuccess });
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        onScheduleSaved(scheduleDraft);
        setScheduleFeedback({ type: 'success', text: t.admin.scheduleEditor.savedSuccess });
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setScheduleFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setScheduleSaving(false);
    }
  };

  // Settings handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSettingsSaving(true);
    setSettingsFeedback(null);

    try {
      const saved = await saveSettings(settingsDraft, token);
      onSettingsSaved(saved);
      setSettingsFeedback({ type: 'success', text: t.admin.settingsEditor.savedSuccess });
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        onEnableDemoMode();
        onSettingsSaved(settingsDraft);
        setSettingsFeedback({ type: 'success', text: t.admin.settingsEditor.savedSuccess });
      } else if (err instanceof ApiAuthError) {
        handleLogout();
        setLoginError(t.admin.loginError);
      } else {
        setSettingsFeedback({ type: 'error', text: t.admin.actionError });
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2544]">
              {t.admin.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t.admin.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.admin.logoutButton}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#0F2544] bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.backToSite}
            </button>
          </div>
        </div>

        {/* Unauthenticated Login Form */}
        {!token ? (
          <div className="mt-10 max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#0F2544]">
              {t.admin.loginTitle}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{t.admin.loginDesc}</p>

            {isDemoMode && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                {t.admin.demoLoginHint}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  {t.admin.usernameLabel}
                </label>
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.admin.usernamePlaceholder}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  {t.admin.passwordLabel}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.admin.passwordPlaceholder}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                />
              </div>

              {loginError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {loginLoading ? t.admin.loggingIn : t.admin.loginButton}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="mt-8">
            {isDemoMode && (
              <div className="mb-6 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {t.demoNotice}
              </div>
            )}

            {/* Dashboard Tabs */}
            <div
              role="tablist"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg mb-8 w-fit"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'news'}
                onClick={() => setActiveTab('news')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'news'
                    ? 'bg-white text-[#0F2544] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Newspaper className="w-4 h-4 shrink-0" />
                <span>{t.admin.tabs.news}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'staff'}
                onClick={() => setActiveTab('staff')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-white text-[#0F2544] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>{t.admin.tabs.staff}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'schedule'}
                onClick={() => setActiveTab('schedule')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'bg-white text-[#0F2544] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{t.admin.tabs.schedule}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#0F2544] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>{t.admin.tabs.settings}</span>
              </button>
            </div>

            {/* Tab 1: Manage News (Add, Edit, Delete) */}
            {activeTab === 'news' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form
                  onSubmit={handleSaveNews}
                  className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-lg font-semibold text-[#0F2544]">
                      {editingNewsId !== null
                        ? t.admin.newsForm.headingEdit
                        : t.admin.newsForm.headingAdd}
                    </h2>
                    {editingNewsId !== null && (
                      <button
                        type="button"
                        onClick={resetNewsForm}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        {t.admin.newsForm.cancelEdit}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.newsForm.titleUz}
                    </label>
                    <input
                      type="text"
                      required
                      value={titleUz}
                      onChange={(e) => setTitleUz(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.newsForm.titleRu}
                    </label>
                    <input
                      type="text"
                      required
                      value={titleRu}
                      onChange={(e) => setTitleRu(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.newsForm.contentUz}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contentUz}
                      onChange={(e) => setContentUz(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.newsForm.contentRu}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contentRu}
                      onChange={(e) => setContentRu(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.admin.newsForm.image}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                        <ImagePlus className="w-4 h-4 text-slate-500" />
                        <span>{t.admin.newsForm.chooseFile}</span>
                        <input
                          ref={newsFileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setNewsImage(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {newsImage && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-slate-600 truncate max-w-[140px]">
                            {newsImage.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewsImage(null);
                              if (newsFileInputRef.current) newsFileInputRef.current.value = '';
                            }}
                            aria-label={t.admin.newsForm.clearFile}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingNewsId !== null && !newsImage && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {t.admin.newsForm.imageKeepHint}
                      </p>
                    )}
                  </div>

                  {newsFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-medium px-3 py-2 rounded-lg border ${
                        newsFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {newsFeedback.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={newsSubmitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {newsSubmitting
                      ? t.admin.newsForm.submitting
                      : editingNewsId !== null
                        ? t.admin.newsForm.submitEdit
                        : t.admin.newsForm.submitAdd}
                  </button>
                </form>

                {/* Existing News List */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-[#0F2544] pb-4 border-b border-slate-200">
                    {t.admin.newsList.heading} ({news.length})
                  </h2>

                  {news.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">
                      {t.admin.newsList.empty}
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {news.map((item) => {
                        const title = lang === 'uz' ? item.title_uz : item.title_ru;
                        const isConfirming = confirmDeleteNewsId === item.id;
                        const isEditing = editingNewsId === item.id;
                        return (
                          <li
                            key={item.id}
                            className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isEditing ? 'bg-slate-50 -mx-3 px-3 rounded-lg' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="w-16 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                <SafeImage
                                  src={item.image_url}
                                  alt={title}
                                  variant="news"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#0F2544] line-clamp-2">
                                  {title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 tabular-nums">
                                  {formatDate(item.created_at, lang)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditNews(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0F2544] hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>{t.admin.newsList.edit}</span>
                              </button>

                              {isConfirming ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={deletingNewsId === item.id}
                                    onClick={() => handleDeleteNews(item.id)}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer whitespace-nowrap"
                                  >
                                    {t.admin.newsList.confirmDelete}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteNewsId(null)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer whitespace-nowrap"
                                  >
                                    {t.admin.newsList.cancelDelete}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNewsId(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.admin.newsList.delete}</span>
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Manage Staff (Add, Edit, Delete) */}
            {activeTab === 'staff' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form
                  onSubmit={handleSaveStaff}
                  className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-lg font-semibold text-[#0F2544]">
                      {editingStaffId !== null
                        ? t.admin.staffForm.headingEdit
                        : t.admin.staffForm.headingAdd}
                    </h2>
                    {editingStaffId !== null && (
                      <button
                        type="button"
                        onClick={resetStaffForm}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        {t.admin.staffForm.cancelEdit}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.staffForm.fullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.staffForm.positionUz}
                    </label>
                    <input
                      type="text"
                      required
                      value={positionUz}
                      onChange={(e) => setPositionUz(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.staffForm.positionRu}
                    </label>
                    <input
                      type="text"
                      required
                      value={positionRu}
                      onChange={(e) => setPositionRu(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.admin.staffForm.receptionHours}
                    </label>
                    <input
                      type="text"
                      required
                      value={receptionHours}
                      onChange={(e) => setReceptionHours(e.target.value)}
                      placeholder={t.admin.staffForm.receptionPlaceholder}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t.admin.staffForm.photo}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                        <ImagePlus className="w-4 h-4 text-slate-500" />
                        <span>{t.admin.staffForm.chooseFile}</span>
                        <input
                          ref={staffFileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setStaffPhoto(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {staffPhoto && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-slate-600 truncate max-w-[140px]">
                            {staffPhoto.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStaffPhoto(null);
                              if (staffFileInputRef.current) staffFileInputRef.current.value = '';
                            }}
                            aria-label={t.admin.staffForm.clearFile}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingStaffId !== null && !staffPhoto && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {t.admin.staffForm.photoKeepHint}
                      </p>
                    )}
                  </div>

                  {staffFeedback && (
                    <p
                      role="status"
                      className={`text-xs font-medium px-3 py-2 rounded-lg border ${
                        staffFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {staffFeedback.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={staffSubmitting}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {staffSubmitting
                      ? t.admin.staffForm.submitting
                      : editingStaffId !== null
                        ? t.admin.staffForm.submitEdit
                        : t.admin.staffForm.submitAdd}
                  </button>
                </form>

                {/* Existing Staff List */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="font-serif text-lg font-semibold text-[#0F2544] pb-4 border-b border-slate-200">
                    {t.admin.staffList.heading} ({staff.length})
                  </h2>

                  {staff.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">
                      {t.admin.staffList.empty}
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {staff.map((member) => {
                        const position = lang === 'uz' ? member.position_uz : member.position_ru;
                        const isConfirming = confirmDeleteStaffId === member.id;
                        const isEditing = editingStaffId === member.id;
                        return (
                          <li
                            key={member.id}
                            className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isEditing ? 'bg-slate-50 -mx-3 px-3 rounded-lg' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                <SafeImage
                                  src={member.photo_url}
                                  alt={member.full_name}
                                  variant="staff"
                                  fallbackLabel={member.full_name}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#0F2544]">
                                  {member.full_name}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-[#047857]">
                                  {position}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                                  {member.reception_hours}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditStaff(member)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0F2544] hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>{t.admin.staffList.edit}</span>
                              </button>

                              {isConfirming ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={deletingStaffId === member.id}
                                    onClick={() => handleDeleteStaff(member.id)}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer whitespace-nowrap"
                                  >
                                    {t.admin.staffList.confirmDelete}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteStaffId(null)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer whitespace-nowrap"
                                  >
                                    {t.admin.staffList.cancelDelete}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteStaffId(member.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.admin.staffList.delete}</span>
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Bell Schedule Editor */}
            {activeTab === 'schedule' && (
              <form
                onSubmit={handleSaveSchedule}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-[#0F2544]">
                      {t.admin.scheduleEditor.heading}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.admin.scheduleEditor.subtitle}
                    </p>
                  </div>

                  <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setScheduleShift('shift1')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        scheduleShift === 'shift1'
                          ? 'bg-white text-[#0F2544] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.about.shift1}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleShift('shift2')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        scheduleShift === 'shift2'
                          ? 'bg-white text-[#0F2544] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.about.shift2}
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-2 text-xs font-semibold text-slate-500">
                    <div className="sm:col-span-2">{t.admin.scheduleEditor.lessonNumber}</div>
                    <div className="sm:col-span-5">{t.admin.scheduleEditor.timeRange}</div>
                    <div className="sm:col-span-3">{t.admin.scheduleEditor.breakDuration}</div>
                    <div className="sm:col-span-2 text-right" />
                  </div>

                  {scheduleDraft[scheduleShift].map((row, idx) => (
                    <div
                      key={`${scheduleShift}-${idx}`}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center p-3 sm:p-2 bg-slate-50 sm:bg-transparent border sm:border-0 border-slate-200 rounded-lg"
                    >
                      <div className="sm:col-span-2 font-mono text-sm font-semibold text-[#0F2544] tabular-nums">
                        {row.lesson}
                        {t.about.lessonUnit}
                      </div>

                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={row.time}
                          onChange={(e) =>
                            handleUpdateLesson(scheduleShift, idx, 'time', e.target.value)
                          }
                          aria-label={t.admin.scheduleEditor.timeRange}
                          className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          required
                          value={row.breakMin}
                          onChange={(e) =>
                            handleUpdateLesson(scheduleShift, idx, 'breakMin', e.target.value)
                          }
                          aria-label={t.admin.scheduleEditor.breakDuration}
                          className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2544]/20 focus:border-[#0F2544]"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLesson(scheduleShift, idx)}
                          disabled={scheduleDraft[scheduleShift].length <= 1}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 border border-slate-200 rounded-md cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.admin.scheduleEditor.removeLesson}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleAddLesson(scheduleShift)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F2544] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.admin.scheduleEditor.addLesson}</span>
                  </button>
                </div>

                {scheduleFeedback && (
                  <p
                    role="status"
                    className={`mt-5 text-xs font-medium px-3 py-2 rounded-lg border ${
                      scheduleFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {scheduleFeedback.text}
                  </p>
                )}

                <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleDraft(DEFAULT_BELL_SCHEDULE);
                      setScheduleFeedback(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.admin.scheduleEditor.reset}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={scheduleSaving}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {scheduleSaving ? t.admin.scheduleEditor.saving : t.admin.scheduleEditor.save}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 4: Site Settings Editor */}
            {activeTab === 'settings' && (
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8"
              >
                <div className="pb-5 border-b border-slate-200">
                  <h2 className="font-serif text-xl font-semibold text-[#0F2544]">
                    {t.admin.settingsEditor.heading}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {t.admin.settingsEditor.subtitle}
                  </p>
                </div>

                {/* General & Hero */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#047857]">
                    {t.admin.settingsEditor.sectionGeneral}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.schoolNameUz}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.school_name_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            school_name_uz: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.schoolNameRu}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.school_name_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            school_name_ru: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.regionUz}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.region_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, region_uz: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.regionRu}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.region_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, region_ru: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.heroHeadlineUz}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.hero_headline_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            hero_headline_uz: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.heroHeadlineRu}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.hero_headline_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            hero_headline_ru: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.heroSubtitleUz}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={settingsDraft.hero_subtitle_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            hero_subtitle_uz: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.heroSubtitleRu}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={settingsDraft.hero_subtitle_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            hero_subtitle_ru: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-semibold text-[#047857]">
                    {t.admin.settingsEditor.sectionStats}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.studentsCount}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.students_count}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            students_count: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.teachersCount}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.teachers_count}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            teachers_count: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.classesCount}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.classes_count}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            classes_count: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.foundedYear}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.founded_year}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, founded_year: e.target.value }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-semibold text-[#047857]">
                    {t.admin.settingsEditor.sectionAbout}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.aboutUz}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={settingsDraft.about_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, about_uz: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.aboutRu}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={settingsDraft.about_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, about_ru: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-semibold text-[#047857]">
                    {t.admin.settingsEditor.sectionContacts}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.addressUz}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.address_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, address_uz: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.addressRu}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.address_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, address_ru: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.phone}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.phone}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.email}
                      </label>
                      <input
                        type="email"
                        required
                        value={settingsDraft.email}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.workingHoursUz}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.working_hours_uz}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            working_hours_uz: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t.admin.settingsEditor.workingHoursRu}
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsDraft.working_hours_ru}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            working_hours_ru: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {settingsFeedback && (
                  <p
                    role="status"
                    className={`text-xs font-medium px-3 py-2 rounded-lg border ${
                      settingsFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {settingsFeedback.text}
                  </p>
                )}

                <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDraft(DEFAULT_SITE_SETTINGS);
                      setSettingsFeedback(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.admin.settingsEditor.reset}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2544] hover:bg-[#173560] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {settingsSaving ? t.admin.settingsEditor.saving : t.admin.settingsEditor.save}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
