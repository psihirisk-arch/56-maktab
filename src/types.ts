export type Language = 'uz' | 'ru';

export interface NewsItem {
  id: number | string;
  title_uz: string;
  title_ru: string;
  content_uz: string;
  content_ru: string;
  image_url: string | null;
  created_at: string;
}

export interface StaffMember {
  id: number | string;
  full_name: string;
  position_uz: string;
  position_ru: string;
  reception_hours: string;
  photo_url: string | null;
}

export interface LoginResponse {
  token: string;
}

export interface BellLesson {
  lesson: number;
  time: string;
  breakMin: string;
}

export interface BellScheduleData {
  shift1: BellLesson[];
  shift2: BellLesson[];
}

export interface SiteSettings {
  school_name_uz: string;
  school_name_ru: string;
  region_uz: string;
  region_ru: string;
  hero_headline_uz: string;
  hero_headline_ru: string;
  hero_subtitle_uz: string;
  hero_subtitle_ru: string;
  students_count: string;
  teachers_count: string;
  classes_count: string;
  founded_year: string;
  about_uz: string;
  about_ru: string;
  address_uz: string;
  address_ru: string;
  phone: string;
  email: string;
  working_hours_uz: string;
  working_hours_ru: string;
}
