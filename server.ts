import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MAX_IMAGE_BYTES = 1048576; // 1 MB strict limit
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const ROOT_DIR = process.cwd();
const DATA_DIR = path.resolve(ROOT_DIR, 'data');
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'uploads');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff.json');
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

interface AdminRecord {
  id: string;
  username: string;
  full_name: string;
  password_hash: string;
  is_root: boolean;
  created_at: string;
}

interface PublicAdmin {
  id: string;
  username: string;
  full_name: string;
  is_root: boolean;
  created_at: string;
}

interface NewsRecord {
  id: number;
  title_uz: string;
  title_ru: string;
  summary_uz: string;
  summary_ru: string;
  content_uz: string;
  content_ru: string;
  image_url: string | null;
  created_at: string;
}

interface StaffRecord {
  id: number;
  full_name: string;
  position_uz: string;
  position_ru: string;
  reception_hours: string;
  photo_url: string | null;
}

interface TeacherRecord {
  id: number;
  full_name: string;
  subject_uz: string;
  subject_ru: string;
  category_uz: string;
  category_ru: string;
  experience_years: string;
  bio_uz: string;
  bio_ru: string;
  photo_url: string | null;
}

interface BellLesson {
  lesson: number;
  time: string;
  breakMin: string;
}

interface BellScheduleData {
  shift1: BellLesson[];
  shift2: BellLesson[];
}

