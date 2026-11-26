import type { BellScheduleData, NewsItem, SiteSettings, StaffMember } from '../types';

export const HERO_CAMPUS_IMAGE = '/src/assets/images/school_campus_hero_1795552660848.jpg';

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

export const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 1,
    title_uz: "Namangan viloyati fan olimpiadasida 4 nafar o'quvchimiz g'olib bo'ldi",
    title_ru: "4 ученика нашей школы стали призёрами областного этапа предметной олимпиады",
    content_uz:
      "Namangan viloyati umumta'lim maktablari o'rtasida o'tkazilgan fan olimpiadasining viloyat bosqichida Davlatobod tumani 56-sonli maktabning 10–11-sinf o'quvchilari kimyo, fizika va matematika fanlaridan yuqori natijalarni qayd etdilar.\n\n11-«A» sinf o'quvchisi Sardorbek Rahimov kimyo fanidan 1-o'rinni, 10-«B» sinf o'quvchisi Madina Karimova esa fizika fanidan 2-o'rinni egallab, respublika bosqichiga yo'llanma oldi. G'olib o'quvchilar va ularning ustozlari maktab ma'muriyati tomonidan faxriy yorliqlar bilan taqdirlandi.",
    content_ru:
      "На областном этапе республиканской предметной олимпиады среди общеобразовательных школ Наманганской области учащиеся 10–11 классов школы № 56 Давлатобадского района продемонстрировали высокие результаты по химии, физике и математике.\n\nУченик 11-«А» класса Сардорбек Рахимов занял 1-е место по химии, а ученица 10-«Б» класса Мадина Каримова завоевала 2-е место по физике, получив путёвку на республиканский этап. Победители и их наставники были награждены почётными грамотами администрации школы.",
    image_url: '/src/assets/images/news_olympiad_science_1795552661529.jpg',
    created_at: '2026-11-18T09:30:00Z',
  },
  {
    id: 2,
    title_uz: "Maktab axborot-resurs markazi 600 dan ortiq yangi badiiy va ilmiy adabiyotlar bilan boyitildi",
    title_ru: "Информационно-ресурсный центр школы пополнился более чем 600 новыми книгами",
    content_uz:
      "«Kitobxonlik haftaligi» doirasida Davlatobod tumani 56-sonli maktab kutubxonasi o'zbek va jahon adabiyoti durdonalari, zamonaviy darsliklar hamda xorijiy tillarni o'rganishga mo'ljallangan qo'llanmalar bilan to'ldirildi.\n\nYangilangan o'quv zalida bir vaqtning o'zida 45 nafar o'quvchi mutolaa qilishi va elektron kutubxona bazasidan foydalanishi uchun barcha sharoitlar yaratilgan. Kutubxona dushanbadan shanbagacha soat 08:30 dan 17:30 gacha faoliyat yuritadi.",
    content_ru:
      "В рамках «Недели чтения» школьная библиотека школы № 56 Давлатобадского района получила свыше 600 экземпляров произведений узбекской и мировой классики, современных учебников и пособий по изучению иностранных языков.\n\nВ обновлённом читальном зале созданы комфортные условия для одновременной работы 45 учащихся, включая доступ к электронной базе учебной литературы. Библиотека открыта с понедельника по субботу с 08:30 до 17:30.",
    image_url: '/src/assets/images/news_library_reading_1795552661364.jpg',
    created_at: '2026-11-11T14:15:00Z',
  },
  {
    id: 3,
    title_uz: "2026–2027 o'quv yili uchun 1-sinfga qabul va ota-onalar bilan tanishuv uchrashuvi haqida e'lon",
    title_ru: "Объявление о приёме в 1 класс на 2026–2027 учебный год и встрече с родителями",
    content_uz:
      "Hurmatli Davlatobod tumani ota-onalari! 1-sinfga qabul jarayoni belgilangan tartibda my.maktab.uz elektron platformasi orqali amalga oshiriladi.\n\nMaktabimiz mikrohududiga biriktirilgan oilalar uchun maslahat markazi har kuni soat 09:00 dan 16:00 gacha 1-qavat qabulxonasida faoliyat yuritmoqda. O'quv xonalari va o'qituvchilar bilan tanishuv uchrashuvi har shanba kuni soat 10:00 da bo'lib o'tadi.",
    content_ru:
      "Уважаемые родители Давлатобадского района! Приём заявлений в 1 класс осуществляется в установленном порядке через единую электронную платформу my.maktab.uz.\n\nДля семей, проживающих на закреплённой за школой территории, ежедневно с 09:00 до 16:00 в приёмной на первом этаже работает консультационный пункт. Ознакомительные встречи с учителями начальных классов проходят каждую субботу в 10:00.",
    image_url: null,
    created_at: '2026-11-04T11:00:00Z',
  },
];

export const FALLBACK_STAFF: StaffMember[] = [
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
