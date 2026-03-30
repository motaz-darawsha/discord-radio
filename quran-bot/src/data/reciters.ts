export interface Reciter {
  id: number;
  name: string;
  englishName: string;
  server: string;
  moshafId: number;
  surahList: number[];
}

/**
 * Popular Quran reciters with their mp3quran.net server URLs.
 * Audio URL format: `{server}{surahNumber padded to 3 digits}.mp3`
 * Example: https://server8.mp3quran.net/afs/001.mp3
 */
export const RECITERS: readonly Reciter[] = [
  {
    id: 12,
    name: "مشاري راشد العفاسي",
    englishName: "Mishary Rashid Alafasy",
    server: "https://server8.mp3quran.net/afs/",
    moshafId: 12,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 5,
    name: "عبدالرحمن السديس",
    englishName: "Abdurrahman As-Sudais",
    server: "https://server11.mp3quran.net/sds/",
    moshafId: 5,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 9,
    name: "سعود الشريم",
    englishName: "Saud Ash-Shuraim",
    server: "https://server7.mp3quran.net/shur/",
    moshafId: 9,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 13,
    name: "ماهر المعيقلي",
    englishName: "Maher Al-Muaiqly",
    server: "https://server12.mp3quran.net/maher/",
    moshafId: 13,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 6,
    name: "عبدالباسط عبدالصمد",
    englishName: "Abdul Basit Abdul Samad",
    server: "https://server7.mp3quran.net/basit/",
    moshafId: 6,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 128,
    name: "هزاع البلوشي",
    englishName: "Hazza Al-Balushi",
    server: "https://server11.mp3quran.net/hazza/",
    moshafId: 128,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 3,
    name: "أحمد العجمي",
    englishName: "Ahmed Al-Ajmi",
    server: "https://server10.mp3quran.net/ajm/",
    moshafId: 3,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 108,
    name: "ياسر الدوسري",
    englishName: "Yasser Ad-Dossari",
    server: "https://server11.mp3quran.net/yasser/",
    moshafId: 108,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 120,
    name: "ناصر القطامي",
    englishName: "Nasser Al-Qatami",
    server: "https://server6.mp3quran.net/qtm/",
    moshafId: 120,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 7,
    name: "فارس عباد",
    englishName: "Fares Abbad",
    server: "https://server8.mp3quran.net/frs_a/",
    moshafId: 7,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 1,
    name: "إبراهيم الأخضر",
    englishName: "Ibrahim Al-Akhdar",
    server: "https://server6.mp3quran.net/akdr/",
    moshafId: 1,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 11,
    name: "محمد صديق المنشاوي",
    englishName: "Muhammad Siddiq Al-Minshawi",
    server: "https://server10.mp3quran.net/minsh/",
    moshafId: 11,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 4,
    name: "علي الحذيفي",
    englishName: "Ali Al-Hudhaify",
    server: "https://server11.mp3quran.net/hthfi/",
    moshafId: 4,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 2,
    name: "محمود خليل الحصري",
    englishName: "Mahmoud Khalil Al-Hussary",
    server: "https://server13.mp3quran.net/husr/",
    moshafId: 2,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
  {
    id: 15,
    name: "سعد الغامدي",
    englishName: "Saad Al-Ghamdi",
    server: "https://server7.mp3quran.net/s_gmd/",
    moshafId: 15,
    surahList: Array.from({ length: 114 }, (_, i) => i + 1),
  },
];

/** Default reciter (Mishary Rashid Alafasy). */
export const DEFAULT_RECITER = RECITERS[0]!;

/**
 * Get a reciter by their ID.
 */
export function getReciterById(id: number): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

/**
 * Search reciters by name (Arabic or English), supporting partial match.
 */
export function searchReciters(query: string, limit = 25): Reciter[] {
  const q = query.toLowerCase().trim();
  if (q.length === 0) return RECITERS.slice(0, limit);

  return RECITERS.filter(
    (r) =>
      r.name.includes(q) ||
      r.englishName.toLowerCase().includes(q),
  ).slice(0, limit);
}

/**
 * Build the audio URL for a given reciter and surah.
 */
export function buildAudioUrl(reciter: Reciter, surahId: number): string {
  return `${reciter.server}${surahId.toString().padStart(3, "0")}.mp3`;
}
