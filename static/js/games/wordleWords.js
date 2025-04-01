/**
 * Wordle Kelime Listesi
 * 5 harfli Türkçe kelimeler içerir
 */

const WORDLE_WORDS = [
  // Türkçe 5 harfli kelimeler
  "kalem", "kitap", "masa", "sanık", "kapak", "cevap", "sınav", "masal", "roman", "köpek",
  "kedi", "insan", "tarih", "duvar", "radyo", "bilgi", "sayfa", "uyku", "para", "resim",
  "oyun", "yazar", "müzik", "haber", "güneş", "çiçek", "deniz", "nehir", "araba", "okul",
  "proje", "hayat", "çocuk", "sevgi", "yemek", "kalp", "bilet", "hesap", "telefon", "süreç",
  "gelin", "damat", "dünya", "bulut", "gömlek", "hızlı", "balık", "kuşak", "müdür", "kumaş",
  "toplu", "yaşam", "özgür", "iklim", "değer", "vatan", "sebze", "meyve", "kapı", "çanta",
  "sıcak", "soğuk", "kurak", "yağış", "bahçe", "sokak", "müşteri", "talep", "sayaç", "kural",
  "fırın", "kabuk", "kukla", "makas", "şehir", "başak", "hayal", "hatıra", "düşman", "dost",
  "devir", "duygu", "uçak", "tren", "otobüs", "damla", "temel", "salça", "tepsi", "tabak",
  "kaşık", "çatal", "bıçak", "bebek", "ayna", "bardak", "fincan", "sehpa", "dolap", "halı",
  "perde", "şeker", "pasta", "çorba", "yağmur", "duman", "sigara", "askı", "sıra", "tahta",
  "tahıl", "yazı", "sözcük", "cümle", "doktor", "hasta", "ofis", "sabah", "akşam", "gece",
  "yıldız", "asker", "silah", "barış", "savaş", "kaygı", "sorun", "çözüm", "macera", "ödül",
  "ceza", "suçlu", "yargıç", "kanun", "adalet", "merhamet", "vicdan", "hukuk", "toplum", "insan",
  "köprü", "yanak", "dudak", "burun", "göz", "kulak", "parmak", "bacak", "ayak", "kafa"
];

// Kelimelerden rastgele bir tanesini seçer
function getRandomWordleWord() {
  const randomIndex = Math.floor(Math.random() * WORDLE_WORDS.length);
  return WORDLE_WORDS[randomIndex];
}

// Kelimenin listede olup olmadığını kontrol eder
function isValidWordleWord(word) {
  return WORDLE_WORDS.includes(word.toLowerCase());
}