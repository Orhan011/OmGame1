/**
 * Wordle Kelime Listesi
 * 5 harfli Türkçe kelimeler içerir
 * Versiyon: 1.2
 */

const WORDLE_WORDS = [
  // Türkçe 5 harfli kelimeler - Temel set
  "kalem", "kitap", "masa", "sanık", "kapak", "cevap", "sınav", "masal", "roman", "köpek",
  "kedi", "insan", "tarih", "duvar", "radyo", "bilgi", "sayfa", "uyku", "para", "resim",
  "oyun", "yazar", "müzik", "haber", "güneş", "çiçek", "deniz", "nehir", "araba", "okul",
  "proje", "hayat", "çocuk", "sevgi", "yemek", "kalp", "bilet", "hesap", "telefon", "süreç",
  "gelin", "damat", "dünya", "bulut", "gömlek", "hızlı", "balık", "kuşak", "müdür", "kumaş",
  "toplu", "yaşam", "özgür", "iklim", "değer", "vatan", "sebze", "meyve", "kapı", "çanta",
  "sıcak", "soğuk", "kurak", "yağış", "bahçe", "sokak", "talep", "sayaç", "kural", "banka",
  "fırın", "kabuk", "kukla", "makas", "şehir", "başak", "hayal", "hatıra", "düşman", "dost",
  "devir", "duygu", "uçak", "tren", "otobüs", "damla", "temel", "salça", "tepsi", "tabak",
  "kaşık", "çatal", "bıçak", "bebek", "ayna", "bardak", "fincan", "sehpa", "dolap", "halı",
  
  // Genişletilmiş Türkçe Kelime Seti
  "abide", "abiye", "adres", "afili", "afyon", "agora", "ahmak", "ahlak", "ahşap", "akçıl",
  "akıcı", "akide", "aktif", "alarm", "albüm", "alçak", "algın", "alıcı", "alkan", "alkış",
  "almak", "altın", "altlı", "amber", "anket", "anlam", "anmak", "antik", "aptal", "araba",
  "ardıç", "arife", "arkadaş", "armut", "artık", "asabi", "asker", "aslan", "astar", "atlas",
  "atmak", "avize", "avunç", "ayran", "azgın", "azınlık", "azrail", "badem", "baget", "bagaj",
  "bahçe", "bahar", "bahis", "bakım", "balık", "balkon", "bando", "banyo", "baret", "barem",
  "bariz", "barkod", "basın", "basmak", "başak", "başarı", "batık", "batıl", "bavul", "bayat",
  "baygın", "bedel", "bedevi", "belge", "belki", "bellek", "beraat", "berat", "berber", "beton",
  "beyaz", "beyin", "bezgin", "biber", "biçim", "bilek", "bilgi", "bilet", "bilye", "binek",
  "binyıl", "bisküvi", "bitki", "bizon", "bloke", "bomba", "bordo", "boşluk", "botanik", "boyun",
  "boyut", "bölge", "bölüm", "bronz", "buğday", "buket", "bulgu", "bulut", "burak", "burçak",
  "burgaç", "burhan", "burun", "bülten", "büvet", "büyük", "canan", "canlı", "cazibe", "cebir",
  "celep", "celse", "cemre", "cenin", "cephe", "cetvel", "cevap", "ceviz", "cezve", "cıvık",
  "ciddi", "cilve", "cimri", "cinnet", "cisim", "cömert", "cuma", "cüret", "çadır", "çağrı",
  "çakıl", "çalım", "çalış", "çamaşır", "çanak", "çanta", "çapak", "çapraz", "çapul", "çarşı",
  "çatal", "çatlak", "çavuş", "çayır", "çehre", "çekül", "çelik", "çeltik", "çemen", "çengelköy",
  "çetin", "çevik", "çiçek", "çimento", "çirkin", "çoban", "çocuk", "çoğul", "çomak", "çöküş",
  "çözüm", "çubuk", "çukur", "damak", "damar", "damla", "davul", "dayan", "dayı", "dekan",
  "dekor", "demet", "denim", "depo", "derbi", "derin", "dernek", "desen", "devir", "devlet",
  "deyim", "dilek", "dinar", "diyar", "doğru", "dolgu", "dolma", "dorse", "dosya", "döküm",
  "dökün", "dönem", "dörtlü", "duman", "dumur", "durak", "durum", "duvar", "düğün", "dünya",
  "düzen", "ekmek", "ekran", "ekmek", "elçi", "elden", "eldiven", "elin", "emek", "ender",
  "engel", "engin", "ensor", "entari", "erek", "ergen", "erimek", "erkek", "erkin", "eroin",
  "esnaf", "esnek", "espri", "eşarp", "etkin", "etraf", "evlat", "evren", "eylem", "eyvan",
  "fakat", "fakir", "falan", "falcı", "fanila", "fanta", "fasıl", "fatih", "fayda", "fazla",
  "fener", "fesih", "fevri", "fırın", "fikir", "final", "fiyat", "fizik", "flama", "folyo",
  "forum", "fosil", "frenk", "fütur", "fütür", "gacır", "gaddar", "galip", "garip", "gazete",
  "gazoz", "gebeş", "gelin", "gemi", "genel", "gerçek", "getto", "gıcık", "gider", "gizli",
  "gocuk", "göçük", "göden", "gökçe", "gönül", "görev", "gözde", "granit", "guguk", "gülüş",
  "gümüş", "günah", "güneş", "haberci", "hadis", "hafız", "hafta", "hakem", "halat", "halk",
  "hamal", "hamur", "hande", "harap", "harem", "hasta", "hatun", "havale", "havlu", "havuz",
  "hayal", "hazım", "hazır", "hedef", "helva", "henüz", "hesap", "heves", "hızlı", "hiddet",
  "hikâye", "hilal", "hilat", "hile", "hileci", "hizip", "hoca", "horon", "horoz", "hoşçakal",
  "höyük", "hudut", "hulul", "hurma", "husuf", "huzur", "hüküm", "hüner", "hüzün", "ihale",
  "ihmal", "ihtar", "ihvan", "ihya", "ikbal", "ikili", "ikinci", "iklim", "ikrar", "iktidar",
  "ilacı", "ilahi", "ilan", "ilave", "ilham", "ilkel", "ilkin", "illet", "ilmek", "ilmik",
  "imdat", "imkan", "imtihan", "imza", "inanç", "ingin", "inkâr", "insan", "inşa", "iplik",
  "irmik", "ironi", "ishal", "isim", "iskân", "istek", "işgal", "işlem", "işlik", "işmar",
  "işte", "işve", "itaat", "itici", "itmek", "itina", "izlek", "izlem", "izmir"
];

