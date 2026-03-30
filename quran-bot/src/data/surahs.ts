export interface Surah {
  id: number;
  name: string;
  englishName: string;
  verses: number;
  type: "meccan" | "medinan";
}

/**
 * Complete list of all 114 surahs in the Quran.
 */
export const SURAHS: readonly Surah[] = [
  { id: 1, name: "الفاتحة", englishName: "Al-Fatihah", verses: 7, type: "meccan" },
  { id: 2, name: "البقرة", englishName: "Al-Baqarah", verses: 286, type: "medinan" },
  { id: 3, name: "آل عمران", englishName: "Aal-Imran", verses: 200, type: "medinan" },
  { id: 4, name: "النساء", englishName: "An-Nisa", verses: 176, type: "medinan" },
  { id: 5, name: "المائدة", englishName: "Al-Ma'idah", verses: 120, type: "medinan" },
  { id: 6, name: "الأنعام", englishName: "Al-An'am", verses: 165, type: "meccan" },
  { id: 7, name: "الأعراف", englishName: "Al-A'raf", verses: 206, type: "meccan" },
  { id: 8, name: "الأنفال", englishName: "Al-Anfal", verses: 75, type: "medinan" },
  { id: 9, name: "التوبة", englishName: "At-Tawbah", verses: 129, type: "medinan" },
  { id: 10, name: "يونس", englishName: "Yunus", verses: 109, type: "meccan" },
  { id: 11, name: "هود", englishName: "Hud", verses: 123, type: "meccan" },
  { id: 12, name: "يوسف", englishName: "Yusuf", verses: 111, type: "meccan" },
  { id: 13, name: "الرعد", englishName: "Ar-Ra'd", verses: 43, type: "medinan" },
  { id: 14, name: "إبراهيم", englishName: "Ibrahim", verses: 52, type: "meccan" },
  { id: 15, name: "الحجر", englishName: "Al-Hijr", verses: 99, type: "meccan" },
  { id: 16, name: "النحل", englishName: "An-Nahl", verses: 128, type: "meccan" },
  { id: 17, name: "الإسراء", englishName: "Al-Isra", verses: 111, type: "meccan" },
  { id: 18, name: "الكهف", englishName: "Al-Kahf", verses: 110, type: "meccan" },
  { id: 19, name: "مريم", englishName: "Maryam", verses: 98, type: "meccan" },
  { id: 20, name: "طه", englishName: "Ta-Ha", verses: 135, type: "meccan" },
  { id: 21, name: "الأنبياء", englishName: "Al-Anbiya", verses: 112, type: "meccan" },
  { id: 22, name: "الحج", englishName: "Al-Hajj", verses: 78, type: "medinan" },
  { id: 23, name: "المؤمنون", englishName: "Al-Mu'minun", verses: 118, type: "meccan" },
  { id: 24, name: "النور", englishName: "An-Nur", verses: 64, type: "medinan" },
  { id: 25, name: "الفرقان", englishName: "Al-Furqan", verses: 77, type: "meccan" },
  { id: 26, name: "الشعراء", englishName: "Ash-Shu'ara", verses: 227, type: "meccan" },
  { id: 27, name: "النمل", englishName: "An-Naml", verses: 93, type: "meccan" },
  { id: 28, name: "القصص", englishName: "Al-Qasas", verses: 88, type: "meccan" },
  { id: 29, name: "العنكبوت", englishName: "Al-Ankabut", verses: 69, type: "meccan" },
  { id: 30, name: "الروم", englishName: "Ar-Rum", verses: 60, type: "meccan" },
  { id: 31, name: "لقمان", englishName: "Luqman", verses: 34, type: "meccan" },
  { id: 32, name: "السجدة", englishName: "As-Sajdah", verses: 30, type: "meccan" },
  { id: 33, name: "الأحزاب", englishName: "Al-Ahzab", verses: 73, type: "medinan" },
  { id: 34, name: "سبأ", englishName: "Saba", verses: 54, type: "meccan" },
  { id: 35, name: "فاطر", englishName: "Fatir", verses: 45, type: "meccan" },
  { id: 36, name: "يس", englishName: "Ya-Sin", verses: 83, type: "meccan" },
  { id: 37, name: "الصافات", englishName: "As-Saffat", verses: 182, type: "meccan" },
  { id: 38, name: "ص", englishName: "Sad", verses: 88, type: "meccan" },
  { id: 39, name: "الزمر", englishName: "Az-Zumar", verses: 75, type: "meccan" },
  { id: 40, name: "غافر", englishName: "Ghafir", verses: 85, type: "meccan" },
  { id: 41, name: "فصلت", englishName: "Fussilat", verses: 54, type: "meccan" },
  { id: 42, name: "الشورى", englishName: "Ash-Shura", verses: 53, type: "meccan" },
  { id: 43, name: "الزخرف", englishName: "Az-Zukhruf", verses: 89, type: "meccan" },
  { id: 44, name: "الدخان", englishName: "Ad-Dukhan", verses: 59, type: "meccan" },
  { id: 45, name: "الجاثية", englishName: "Al-Jathiyah", verses: 37, type: "meccan" },
  { id: 46, name: "الأحقاف", englishName: "Al-Ahqaf", verses: 35, type: "meccan" },
  { id: 47, name: "محمد", englishName: "Muhammad", verses: 38, type: "medinan" },
  { id: 48, name: "الفتح", englishName: "Al-Fath", verses: 29, type: "medinan" },
  { id: 49, name: "الحجرات", englishName: "Al-Hujurat", verses: 18, type: "medinan" },
  { id: 50, name: "ق", englishName: "Qaf", verses: 45, type: "meccan" },
  { id: 51, name: "الذاريات", englishName: "Adh-Dhariyat", verses: 60, type: "meccan" },
  { id: 52, name: "الطور", englishName: "At-Tur", verses: 49, type: "meccan" },
  { id: 53, name: "النجم", englishName: "An-Najm", verses: 62, type: "meccan" },
  { id: 54, name: "القمر", englishName: "Al-Qamar", verses: 55, type: "meccan" },
  { id: 55, name: "الرحمن", englishName: "Ar-Rahman", verses: 78, type: "medinan" },
  { id: 56, name: "الواقعة", englishName: "Al-Waqi'ah", verses: 96, type: "meccan" },
  { id: 57, name: "الحديد", englishName: "Al-Hadid", verses: 29, type: "medinan" },
  { id: 58, name: "المجادلة", englishName: "Al-Mujadilah", verses: 22, type: "medinan" },
  { id: 59, name: "الحشر", englishName: "Al-Hashr", verses: 24, type: "medinan" },
  { id: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", verses: 13, type: "medinan" },
  { id: 61, name: "الصف", englishName: "As-Saff", verses: 14, type: "medinan" },
  { id: 62, name: "الجمعة", englishName: "Al-Jumu'ah", verses: 11, type: "medinan" },
  { id: 63, name: "المنافقون", englishName: "Al-Munafiqun", verses: 11, type: "medinan" },
  { id: 64, name: "التغابن", englishName: "At-Taghabun", verses: 18, type: "medinan" },
  { id: 65, name: "الطلاق", englishName: "At-Talaq", verses: 12, type: "medinan" },
  { id: 66, name: "التحريم", englishName: "At-Tahrim", verses: 12, type: "medinan" },
  { id: 67, name: "الملك", englishName: "Al-Mulk", verses: 30, type: "meccan" },
  { id: 68, name: "القلم", englishName: "Al-Qalam", verses: 52, type: "meccan" },
  { id: 69, name: "الحاقة", englishName: "Al-Haqqah", verses: 52, type: "meccan" },
  { id: 70, name: "المعارج", englishName: "Al-Ma'arij", verses: 44, type: "meccan" },
  { id: 71, name: "نوح", englishName: "Nuh", verses: 28, type: "meccan" },
  { id: 72, name: "الجن", englishName: "Al-Jinn", verses: 28, type: "meccan" },
  { id: 73, name: "المزمل", englishName: "Al-Muzzammil", verses: 20, type: "meccan" },
  { id: 74, name: "المدثر", englishName: "Al-Muddaththir", verses: 56, type: "meccan" },
  { id: 75, name: "القيامة", englishName: "Al-Qiyamah", verses: 40, type: "meccan" },
  { id: 76, name: "الإنسان", englishName: "Al-Insan", verses: 31, type: "medinan" },
  { id: 77, name: "المرسلات", englishName: "Al-Mursalat", verses: 50, type: "meccan" },
  { id: 78, name: "النبأ", englishName: "An-Naba", verses: 40, type: "meccan" },
  { id: 79, name: "النازعات", englishName: "An-Nazi'at", verses: 46, type: "meccan" },
  { id: 80, name: "عبس", englishName: "Abasa", verses: 42, type: "meccan" },
  { id: 81, name: "التكوير", englishName: "At-Takwir", verses: 29, type: "meccan" },
  { id: 82, name: "الانفطار", englishName: "Al-Infitar", verses: 19, type: "meccan" },
  { id: 83, name: "المطففين", englishName: "Al-Mutaffifin", verses: 36, type: "meccan" },
  { id: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", verses: 25, type: "meccan" },
  { id: 85, name: "البروج", englishName: "Al-Buruj", verses: 22, type: "meccan" },
  { id: 86, name: "الطارق", englishName: "At-Tariq", verses: 17, type: "meccan" },
  { id: 87, name: "الأعلى", englishName: "Al-A'la", verses: 19, type: "meccan" },
  { id: 88, name: "الغاشية", englishName: "Al-Ghashiyah", verses: 26, type: "meccan" },
  { id: 89, name: "الفجر", englishName: "Al-Fajr", verses: 30, type: "meccan" },
  { id: 90, name: "البلد", englishName: "Al-Balad", verses: 20, type: "meccan" },
  { id: 91, name: "الشمس", englishName: "Ash-Shams", verses: 15, type: "meccan" },
  { id: 92, name: "الليل", englishName: "Al-Layl", verses: 21, type: "meccan" },
  { id: 93, name: "الضحى", englishName: "Ad-Duha", verses: 11, type: "meccan" },
  { id: 94, name: "الشرح", englishName: "Ash-Sharh", verses: 8, type: "meccan" },
  { id: 95, name: "التين", englishName: "At-Tin", verses: 8, type: "meccan" },
  { id: 96, name: "العلق", englishName: "Al-Alaq", verses: 19, type: "meccan" },
  { id: 97, name: "القدر", englishName: "Al-Qadr", verses: 5, type: "meccan" },
  { id: 98, name: "البينة", englishName: "Al-Bayyinah", verses: 8, type: "medinan" },
  { id: 99, name: "الزلزلة", englishName: "Az-Zalzalah", verses: 8, type: "medinan" },
  { id: 100, name: "العاديات", englishName: "Al-Adiyat", verses: 11, type: "meccan" },
  { id: 101, name: "القارعة", englishName: "Al-Qari'ah", verses: 11, type: "meccan" },
  { id: 102, name: "التكاثر", englishName: "At-Takathur", verses: 8, type: "meccan" },
  { id: 103, name: "العصر", englishName: "Al-Asr", verses: 3, type: "meccan" },
  { id: 104, name: "الهمزة", englishName: "Al-Humazah", verses: 9, type: "meccan" },
  { id: 105, name: "الفيل", englishName: "Al-Fil", verses: 5, type: "meccan" },
  { id: 106, name: "قريش", englishName: "Quraysh", verses: 4, type: "meccan" },
  { id: 107, name: "الماعون", englishName: "Al-Ma'un", verses: 7, type: "meccan" },
  { id: 108, name: "الكوثر", englishName: "Al-Kawthar", verses: 3, type: "meccan" },
  { id: 109, name: "الكافرون", englishName: "Al-Kafirun", verses: 6, type: "meccan" },
  { id: 110, name: "النصر", englishName: "An-Nasr", verses: 3, type: "medinan" },
  { id: 111, name: "المسد", englishName: "Al-Masad", verses: 5, type: "meccan" },
  { id: 112, name: "الإخلاص", englishName: "Al-Ikhlas", verses: 4, type: "meccan" },
  { id: 113, name: "الفلق", englishName: "Al-Falaq", verses: 5, type: "meccan" },
  { id: 114, name: "الناس", englishName: "An-Nas", verses: 6, type: "medinan" },
] as const;

/**
 * Get a surah by its number (1-114).
 */
export function getSurahById(id: number): Surah | undefined {
  return SURAHS.find((s) => s.id === id);
}

/**
 * Search surahs by name (Arabic or English), supporting partial match.
 */
export function searchSurahs(query: string, limit = 25): Surah[] {
  const q = query.toLowerCase().trim();
  if (q.length === 0) return SURAHS.slice(0, limit);

  // Try matching by number first
  const num = parseInt(q, 10);
  if (!isNaN(num)) {
    return SURAHS.filter((s) => s.id.toString().startsWith(q)).slice(0, limit);
  }

  return SURAHS.filter(
    (s) =>
      s.name.includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      `${s.id}`.includes(q),
  ).slice(0, limit);
}