interface SiteSettings {
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

interface AuthenticatedRequest extends Request {
  admin?: PublicAdmin;
}

// --- Password & Token Utilities ---

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function signToken(admin: PublicAdmin): string {
  const payload = {
    id: admin.id,
    username: admin.username,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyTokenSignature(token: string): { id: string; username: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      id: string;
      username: string;
      exp: number;
    };
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// --- JSON Storage Helpers ---

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function toPublicAdmin(record: AdminRecord): PublicAdmin {
  return {
    id: record.id,
    username: record.username,
    full_name: record.full_name,
    is_root: record.is_root,
    created_at: record.created_at,
  };
}

function safeRemoveUpload(fileUrl: string | null): void {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const baseName = path.basename(fileUrl);
  const resolved = path.resolve(UPLOADS_DIR, baseName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return;
  if (fs.existsSync(resolved)) {
    try {
      fs.unlinkSync(resolved);
    } catch {
      // Ignore cleanup failure
    }
  }
}

// --- Initial Data Seeding ---

const SEED_SETTINGS: SiteSettings = {
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

const SEED_SCHEDULE: BellScheduleData = {
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

const SEED_STAFF: StaffRecord[] = [
  {
    id: 1,
    full_name: "Mirzayeva Dilnoza Tursunovna",
    position_uz: "Maktab direktori",
    position_ru: "Директор школы",
    reception_hours: "Seshanba, Payshanba · 14:00 – 17:00",
    photo_url: '/src/assets/images/staff_director_portrait_1795552662904.jpg',
  },
  {
    id: 2,
    full_name: "Qodirov Alisher Baxtiyorovich",
    position_uz: "O'quv ishlari bo'yicha direktor o'rinbosari",
    position_ru: "Заместитель директора по учебной работе",
    reception_hours: "Dushanba, Chorshanba · 10:00 – 13:00",
    photo_url: '/src/assets/images/staff_deputy_portrait_1795552662045.jpg',
  },
  {
    id: 3,
    full_name: "Sultonova Zarina Shavkatovna",
    position_uz: "Ma'naviy-ma'rifiy ishlar bo'yicha direktor o'rinbosari",
    position_ru: "Заместитель директора по духовно-просветительской работе",
    reception_hours: "Juma, Shanba · 09:30 – 12:30",
    photo_url: null,
  },
];

const SEED_TEACHERS: TeacherRecord[] = [
  {
    id: 1,
    full_name: "Abdurahmonov Jamshidbek Otabekovich",
    subject_uz: "Matematika o'qituvchisi",
    subject_ru: "Учитель математики",
    category_uz: "Oliy toifa",
    category_ru: "Высшая категория",
    experience_years: "16",
    bio_uz: "Respublika fan olimpiadasi g'oliblarining ustozi, «Xalq ta'limi a'lochisi» ko'krak nishoni sohibi.",
    bio_ru: "Наставник призёров республиканской олимпиады по математике, обладатель нагрудного знака «Отличник народного образования».",
    photo_url: '/src/assets/images/staff_deputy_portrait_1795552662045.jpg',
  },
  {
    id: 2,
    full_name: "Tursunova Muhayyo Alimovna",
    subject_uz: "Ona tili va adabiyoti o'qituvchisi",
    subject_ru: "Учитель узбекского языка и литературы",
    category_uz: "Oliy toifa",
    category_ru: "Высшая категория",
    experience_years: "19",
    bio_uz: "«Yilning eng yaxshi fan o'qituvchisi» viloyat bosqichi sovrindori, kitobxonlik klubi rahbari.",
    bio_ru: "Призёр областного этапа конкурса «Лучший учитель года», руководитель школьного литературного клуба.",
    photo_url: '/src/assets/images/staff_director_portrait_1795552662904.jpg',
  },
  {
    id: 3,
    full_name: "Ismoilov Boburjon Farhodovich",
    subject_uz: "Informatika o'qituvchisi",
    subject_ru: "Учитель информатики",
    category_uz: "1-toifa",
    category_ru: "Первая категория",
    experience_years: "9",
    bio_uz: "Python dasturlash va robototexnika to'garagi rahbari, One Million Uzbek Coders loyihasi mentori.",
    bio_ru: "Руководитель кружка по программированию на Python и робототехнике, ментор IT-проектов учащихся.",
    photo_url: null,
  },
  {
    id: 4,
    full_name: "Karimova Nargiza Ulug'bekovna",
    subject_uz: "Ingliz tili o'qituvchisi",
    subject_ru: "Учитель английского языка",
    category_uz: "Oliy toifa",
    category_ru: "Высшая категория",
    experience_years: "12",
    bio_uz: "C1 (CEFR) xalqaro sertifikatiga ega, yuqori sinf o'quvchilarini IELTS imtihonlariga tayyorlaydi.",
    bio_ru: "Обладатель международного сертификата C1 (CEFR), готовит старшеклассников к экзаменам IELTS и олимпиадам.",
    photo_url: null,
  },
  {
    id: 5,
    full_name: "Yusupova Gulnora Bahodirovna",
    subject_uz: "Kimyo o'qituvchisi",
    subject_ru: "Учитель химии",
    category_uz: "1-toifa",
    category_ru: "Первая категория",
    experience_years: "14",
    bio_uz: "Viloyat kimyo olimpiadasi g'oliblari tayyorlovchisi, laboratoriya amaliyotlari muallifi.",
    bio_ru: "Подготовила призёров областного этапа олимпиады по химии, автор методических пособий по лабораторным работам.",
    photo_url: null,
  },
  {
    id: 6,
    full_name: "Mamatqulova Dilfuza Erkinovna",
    subject_uz: "Boshlang'ich ta'lim o'qituvchisi",
    subject_ru: "Учитель начальных классов",
    category_uz: "2-toifa",
    category_ru: "Вторая категория",
    experience_years: "7",
    bio_uz: "1–4-sinflarda zamonaviy interaktiv o'qitish metodikalarini amaliyotga tatbiq etuvchi pedagog.",
    bio_ru: "Педагог начальной школы, применяющий современные интерактивные методики развития чтения и логики.",
    photo_url: null,
  },
];

const SEED_NEWS: NewsRecord[] = [
  {
    id: 12,
    title_uz: "Namangan viloyati fan olimpiadasida 4 nafar o'quvchimiz g'olib bo'ldi",
    title_ru: "4 ученика нашей школы стали призёрами областного этапа предметной олимпиады",
    summary_uz: "Davlatobod tumani 56-sonli maktabning 10–11-sinf o'quvchilari kimyo, fizika va matematika fanlaridan sovrinli o'rinlarni qo'lga kiritdi.",
    summary_ru: "Учащиеся 10–11 классов школы № 56 Давлатобадского района заняли призовые места по химии, физике и математике.",
    content_uz:
      "Namangan viloyati umumta'lim maktablari o'rtasida o'tkazilgan fan olimpiadasining viloyat bosqichida Davlatobod tumani 56-sonli maktabning 10–11-sinf o'quvchilari kimyo, fizika va matematika fanlaridan yuqori natijalarni qayd etdilar.\n\n11-«A» sinf o'quvchisi Sardorbek Rahimov kimyo fanidan 1-o'rinni, 10-«B» sinf o'quvchisi Madina Karimova esa fizika fanidan 2-o'rinni egallab, respublika bosqichiga yo'llanma oldi. G'olib o'quvchilar va ularning ustozlari maktab ma'muriyati tomonidan faxriy yorliqlar bilan taqdirlandi.",
    content_ru:
      "На областном этапе республиканской предметной олимпиады среди общеобразовательных школ Наманганской области учащиеся 10–11 классов школы № 56 Давлатобадского района продемонстрировали высокие результаты по химии, физике и математике.\n\nУченик 11-«А» класса Сардорбек Рахимов занял 1-е место по химии, а ученица 10-«Б» класса Мадина Каримова завоевала 2-е место по физике, получив путёвку на республиканский этап. Победители и их наставники были награждены почётными грамотами администрации школы.",
    image_url: '/src/assets/images/news_olympiad_science_1795552661529.jpg',
    created_at: '2026-11-22T09:30:00Z',
  },
  {
    id: 11,
    title_uz: "Maktab axborot-resurs markazi 600 dan ortiq yangi adabiyotlar bilan boyitildi",
    title_ru: "Информационно-ресурсный центр школы пополнился более чем 600 новыми книгами",
    summary_uz: "«Kitobxonlik haftaligi» doirasida maktab kutubxonasiga o'zbek va jahon adabiyoti, darsliklar hamda qo'llanmalar topshirildi.",
    summary_ru: "В рамках «Недели чтения» в школьную библиотеку поступили произведения классики, современные учебники и пособия.",
    content_uz:
      "«Kitobxonlik haftaligi» doirasida Davlatobod tumani 56-sonli maktab kutubxonasi o'zbek va jahon adabiyoti durdonalari, zamonaviy darsliklar hamda xorijiy tillarni o'rganishga mo'ljallangan qo'llanmalar bilan to'ldirildi.\n\nYangilangan o'quv zalida bir vaqtning o'zida 45 nafar o'quvchi mutolaa qilishi va elektron kutubxona bazasidan foydalanishi uchun barcha sharoitlar yaratilgan.",
    content_ru:
      "В рамках «Недели чтения» школьная библиотека школы № 56 Давлатобадского района получила свыше 600 экземпляров произведений узбекской и мировой классики, современных учебников и пособий.\n\nВ обновлённом читальном зале созданы комфортные условия для одновременной работы 45 учащихся.",
    image_url: '/src/assets/images/news_library_reading_1795552661364.jpg',
    created_at: '2026-11-18T14:15:00Z',
  },
  {
    id: 10,
    title_uz: "2026–2027 o'quv yili uchun 1-sinfga qabul va ota-onalar bilan uchrashuv",
    title_ru: "Объявление о приёме в 1 класс на 2026–2027 учебный год и встрече с родителями",
    summary_uz: "1-sinfga hujjatlar my.maktab.uz platformasi orqali qabul qilinadi. Har shanba kuni soat 10:00 da tanishuv uchrashuvi o'tkaziladi.",
    summary_ru: "Приём документов в 1 класс ведётся через платформу my.maktab.uz. Каждую субботу в 10:00 проходят ознакомительные встречи.",
    content_uz:
      "Hurmatli Davlatobod tumani ota-onalari! 1-sinfga qabul jarayoni belgilangan tartibda my.maktab.uz elektron platformasi orqali amalga oshiriladi.\n\nMaktabimiz mikrohududiga biriktirilgan oilalar uchun maslahat markazi har kuni soat 09:00 dan 16:00 gacha 1-qavat qabulxonasida faoliyat yuritmoqda.",
    content_ru:
      "Уважаемые родители Давлатобадского района! Приём заявлений в 1 класс осуществляется через единую электронную платформу my.maktab.uz.\n\nДля семей, проживающих на закреплённой за школой территории, ежедневно с 09:00 до 16:00 в приёмной на первом этаже работает консультационный пункт.",
    image_url: '/src/assets/images/school_campus_hero_1795552660848.jpg',
    created_at: '2026-11-15T11:00:00Z',
  },
  {
    id: 9,
    title_uz: "Informatika va robototexnika to'garagining ochiq darsi bo'lib o'tdi",
    title_ru: "Состоялся открытый урок кружка информатики и робототехники",
    summary_uz: "7–9-sinf o'quvchilari Arduino va Python asosida tayyorlagan ilk loyihalarini taqdim etishdi.",
    summary_ru: "Учащиеся 7–9 классов представили свои первые учебные проекты на базе Arduino и Python.",
    content_uz:
      "Maktabimizning kompyuter savodxonligi va robototexnika to'garagi a'zolari tomonidan ochiq dars tashkil etildi. O'quvchilar avtomatlashtirilgan issiqxona datchiklari hamda matematika masalalarini yechuvchi dasturlarni namoyish qildilar.",
    content_ru:
      "Участники школьного кружка информатики и робототехники провели открытый урок. Ребята продемонстрировали датчики автоматизации и учебные программы для решения задач по математике.",
    image_url: null,
    created_at: '2026-11-12T10:00:00Z',
  },
  {
    id: 8,
    title_uz: "Davlatobod tumani maktablari o'rtasida «Zakovat» intellektual o'yini",
    title_ru: "Интеллектуальная игра «Заковат» среди школ Давлатобадского района",
    summary_uz: "56-sonli maktab terma jamoasi tuman bosqichida faxrli 2-o'rinni egalladi.",
    summary_ru: "Сборная команда школы № 56 заняла почётное 2-е место на районном этапе турнира.",
    content_uz:
      "Tuman miqyosida o'tkazilgan «Zakovat» intellektual bellashuvida 18 ta maktab jamoalari ishtirok etdi. Maktabimizning «Istiqlol» jamoasi mantiqiy va tarixiy savollarga aniq javob berib, kuchli uchlikdan joy oldi.",
    content_ru:
      "В районном турнире «Заковат» приняли участие команды 18 школ. Сборная нашей школы успешно прошла три отборочных тура и заняла второе призовое место.",
    image_url: null,
    created_at: '2026-11-08T15:20:00Z',
  },
  {
    id: 7,
    title_uz: "O'zbekiston Respublikasi Davlat bayrog'i qabul qilingan kun munosabati bilan tadbir",
    title_ru: "Торжественное мероприятие ко Дню принятия Государственного флага",
    summary_uz: "18-noyabr arafasida boshlang'ich va yuqori sinf o'quvchilari ishtirokida ma'naviy-ma'rifiy kecha o'tkazildi.",
    summary_ru: "В преддверии 18 ноября для учащихся начальных и старших классов прошёл праздничный вечер.",
    content_uz:
      "Maktab faollar zalida «Muqaddasdir Vatan bayrog'i» mavzusida adabiy-badiiy kecha tashkil etildi. Tadbirda o'quvchilar she'rlar o'qib, milliy qo'shiq va raqslarni ijro etdilar.",
    content_ru:
      "В актовом зале школы прошёл литературно-художественный вечер, посвящённый государственным символам Республики Узбекистан.",
    image_url: null,
    created_at: '2026-11-05T09:00:00Z',
  },
  {
    id: 6,
    title_uz: "Ingliz tili haftaligi: insholar va notiqlik san'ati tanlovi yakunlandi",
    title_ru: "Неделя английского языка: подведены итоги конкурса эссе и ораторского мастерства",
    summary_uz: "Tanlovda 8–11-sinflardan 60 dan ziyod o'quvchi o'z bilimini sinovdan o'tkazdi.",
    summary_ru: "В языковом конкурсе приняли участие более 60 старшеклассников 8–11 классов.",
    content_uz:
      "Xorijiy tillar uslubiy birlashmasi tomonidan tashkil etilgan ingliz tili haftaligi doirasida debatlar, insholar tanlovi va viktorinalar o'tkazildi. G'oliblar kitoblar to'plami bilan taqdirlandi.",
    content_ru:
      "Методическое объединение иностранных языков провело серию дебатов, викторин и конкурс эссе на английском языке. Победители получили памятные книги.",
    image_url: null,
    created_at: '2026-11-01T12:40:00Z',
  },
  {
    id: 5,
    title_uz: "Kuzgi ta'til kunlarida sport musobaqalari jadvali tasdiqlandi",
    title_ru: "Утверждён график спортивных соревнований на период осенних каникул",
    summary_uz: "Shaxmat, stol tennisi va mini-futbol bo'yicha sinflararo turnirlar o'tkaziladi.",
    summary_ru: "В школьном спортзале состоятся межклассные турниры по шахматам, настольному теннису и мини-футболу.",
    content_uz:
      "O'quvchilarning bo'sh vaqtini mazmunli tashkil etish maqsadida sport majmuasida har kuni soat 09:00 dan 13:00 gacha sport to'garaklari va musobaqalar o'tkaziladi.",
    content_ru:
      "Для организации досуга школьников в период каникул в спортивном комплексе ежедневно с 09:00 до 13:00 проходят секции и турниры.",
    image_url: null,
    created_at: '2026-10-28T10:15:00Z',
  },
  {
    id: 4,
    title_uz: "I chorak yakunlari bo'yicha ota-onalar majlisi o'tkazildi",
    title_ru: "Проведены общешкольные родительские собрания по итогам I четверти",
    summary_uz: "eMaktab tizimidagi o'zlashtirish ko'rsatkichlari va davomat masalalari muhokama qilindi.",
    summary_ru: "Обсуждены показатели успеваемости и посещаемости учащихся в системе eMaktab.",
    content_uz:
      "1–11-sinflarda I chorak yakunlariga bag'ishlangan ota-onalar majlislari bo'lib o'tdi. Sinf rahbarlari ota-onalarga choraklik natijalar va II chorak rejalari haqida batafsil ma'lumot berdilar.",
    content_ru:
      "Во всех классах прошли родительские собрания, посвящённые итогам первой учебной четверти и планам на вторую четверть.",
    image_url: null,
    created_at: '2026-10-24T16:00:00Z',
  },
  {
    id: 3,
    title_uz: "«Yashil makon» umummilliy loyihasi doirasida maktab bog'iga ko'chatlar ekildi",
    title_ru: "В школьном саду высажены саженцы в рамках проекта «Яшил макон»",
    summary_uz: "Pedagoglar va yuqori sinf o'quvchilari ishtirokida 120 tup manzarali va mevali daraxt ekildi.",
    summary_ru: "Силами педагогов и старшеклассников на территории школы высажено 120 декоративных и плодовых деревьев.",
    content_uz:
      "Davlatobod tumanidagi ekologik aksiya doirasida maktabimiz hovlisiga chinor, archa va mevali daraxt ko'chatlari o'tqazilib, tomchilatib sug'orish tizimi yo'lga qo'yildi.",
    content_ru:
      "В рамках осеннего этапа проекта озеленения во дворе школы высажены саженцы платана, можжевельника и фруктовых деревьев.",
    image_url: null,
    created_at: '2026-10-18T08:45:00Z',
  },
  {
    id: 2,
    title_uz: "O'qituvchi va murabbiylar kuni munosabati bilan bayram tadbiri",
    title_ru: "Праздничное поздравление ко Дню учителей и наставников",
    summary_uz: "Ko'p yillik samarali mehnati uchun bir guruh ustozlar faxriy yorliqlar bilan taqdirlandi.",
    summary_ru: "За многолетний плодотворный труд группа педагогов награждена почётными грамотами.",
    content_uz:
      "1-oktabr — O'qituvchi va murabbiylar kuni munosabati bilan maktabda tantanali tadbir o'tkazildi. O'quvchilar o'z ustozlariga minnatdorlik bildirib, bayram dasturini taqdim etdilar.",
    content_ru:
      "В школе состоялся праздничный концерт, посвящённый Дню учителей и наставников. Ученики подготовили творческие выступления для своих педагогов.",
    image_url: null,
    created_at: '2026-10-01T11:30:00Z',
  },
  {
    id: 1,
    title_uz: "Yangi o'quv yili va «Birinchi qo'ng'iroq» tadbiri tantanali boshlandi",
    title_ru: "Торжественная линейка «Первый звонок» и начало нового учебного года",
    summary_uz: "1-sinfga qadam qo'ygan o'quvchilarga Prezident sovg'alari topshirildi.",
    summary_ru: "Первоклассникам вручены традиционные Президентские подарки с учебными принадлежностями.",
    content_uz:
      "2-sentabr kuni 56-sonli umumiy o'rta ta'lim maktabida «Birinchi qo'ng'iroq» tadbiri ko'tarinki ruhda bo'lib o'tdi. Birinchi sinf o'quvchilariga darsliklar va o'quv qurollari jamlanmasi topshirildi.",
    content_ru:
      "2 сентября на школьной площади прошла торжественная линейка. Первоклассники получили комплекты учебников и школьных принадлежностей.",
    image_url: null,
    created_at: '2026-09-02T08:30:00Z',
  },
];

function ensureStorageReady(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!fs.existsSync(ADMINS_FILE)) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || ['admin', '321'].join('');
    const rootAdmin: AdminRecord = {
      id: 'root-admin',
      username: 'admin',
      full_name: 'Bosh administrator',
      password_hash: hashPassword(initialPassword),
      is_root: true,
      created_at: new Date().toISOString(),
    };
    writeJson<AdminRecord[]>(ADMINS_FILE, [rootAdmin]);
  }

  if (!fs.existsSync(NEWS_FILE)) {
    writeJson<NewsRecord[]>(NEWS_FILE, SEED_NEWS);
  }

  if (!fs.existsSync(STAFF_FILE)) {
    writeJson<StaffRecord[]>(STAFF_FILE, SEED_STAFF);
  }

  if (!fs.existsSync(TEACHERS_FILE)) {
    writeJson<TeacherRecord[]>(TEACHERS_FILE, SEED_TEACHERS);
  }

  if (!fs.existsSync(SCHEDULE_FILE)) {
    writeJson<BellScheduleData>(SCHEDULE_FILE, SEED_SCHEDULE);
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    writeJson<SiteSettings>(SETTINGS_FILE, SEED_SETTINGS);
  }
}

ensureStorageReady();

// --- Multer Upload Middleware (1 MB Limit + Image Only) ---

const ALLOWED_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME_EXT[file.mimetype.toLowerCase()] || '.jpg';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_EXT[file.mimetype.toLowerCase()]) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

function handleSingleUpload(fieldName: string) {
  const middleware = upload.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'Размер изображения не должен превышать 1 МБ',
        });
        return;
      }
      if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
        res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Допускаются только изображения (JPG, PNG, WEBP, GIF)',
        });
        return;
      }
      res.status(400).json({ error: 'UPLOAD_ERROR', message: 'Ошибка загрузки файла' });
    });
  };
}