/**
 * Kelimelerden rastgele bir tanesini seçer
 * Öğrenme modunda daha basit kelimeleri seçer
 */
function getRandomWordleWord() {
  try {
    // Öğrenme modu aktif mi kontrol et
    const learningMode = localStorage.getItem('wordleLearningMode') === 'true';
    
    // Öğrenme modunda sadece temel kelimeleri kullan
    const wordPool = learningMode ? WORDLE_WORDS.slice(0, 100) : WORDLE_WORDS;
    
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    return wordPool[randomIndex];
  } catch (error) {
    console.error("Rastgele kelime seçilirken hata oluştu:", error);
    // Hata durumunda basit bir kelime döndür
    return WORDLE_WORDS[0];
  }
}

/**
 * Kelimenin listede olup olmadığını kontrol eder
 */
function isValidWordleWord(word) {
  try {
    return WORDLE_WORDS.includes(word.toLowerCase());
  } catch (error) {
    console.error("Kelime kontrolü yapılırken hata oluştu:", error);
    return false;
  }
}

/**
 * Belirli uzunlukta kelimeleri filtreler
 */
function getWordsByLength(length) {
  try {
    return WORDLE_WORDS.filter(word => word.length === length);
  } catch (error) {
    console.error("Kelimeler filtrelenirken hata oluştu:", error);
    return [];
  }
}