import type { BellScheduleData, SiteSettings } from '../types';

export const HERO_CAMPUS_IMAGE = '/src/assets/images/school_campus_hero_1795552660848.jpg';

export const MAX_IMAGE_BYTES = 1048576; // 1 MB

export interface TeacherCategoryOption {
  uz: string;
  ru: string;
}

export const TEACHER_CATEGORIES: TeacherCategoryOption[] = [
  { uz: 'Oliy toifa', ru: 'Высшая категория' },
  { uz: '1-toifa', ru: 'Первая категория' },
  { uz: '2-toifa', ru: 'Вторая категория' },
  { uz: 'Mutaxassis', ru: 'Специалист' },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  school_name_uz: "56-sonli umumiy o'rta ta'lim maktabi",
  school_name_ru: "Общеобразовательная школа № 56",
  region_uz: "Namangan viloyati · Davlatobod tumani Maktabgacha va maktab ta'limi bo'limi",
  region_ru: "Наманганская область · Отдел дошкольного и школьного образования Давлатобадского района",
  hero_headline_uz: "Bilim, tarbiya va zamonaviy kelajak poydevori",
  hero_headline_ru: "Фундамент знаний, воспитания и современного будущего",
  hero_subtitle_uz:
    "Namangan viloyati Davlatobod tumanidagi 56-sonli umumiy o'rta ta'lim maktabi o'quvchilarga davlat ta'lim standartlari asosida chuqurlashtirilgan fanlar, xorijiy tillar va raqamli ko'nikmalarni o'rgatadi.",
  hero_subtitle_ru:
    "Общеобразовательная школа № 56 Давлатобадского района Наманганской области обеспечивает качественное среднее образование по государственным стандартам с углублённым изучением точных наук, иностранных языков и цифровых дисциплин.",
  students_count: "1 420+",
  teachers_count: "86",
  classes_count: "12",
  founded_year: "1984",
  about_uz:
    "Maktabimizda ta'lim jarayoni o'zbek va rus tillarida, ikki smenada olib boriladi. Fizika-matematika, kimyo-biologiya hamda ingliz tili yo'nalishlarida chuqurlashtirilgan guruhlar, zamonaviy axborot-resurs markazi va sport majmuasi faoliyat yuritadi.",
  about_ru:
    "Обучение в школе ведётся на узбекском и русском языках в две смены. Функционируют профильные классы физико-математического, химико-биологического и языкового направлений, обновлённый информационно-ресурсный центр и спортивный комплекс.",
  address_uz: "Namangan viloyati, Davlatobod tumani, Porloq MFY, Gulshan ko'chasi, 56-uy",
  address_ru: "Наманганская область, Давлатобадский район, МСГ Порлок, ул. Гульшан, 56",
  phone: "+998 69 224-56-18",
  email: "info@davlatobod56.uz",
  working_hours_uz: "Dushanba – Shanba, 08:00 – 18:00",
  working_hours_ru: "Понедельник – Суббота, 08:00 – 18:00",
};

export const DEFAULT_BELL_SCHEDULE: BellScheduleData = {
  shift1: [
    { lesson: 1, time: '08:00 – 08:45', breakMin: '5' },
    { lesson: 2, time: '08:50 – 09:35', breakMin: '15' },
    { lesson: 3, time: '09:50 – 10:35', breakMin: '10' },
    { lesson: 4, time: '10:45 – 11:30', breakMin: '5' },
    { lesson: 5, time: '11:35 – 12:20', breakMin: '5' },
    { lesson: 6, time: '12:25 – 13:10', breakMin: '—' },
  ],
  shift2: [
    { lesson: 1, time: '13:30 – 14:15', breakMin: '5' },
    { lesson: 2, time: '14:20 – 15:05', breakMin: '15' },
    { lesson: 3, time: '15:20 – 16:05', breakMin: '10' },
    { lesson: 4, time: '16:15 – 17:00', breakMin: '5' },
    { lesson: 5, time: '17:05 – 17:50', breakMin: '5' },
    { lesson: 6, time: '17:55 – 18:40', breakMin: '—' },
  ],
};