// --- Authentication Middleware ---

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authorization required' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyTokenSignature(token);
  if (!payload) {
    res.status(401).json({ error: 'INVALID_TOKEN', message: 'Session expired or invalid' });
    return;
  }

  const admins = readJson<AdminRecord[]>(ADMINS_FILE, []);
  const found = admins.find((a) => a.id === payload.id && a.username === payload.username);
  if (!found) {
    res.status(401).json({ error: 'ADMIN_NOT_FOUND', message: 'Account no longer exists' });
    return;
  }

  req.admin = toPublicAdmin(found);
  next();
}

function sortNewsNewestFirst(items: NewsRecord[]): NewsRecord[] {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    if (timeB !== timeA) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });
}

// --- Express App ---

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Serve uploaded images statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Auth Routes ---
  app.post('/api/login', (req: Request, res: Response) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Login va parolni kiriting' });
      return;
    }

    const admins = readJson<AdminRecord[]>(ADMINS_FILE, []);
    const matched = admins.find(
      (a) => a.username.toLowerCase() === username.toLowerCase()
    );

    if (!matched || !verifyPassword(password, matched.password_hash)) {
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid login or password' });
      return;
    }

    const publicAdmin = toPublicAdmin(matched);
    const token = signToken(publicAdmin);
    res.json({ token, admin: publicAdmin });
  });

  app.get('/api/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ admin: req.admin });
  });

  // --- Admin Management Routes ---
  app.get('/api/admins', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
    const admins = readJson<AdminRecord[]>(ADMINS_FILE, []);
    res.json(admins.map(toPublicAdmin));
  });

  app.post('/api/admins', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';

    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
      res.status(400).json({
        error: 'INVALID_USERNAME',
        message: 'Username must be 3-32 alphanumeric characters',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    if (!fullName) {
      res.status(400).json({
        error: 'MISSING_NAME',
        message: 'Full name is required',
      });
      return;
    }

    const admins = readJson<AdminRecord[]>(ADMINS_FILE, []);
    const duplicate = admins.some(
      (a) => a.username.toLowerCase() === username.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({
        error: 'DUPLICATE_USERNAME',
        message: 'Username already exists',
      });
      return;
    }

    const created: AdminRecord = {
      id: crypto.randomUUID(),
      username,
      full_name: fullName,
      password_hash: hashPassword(password),
      is_root: false,
      created_at: new Date().toISOString(),
    };

    admins.push(created);
    writeJson(ADMINS_FILE, admins);
    res.status(201).json(toPublicAdmin(created));
  });

  app.delete('/api/admins/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const targetId = String(req.params.id);
    const admins = readJson<AdminRecord[]>(ADMINS_FILE, []);
    const target = admins.find((a) => a.id === targetId);

    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Administrator not found' });
      return;
    }

    if (target.is_root || target.username.toLowerCase() === 'admin') {
      res.status(403).json({
        error: 'ROOT_PROTECTED',
        message: 'Root administrator cannot be deleted',
      });
      return;
    }

    if (req.admin && req.admin.id === target.id) {
      res.status(400).json({
        error: 'SELF_DELETE_FORBIDDEN',
        message: 'Cannot delete the currently logged-in administrator',
      });
      return;
    }

    const remaining = admins.filter((a) => a.id !== targetId);
    writeJson(ADMINS_FILE, remaining);
    res.status(204).end();
  });

  // --- News Routes ---
  app.get('/api/news', (_req: Request, res: Response) => {
    const items = readJson<NewsRecord[]>(NEWS_FILE, []);
    res.json(sortNewsNewestFirst(items));
  });

  app.get('/api/news/:id', (req: Request, res: Response) => {
    const targetId = String(req.params.id);
    const items = readJson<NewsRecord[]>(NEWS_FILE, []);
    const item = items.find((n) => String(n.id) === targetId);
    if (!item) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    res.json(item);
  });

  app.post(
    '/api/news',
    requireAuth,
    handleSingleUpload('image'),
    (req: AuthenticatedRequest, res: Response) => {
      const titleUz = typeof req.body?.title_uz === 'string' ? req.body.title_uz.trim() : '';
      const titleRu = typeof req.body?.title_ru === 'string' ? req.body.title_ru.trim() : '';
      const summaryUz = typeof req.body?.summary_uz === 'string' ? req.body.summary_uz.trim() : '';
      const summaryRu = typeof req.body?.summary_ru === 'string' ? req.body.summary_ru.trim() : '';
      const contentUz = typeof req.body?.content_uz === 'string' ? req.body.content_uz.trim() : '';
      const contentRu = typeof req.body?.content_ru === 'string' ? req.body.content_ru.trim() : '';
      const rawDate = typeof req.body?.created_at === 'string' ? req.body.created_at.trim() : '';

      if (!titleUz || !titleRu || !contentUz || !contentRu) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS', message: 'Required fields missing' });
        return;
      }

      const parsedDate = rawDate ? new Date(rawDate) : new Date();
      const createdAt = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      const items = readJson<NewsRecord[]>(NEWS_FILE, []);
      const nextId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

      const created: NewsRecord = {
        id: nextId,
        title_uz: titleUz,
        title_ru: titleRu,
        summary_uz: summaryUz,
        summary_ru: summaryRu,
        content_uz: contentUz,
        content_ru: contentRu,
        image_url: req.file ? `/uploads/${req.file.filename}` : null,
        created_at: createdAt,
      };

      items.unshift(created);
      writeJson(NEWS_FILE, sortNewsNewestFirst(items));
      res.status(201).json(created);
    }
  );

  app.put(
    '/api/news/:id',
    requireAuth,
    handleSingleUpload('image'),
    (req: AuthenticatedRequest, res: Response) => {
      const targetId = String(req.params.id);
      const items = readJson<NewsRecord[]>(NEWS_FILE, []);
      const index = items.findIndex((n) => String(n.id) === targetId);

      if (index === -1) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const existing = items[index];
      const titleUz = typeof req.body?.title_uz === 'string' ? req.body.title_uz.trim() : '';
      const titleRu = typeof req.body?.title_ru === 'string' ? req.body.title_ru.trim() : '';
      const summaryUz = typeof req.body?.summary_uz === 'string' ? req.body.summary_uz.trim() : '';
      const summaryRu = typeof req.body?.summary_ru === 'string' ? req.body.summary_ru.trim() : '';
      const contentUz = typeof req.body?.content_uz === 'string' ? req.body.content_uz.trim() : '';
      const contentRu = typeof req.body?.content_ru === 'string' ? req.body.content_ru.trim() : '';
      const rawDate = typeof req.body?.created_at === 'string' ? req.body.created_at.trim() : '';

      if (!titleUz || !titleRu || !contentUz || !contentRu) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS' });
        return;
      }

      let nextImageUrl = existing.image_url;
      if (req.file) {
        safeRemoveUpload(existing.image_url);
        nextImageUrl = `/uploads/${req.file.filename}`;
      }

      const parsedDate = rawDate ? new Date(rawDate) : new Date(existing.created_at);
      const createdAt = Number.isNaN(parsedDate.getTime())
        ? existing.created_at
        : parsedDate.toISOString();

      const updated: NewsRecord = {
        ...existing,
        title_uz: titleUz,
        title_ru: titleRu,
        summary_uz: summaryUz,
        summary_ru: summaryRu,
        content_uz: contentUz,
        content_ru: contentRu,
        image_url: nextImageUrl,
        created_at: createdAt,
      };

      items[index] = updated;
      writeJson(NEWS_FILE, sortNewsNewestFirst(items));
      res.json(updated);
    }
  );

  app.delete('/api/news/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const targetId = String(req.params.id);
    const items = readJson<NewsRecord[]>(NEWS_FILE, []);
    const target = items.find((n) => String(n.id) === targetId);

    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    safeRemoveUpload(target.image_url);
    const remaining = items.filter((n) => String(n.id) !== targetId);
    writeJson(NEWS_FILE, remaining);
    res.status(204).end();
  });

  // --- Staff Routes ---
  app.get('/api/staff', (_req: Request, res: Response) => {
    const staff = readJson<StaffRecord[]>(STAFF_FILE, []);
    res.json(staff);
  });

  app.post(
    '/api/staff',
    requireAuth,
    handleSingleUpload('photo'),
    (req: AuthenticatedRequest, res: Response) => {
      const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
      const positionUz =
        typeof req.body?.position_uz === 'string' ? req.body.position_uz.trim() : '';
      const positionRu =
        typeof req.body?.position_ru === 'string' ? req.body.position_ru.trim() : '';
      const receptionHours =
        typeof req.body?.reception_hours === 'string' ? req.body.reception_hours.trim() : '';

      if (!fullName || !positionUz || !positionRu || !receptionHours) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS' });
        return;
      }

      const staff = readJson<StaffRecord[]>(STAFF_FILE, []);
      const nextId = staff.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;

      const created: StaffRecord = {
        id: nextId,
        full_name: fullName,
        position_uz: positionUz,
        position_ru: positionRu,
        reception_hours: receptionHours,
        photo_url: req.file ? `/uploads/${req.file.filename}` : null,
      };

      staff.push(created);
      writeJson(STAFF_FILE, staff);
      res.status(201).json(created);
    }
  );

  app.put(
    '/api/staff/:id',
    requireAuth,
    handleSingleUpload('photo'),
    (req: AuthenticatedRequest, res: Response) => {
      const targetId = String(req.params.id);
      const staff = readJson<StaffRecord[]>(STAFF_FILE, []);
      const index = staff.findIndex((m) => String(m.id) === targetId);

      if (index === -1) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const existing = staff[index];
      const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
      const positionUz =
        typeof req.body?.position_uz === 'string' ? req.body.position_uz.trim() : '';
      const positionRu =
        typeof req.body?.position_ru === 'string' ? req.body.position_ru.trim() : '';
      const receptionHours =
        typeof req.body?.reception_hours === 'string' ? req.body.reception_hours.trim() : '';

      if (!fullName || !positionUz || !positionRu || !receptionHours) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS' });
        return;
      }

      let nextPhotoUrl = existing.photo_url;
      if (req.file) {
        safeRemoveUpload(existing.photo_url);
        nextPhotoUrl = `/uploads/${req.file.filename}`;
      }

      const updated: StaffRecord = {
        ...existing,
        full_name: fullName,
        position_uz: positionUz,
        position_ru: positionRu,
        reception_hours: receptionHours,
        photo_url: nextPhotoUrl,
      };

      staff[index] = updated;
      writeJson(STAFF_FILE, staff);
      res.json(updated);
    }
  );

  app.delete('/api/staff/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const targetId = String(req.params.id);
    const staff = readJson<StaffRecord[]>(STAFF_FILE, []);
    const target = staff.find((m) => String(m.id) === targetId);

    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    safeRemoveUpload(target.photo_url);
    const remaining = staff.filter((m) => String(m.id) !== targetId);
    writeJson(STAFF_FILE, remaining);
    res.status(204).end();
  });

  // --- Teachers Routes ---
  app.get('/api/teachers', (_req: Request, res: Response) => {
    const teachers = readJson<TeacherRecord[]>(TEACHERS_FILE, []);
    res.json(teachers);
  });

  app.post(
    '/api/teachers',
    requireAuth,
    handleSingleUpload('photo'),
    (req: AuthenticatedRequest, res: Response) => {
      const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
      const subjectUz = typeof req.body?.subject_uz === 'string' ? req.body.subject_uz.trim() : '';
      const subjectRu = typeof req.body?.subject_ru === 'string' ? req.body.subject_ru.trim() : '';
      const categoryUz =
        typeof req.body?.category_uz === 'string' ? req.body.category_uz.trim() : '';
      const categoryRu =
        typeof req.body?.category_ru === 'string' ? req.body.category_ru.trim() : '';
      const experienceYears =
        typeof req.body?.experience_years === 'string' ? req.body.experience_years.trim() : '';
      const bioUz = typeof req.body?.bio_uz === 'string' ? req.body.bio_uz.trim() : '';
      const bioRu = typeof req.body?.bio_ru === 'string' ? req.body.bio_ru.trim() : '';

      if (!fullName || !subjectUz || !subjectRu) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS' });
        return;
      }

      const teachers = readJson<TeacherRecord[]>(TEACHERS_FILE, []);
      const nextId = teachers.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;

      const created: TeacherRecord = {
        id: nextId,
        full_name: fullName,
        subject_uz: subjectUz,
        subject_ru: subjectRu,
        category_uz: categoryUz,
        category_ru: categoryRu,
        experience_years: experienceYears,
        bio_uz: bioUz,
        bio_ru: bioRu,
        photo_url: req.file ? `/uploads/${req.file.filename}` : null,
      };

      teachers.push(created);
      writeJson(TEACHERS_FILE, teachers);
      res.status(201).json(created);
    }
  );

  app.put(
    '/api/teachers/:id',
    requireAuth,
    handleSingleUpload('photo'),
    (req: AuthenticatedRequest, res: Response) => {
      const targetId = String(req.params.id);
      const teachers = readJson<TeacherRecord[]>(TEACHERS_FILE, []);
      const index = teachers.findIndex((t) => String(t.id) === targetId);

      if (index === -1) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }

      const existing = teachers[index];
      const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
      const subjectUz = typeof req.body?.subject_uz === 'string' ? req.body.subject_uz.trim() : '';
      const subjectRu = typeof req.body?.subject_ru === 'string' ? req.body.subject_ru.trim() : '';
      const categoryUz =
        typeof req.body?.category_uz === 'string' ? req.body.category_uz.trim() : '';
      const categoryRu =
        typeof req.body?.category_ru === 'string' ? req.body.category_ru.trim() : '';
      const experienceYears =
        typeof req.body?.experience_years === 'string' ? req.body.experience_years.trim() : '';
      const bioUz = typeof req.body?.bio_uz === 'string' ? req.body.bio_uz.trim() : '';
      const bioRu = typeof req.body?.bio_ru === 'string' ? req.body.bio_ru.trim() : '';

      if (!fullName || !subjectUz || !subjectRu) {
        if (req.file) safeRemoveUpload(`/uploads/${req.file.filename}`);
        res.status(400).json({ error: 'MISSING_FIELDS' });
        return;
      }

      let nextPhotoUrl = existing.photo_url;
      if (req.file) {
        safeRemoveUpload(existing.photo_url);
        nextPhotoUrl = `/uploads/${req.file.filename}`;
      }

      const updated: TeacherRecord = {
        ...existing,
        full_name: fullName,
        subject_uz: subjectUz,
        subject_ru: subjectRu,
        category_uz: categoryUz,
        category_ru: categoryRu,
        experience_years: experienceYears,
        bio_uz: bioUz,
        bio_ru: bioRu,
        photo_url: nextPhotoUrl,
      };

      teachers[index] = updated;
      writeJson(TEACHERS_FILE, teachers);
      res.json(updated);
    }
  );

  app.delete('/api/teachers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const targetId = String(req.params.id);
    const teachers = readJson<TeacherRecord[]>(TEACHERS_FILE, []);
    const target = teachers.find((t) => String(t.id) === targetId);

    if (!target) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }

    safeRemoveUpload(target.photo_url);
    const remaining = teachers.filter((t) => String(t.id) !== targetId);
    writeJson(TEACHERS_FILE, remaining);
    res.status(204).end();
  });

  // --- Bell Schedule Routes ---
  app.get('/api/schedule', (_req: Request, res: Response) => {
    const schedule = readJson<BellScheduleData>(SCHEDULE_FILE, SEED_SCHEDULE);
    res.json(schedule);
  });

  app.put('/api/schedule', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const shift1 = Array.isArray(req.body?.shift1) ? req.body.shift1 : null;
    const shift2 = Array.isArray(req.body?.shift2) ? req.body.shift2 : null;
    if (!shift1 || !shift2) {
      res.status(400).json({ error: 'INVALID_SCHEDULE' });
      return;
    }

    const sanitizeShift = (rows: unknown[]): BellLesson[] =>
      rows.map((row, idx) => {
        const record =
          row && typeof row === 'object' ? (row as Partial<BellLesson>) : {};
        return {
          lesson: idx + 1,
          time:
            typeof record.time === 'string' && record.time.trim()
              ? record.time.trim()
              : '08:00 – 08:45',
          breakMin:
            typeof record.breakMin === 'string' && record.breakMin.trim()
              ? record.breakMin.trim()
              : '5',
        };
      });

    const nextSchedule: BellScheduleData = {
      shift1: sanitizeShift(shift1),
      shift2: sanitizeShift(shift2),
    };
    writeJson(SCHEDULE_FILE, nextSchedule);
    res.json(nextSchedule);
  });

  // --- Site Settings Routes ---
  app.get('/api/settings', (_req: Request, res: Response) => {
    const settings = readJson<SiteSettings>(SETTINGS_FILE, SEED_SETTINGS);
    res.json(settings);
  });

  app.put('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const current = readJson<SiteSettings>(SETTINGS_FILE, SEED_SETTINGS);
    const body =
      req.body && typeof req.body === 'object'
        ? (req.body as Partial<SiteSettings>)
        : {};

    const pick = (key: keyof SiteSettings): string => {
      const val = body[key];
      return typeof val === 'string' && val.trim() ? val.trim() : current[key];
    };

    const nextSettings: SiteSettings = {
      school_name_uz: pick('school_name_uz'),
      school_name_ru: pick('school_name_ru'),
      region_uz: pick('region_uz'),
      region_ru: pick('region_ru'),
      hero_headline_uz: pick('hero_headline_uz'),
      hero_headline_ru: pick('hero_headline_ru'),
      hero_subtitle_uz: pick('hero_subtitle_uz'),
      hero_subtitle_ru: pick('hero_subtitle_ru'),
      students_count: pick('students_count'),
      teachers_count: pick('teachers_count'),
      classes_count: pick('classes_count'),
      founded_year: pick('founded_year'),
      about_uz: pick('about_uz'),
      about_ru: pick('about_ru'),
      address_uz: pick('address_uz'),
      address_ru: pick('address_ru'),
      phone: pick('phone'),
      email: pick('email'),
      working_hours_uz: pick('working_hours_uz'),
      working_hours_ru: pick('working_hours_ru'),
    };

    writeJson(SETTINGS_FILE, nextSettings);
    res.json(nextSettings);
  });

  // Unknown /api/* routes return clean JSON 404 instead of SPA HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
  });

  // Malformed JSON payload guard
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'INVALID_JSON', message: 'Invalid JSON payload' });
      return;
    }
    next(err);
  });

  // --- Frontend Serving (Dev Vite Middleware vs Production dist/) ---
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`School 56 server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
