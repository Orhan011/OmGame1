// Kelime veritabanı
const wordDatabase = {
  A1: [
    // Mevcut kelimeler
    { word: "book", meaning: "kitap", options: ["kitap", "masa", "kalem", "araba"] },
    { word: "house", meaning: "ev", options: ["bina", "ev", "apartman", "okul"] },
    { word: "car", meaning: "araba", options: ["araba", "bisiklet", "uçak", "tren"] },
    { word: "dog", meaning: "köpek", options: ["kedi", "köpek", "kuş", "balık"] },
    { word: "water", meaning: "su", options: ["su", "çay", "kahve", "süt"] },
    { word: "friend", meaning: "arkadaş", options: ["arkadaş", "aile", "kardeş", "komşu"] },
    { word: "school", meaning: "okul", options: ["okul", "hastane", "market", "park"] },
    { word: "family", meaning: "aile", options: ["aile", "arkadaş", "öğretmen", "doktor"] },
    { word: "apple", meaning: "elma", options: ["elma", "muz", "portakal", "çilek"] },
    { word: "bread", meaning: "ekmek", options: ["ekmek", "peynir", "et", "yumurta"] },
    // Yeni A1 kelimeleri
    { word: "hello", meaning: "merhaba", options: ["merhaba", "hoşçakal", "teşekkürler", "özür dilerim"] },
    { word: "goodbye", meaning: "hoşçakal", options: ["merhaba", "hoşçakal", "teşekkürler", "özür dilerim"] },
    { word: "yes", meaning: "evet", options: ["evet", "hayır", "belki", "tamam"] },
    { word: "no", meaning: "hayır", options: ["evet", "hayır", "belki", "tamam"] },
    { word: "please", meaning: "lütfen", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] },
    { word: "thank you", meaning: "teşekkürler", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] },
    { word: "sorry", meaning: "özür dilerim", options: ["lütfen", "teşekkürler", "özür dilerim", "rica ederim"] },
    { word: "man", meaning: "adam", options: ["adam", "kadın", "çocuk", "bebek"] },
    { word: "woman", meaning: "kadın", options: ["adam", "kadın", "çocuk", "bebek"] },
    { word: "child", meaning: "çocuk", options: ["adam", "kadın", "çocuk", "bebek"] },
    { word: "boy", meaning: "erkek çocuk", options: ["erkek çocuk", "kız çocuk", "adam", "kadın"] },
    { word: "girl", meaning: "kız çocuk", options: ["erkek çocuk", "kız çocuk", "adam", "kadın"] },
    { word: "baby", meaning: "bebek", options: ["bebek", "çocuk", "genç", "yaşlı"] },
    { word: "one", meaning: "bir", options: ["bir", "iki", "üç", "dört"] },
    { word: "two", meaning: "iki", options: ["bir", "iki", "üç", "dört"] },
    { word: "three", meaning: "üç", options: ["bir", "iki", "üç", "dört"] },
    { word: "four", meaning: "dört", options: ["bir", "iki", "üç", "dört"] },
    { word: "five", meaning: "beş", options: ["beş", "altı", "yedi", "sekiz"] },
    { word: "ten", meaning: "on", options: ["on", "yirmi", "otuz", "kırk"] },
    { word: "hundred", meaning: "yüz", options: ["on", "yüz", "bin", "milyon"] },
    { word: "thousand", meaning: "bin", options: ["yüz", "bin", "milyon", "milyar"] },
    { word: "red", meaning: "kırmızı", options: ["kırmızı", "mavi", "yeşil", "sarı"] },
    { word: "blue", meaning: "mavi", options: ["kırmızı", "mavi", "yeşil", "sarı"] },
    { word: "green", meaning: "yeşil", options: ["kırmızı", "mavi", "yeşil", "sarı"] },
    { word: "yellow", meaning: "sarı", options: ["kırmızı", "mavi", "yeşil", "sarı"] },
    { word: "black", meaning: "siyah", options: ["siyah", "beyaz", "gri", "kahverengi"] },
    { word: "white", meaning: "beyaz", options: ["siyah", "beyaz", "gri", "kahverengi"] },
    { word: "big", meaning: "büyük", options: ["büyük", "küçük", "uzun", "kısa"] },
    { word: "small", meaning: "küçük", options: ["büyük", "küçük", "uzun", "kısa"] },
    { word: "hot", meaning: "sıcak", options: ["sıcak", "soğuk", "ılık", "serin"] },
    { word: "cold", meaning: "soğuk", options: ["sıcak", "soğuk", "ılık", "serin"] },
    { word: "good", meaning: "iyi", options: ["iyi", "kötü", "güzel", "çirkin"] },
    { word: "bad", meaning: "kötü", options: ["iyi", "kötü", "güzel", "çirkin"] },
    { word: "day", meaning: "gün", options: ["gün", "hafta", "ay", "yıl"] },
    { word: "week", meaning: "hafta", options: ["gün", "hafta", "ay", "yıl"] },
    { word: "month", meaning: "ay", options: ["gün", "hafta", "ay", "yıl"] },
    { word: "year", meaning: "yıl", options: ["gün", "hafta", "ay", "yıl"] },
    { word: "today", meaning: "bugün", options: ["bugün", "dün", "yarın", "şimdi"] },
    { word: "yesterday", meaning: "dün", options: ["bugün", "dün", "yarın", "şimdi"] },
    { word: "tomorrow", meaning: "yarın", options: ["bugün", "dün", "yarın", "şimdi"] },
    { word: "now", meaning: "şimdi", options: ["bugün", "dün", "yarın", "şimdi"] },
    { word: "here", meaning: "burada", options: ["burada", "orada", "nerede", "her yerde"] },
    { word: "there", meaning: "orada", options: ["burada", "orada", "nerede", "her yerde"] },
    { word: "where", meaning: "nerede", options: ["burada", "orada", "nerede", "her yerde"] },
    { word: "who", meaning: "kim", options: ["kim", "ne", "neden", "nasıl"] },
    { word: "what", meaning: "ne", options: ["kim", "ne", "neden", "nasıl"] },
    { word: "why", meaning: "neden", options: ["kim", "ne", "neden", "nasıl"] },
    { word: "how", meaning: "nasıl", options: ["kim", "ne", "neden", "nasıl"] },
    { word: "and", meaning: "ve", options: ["ve", "veya", "ama", "çünkü"] },
    { word: "or", meaning: "veya", options: ["ve", "veya", "ama", "çünkü"] },
    { word: "but", meaning: "ama", options: ["ve", "veya", "ama", "çünkü"] },
    { word: "because", meaning: "çünkü", options: ["ve", "veya", "ama", "çünkü"] },
    { word: "name", meaning: "isim", options: ["isim", "yaş", "adres", "telefon"] },
    { word: "age", meaning: "yaş", options: ["isim", "yaş", "adres", "telefon"] },
    { word: "address", meaning: "adres", options: ["isim", "yaş", "adres", "telefon"] },
    { word: "phone", meaning: "telefon", options: ["isim", "yaş", "adres", "telefon"] },
    { word: "time", meaning: "zaman", options: ["zaman", "saat", "dakika", "saniye"] },
    { word: "hour", meaning: "saat", options: ["zaman", "saat", "dakika", "saniye"] },
    { word: "minute", meaning: "dakika", options: ["zaman", "saat", "dakika", "saniye"] },
    { word: "second", meaning: "saniye", options: ["zaman", "saat", "dakika", "saniye"] },
    { word: "morning", meaning: "sabah", options: ["sabah", "öğle", "akşam", "gece"] },
    { word: "noon", meaning: "öğle", options: ["sabah", "öğle", "akşam", "gece"] },
    { word: "evening", meaning: "akşam", options: ["sabah", "öğle", "akşam", "gece"] },
    { word: "night", meaning: "gece", options: ["sabah", "öğle", "akşam", "gece"] },
    { word: "Monday", meaning: "Pazartesi", options: ["Pazartesi", "Salı", "Çarşamba", "Perşembe"] },
    { word: "Tuesday", meaning: "Salı", options: ["Pazartesi", "Salı", "Çarşamba", "Perşembe"] },
    { word: "Wednesday", meaning: "Çarşamba", options: ["Pazartesi", "Salı", "Çarşamba", "Perşembe"] },
    { word: "Thursday", meaning: "Perşembe", options: ["Pazartesi", "Salı", "Çarşamba", "Perşembe"] },
    { word: "Friday", meaning: "Cuma", options: ["Cuma", "Cumartesi", "Pazar", "Pazartesi"] },
    { word: "Saturday", meaning: "Cumartesi", options: ["Cuma", "Cumartesi", "Pazar", "Pazartesi"] },
    { word: "Sunday", meaning: "Pazar", options: ["Cuma", "Cumartesi", "Pazar", "Pazartesi"] },
    { word: "January", meaning: "Ocak", options: ["Ocak", "Şubat", "Mart", "Nisan"] },
    { word: "February", meaning: "Şubat", options: ["Ocak", "Şubat", "Mart", "Nisan"] },
    { word: "March", meaning: "Mart", options: ["Ocak", "Şubat", "Mart", "Nisan"] },
    { word: "April", meaning: "Nisan", options: ["Ocak", "Şubat", "Mart", "Nisan"] },
    { word: "May", meaning: "Mayıs", options: ["Mayıs", "Haziran", "Temmuz", "Ağustos"] },
    { word: "June", meaning: "Haziran", options: ["Mayıs", "Haziran", "Temmuz", "Ağustos"] },
    { word: "July", meaning: "Temmuz", options: ["Mayıs", "Haziran", "Temmuz", "Ağustos"] },
    { word: "August", meaning: "Ağustos", options: ["Mayıs", "Haziran", "Temmuz", "Ağustos"] },
    { word: "September", meaning: "Eylül", options: ["Eylül", "Ekim", "Kasım", "Aralık"] },
    { word: "October", meaning: "Ekim", options: ["Eylül", "Ekim", "Kasım", "Aralık"] },
    { word: "November", meaning: "Kasım", options: ["Eylül", "Ekim", "Kasım", "Aralık"] },
    { word: "December", meaning: "Aralık", options: ["Eylül", "Ekim", "Kasım", "Aralık"] },
    { word: "food", meaning: "yiyecek", options: ["yiyecek", "içecek", "yemek", "içmek"] },
    { word: "drink", meaning: "içecek", options: ["yiyecek", "içecek", "yemek", "içmek"] },
    { word: "eat", meaning: "yemek", options: ["yiyecek", "içecek", "yemek", "içmek"] },
    { word: "milk", meaning: "süt", options: ["süt", "su", "çay", "kahve"] },
    { word: "coffee", meaning: "kahve", options: ["süt", "su", "çay", "kahve"] },
    { word: "tea", meaning: "çay", options: ["süt", "su", "çay", "kahve"] },
    { word: "juice", meaning: "meyve suyu", options: ["meyve suyu", "su", "süt", "çay"] },
    { word: "meat", meaning: "et", options: ["et", "tavuk", "balık", "sebze"] },
    { word: "chicken", meaning: "tavuk", options: ["et", "tavuk", "balık", "sebze"] },
    { word: "fish", meaning: "balık", options: ["et", "tavuk", "balık", "sebze"] },
    { word: "vegetable", meaning: "sebze", options: ["et", "tavuk", "balık", "sebze"] },
    { word: "fruit", meaning: "meyve", options: ["meyve", "sebze", "et", "ekmek"] },
    { word: "banana", meaning: "muz", options: ["elma", "muz", "portakal", "üzüm"] },
    { word: "orange", meaning: "portakal", options: ["elma", "muz", "portakal", "üzüm"] },
    { word: "grape", meaning: "üzüm", options: ["elma", "muz", "portakal", "üzüm"] },
    { word: "tomato", meaning: "domates", options: ["domates", "patates", "soğan", "biber"] },
    { word: "potato", meaning: "patates", options: ["domates", "patates", "soğan", "biber"] },
    { word: "onion", meaning: "soğan", options: ["domates", "patates", "soğan", "biber"] },
    { word: "pepper", meaning: "biber", options: ["domates", "patates", "soğan", "biber"] },
    { word: "salt", meaning: "tuz", options: ["tuz", "şeker", "biber", "yağ"] },
    { word: "sugar", meaning: "şeker", options: ["tuz", "şeker", "biber", "yağ"] },
    { word: "oil", meaning: "yağ", options: ["tuz", "şeker", "biber", "yağ"] },
    { word: "breakfast", meaning: "kahvaltı", options: ["kahvaltı", "öğle yemeği", "akşam yemeği", "atıştırmalık"] },
    { word: "lunch", meaning: "öğle yemeği", options: ["kahvaltı", "öğle yemeği", "akşam yemeği", "atıştırmalık"] },
    { word: "dinner", meaning: "akşam yemeği", options: ["kahvaltı", "öğle yemeği", "akşam yemeği", "atıştırmalık"] },
    { word: "snack", meaning: "atıştırmalık", options: ["kahvaltı", "öğle yemeği", "akşam yemeği", "atıştırmalık"] },
    { word: "home", meaning: "ev", options: ["ev", "okul", "iş", "hastane"] },
    { word: "work", meaning: "iş", options: ["ev", "okul", "iş", "hastane"] },
    { word: "hospital", meaning: "hastane", options: ["ev", "okul", "iş", "hastane"] },
    { word: "door", meaning: "kapı", options: ["kapı", "pencere", "duvar", "tavan"] },
    { word: "window", meaning: "pencere", options: ["kapı", "pencere", "duvar", "tavan"] },
    { word: "wall", meaning: "duvar", options: ["kapı", "pencere", "duvar", "tavan"] },
    { word: "floor", meaning: "zemin", options: ["zemin", "tavan", "duvar", "merdiven"] },
    { word: "ceiling", meaning: "tavan", options: ["zemin", "tavan", "duvar", "merdiven"] },
    { word: "room", meaning: "oda", options: ["oda", "salon", "mutfak", "banyo"] },
    { word: "bedroom", meaning: "yatak odası", options: ["yatak odası", "oturma odası", "mutfak", "banyo"] },
    { word: "bathroom", meaning: "banyo", options: ["yatak odası", "oturma odası", "mutfak", "banyo"] },
    { word: "kitchen", meaning: "mutfak", options: ["yatak odası", "oturma odası", "mutfak", "banyo"] },
    { word: "living room", meaning: "oturma odası", options: ["yatak odası", "oturma odası", "mutfak", "banyo"] },
    { word: "key", meaning: "anahtar", options: ["anahtar", "kilit", "kapı", "pencere"] },
    { word: "lock", meaning: "kilit", options: ["anahtar", "kilit", "kapı", "pencere"] },
    { word: "open", meaning: "açık", options: ["açık", "kapalı", "açmak", "kapamak"] },
    { word: "closed", meaning: "kapalı", options: ["açık", "kapalı", "açmak", "kapamak"] },
    { word: "city", meaning: "şehir", options: ["şehir", "köy", "ülke", "kıta"] },
    { word: "village", meaning: "köy", options: ["şehir", "köy", "ülke", "kıta"] },
    { word: "country", meaning: "ülke", options: ["şehir", "köy", "ülke", "kıta"] },
    { word: "road", meaning: "yol", options: ["yol", "sokak", "cadde", "otoyol"] },
    { word: "street", meaning: "sokak", options: ["yol", "sokak", "cadde", "otoyol"] },
    { word: "bus", meaning: "otobüs", options: ["otobüs", "tren", "taksi", "uçak"] },
    { word: "train", meaning: "tren", options: ["otobüs", "tren", "taksi", "uçak"] },
    { word: "taxi", meaning: "taksi", options: ["otobüs", "tren", "taksi", "uçak"] },
    { word: "airplane", meaning: "uçak", options: ["otobüs", "tren", "taksi", "uçak"] },
    { word: "bicycle", meaning: "bisiklet", options: ["bisiklet", "motosiklet", "araba", "otobüs"] },
    { word: "motorcycle", meaning: "motosiklet", options: ["bisiklet", "motosiklet", "araba", "otobüs"] },
    { word: "driver", meaning: "sürücü", options: ["sürücü", "yolcu", "pilot", "host"] },
    { word: "passenger", meaning: "yolcu", options: ["sürücü", "yolcu", "pilot", "host"] }
  ],
  A2: [
    // Mevcut kelimeler
    { word: "happy", meaning: "mutlu", options: ["mutlu", "üzgün", "kızgın", "şaşkın"] },
    { word: "difficult", meaning: "zor", options: ["kolay", "zor", "basit", "karmaşık"] },
    { word: "beautiful", meaning: "güzel", options: ["güzel", "çirkin", "orta", "mükemmel"] },
    { word: "important", meaning: "önemli", options: ["önemli", "önemsiz", "gerekli", "gereksiz"] },
    { word: "interesting", meaning: "ilginç", options: ["ilginç", "sıkıcı", "eğlenceli", "üzücü"] },
    { word: "restaurant", meaning: "restoran", options: ["kafe", "restoran", "market", "mağaza"] },
    { word: "weather", meaning: "hava durumu", options: ["mevsim", "hava durumu", "sıcaklık", "nem"] },
    { word: "vacation", meaning: "tatil", options: ["iş", "tatil", "toplantı", "eğitim"] },
    { word: "weekend", meaning: "hafta sonu", options: ["hafta içi", "hafta sonu", "pazartesi", "cuma"] },
    { word: "language", meaning: "dil", options: ["kelime", "cümle", "dil", "konuşma"] },
    // Yeni A2 kelimeleri (150+ kelime için daha eklenecek)
    { word: "accept", meaning: "kabul etmek", options: ["kabul etmek", "reddetmek", "anlamak", "onaylamak"] },
    { word: "refuse", meaning: "reddetmek", options: ["kabul etmek", "reddetmek", "anlamak", "onaylamak"] },
    { word: "understand", meaning: "anlamak", options: ["kabul etmek", "reddetmek", "anlamak", "onaylamak"] },
    { word: "approve", meaning: "onaylamak", options: ["kabul etmek", "reddetmek", "anlamak", "onaylamak"] },
    { word: "argue", meaning: "tartışmak", options: ["tartışmak", "konuşmak", "anlaşmak", "dinlemek"] },
    { word: "talk", meaning: "konuşmak", options: ["tartışmak", "konuşmak", "anlaşmak", "dinlemek"] },
    { word: "agree", meaning: "anlaşmak", options: ["tartışmak", "konuşmak", "anlaşmak", "dinlemek"] },
    { word: "listen", meaning: "dinlemek", options: ["tartışmak", "konuşmak", "anlaşmak", "dinlemek"] },
    { word: "ask", meaning: "sormak", options: ["sormak", "cevaplamak", "söylemek", "anlatmak"] },
    { word: "answer", meaning: "cevaplamak", options: ["sormak", "cevaplamak", "söylemek", "anlatmak"] },
    { word: "tell", meaning: "söylemek", options: ["sormak", "cevaplamak", "söylemek", "anlatmak"] },
    { word: "describe", meaning: "anlatmak", options: ["sormak", "cevaplamak", "söylemek", "anlatmak"] },
    { word: "begin", meaning: "başlamak", options: ["başlamak", "bitirmek", "devam etmek", "durdurmak"] },
    { word: "finish", meaning: "bitirmek", options: ["başlamak", "bitirmek", "devam etmek", "durdurmak"] },
    { word: "continue", meaning: "devam etmek", options: ["başlamak", "bitirmek", "devam etmek", "durdurmak"] },
    { word: "stop", meaning: "durdurmak", options: ["başlamak", "bitirmek", "devam etmek", "durdurmak"] },
    { word: "borrow", meaning: "ödünç almak", options: ["ödünç almak", "ödünç vermek", "satın almak", "satmak"] },
    { word: "lend", meaning: "ödünç vermek", options: ["ödünç almak", "ödünç vermek", "satın almak", "satmak"] },
    { word: "buy", meaning: "satın almak", options: ["ödünç almak", "ödünç vermek", "satın almak", "satmak"] },
    { word: "sell", meaning: "satmak", options: ["ödünç almak", "ödünç vermek", "satın almak", "satmak"] },
    { word: "build", meaning: "inşa etmek", options: ["inşa etmek", "yıkmak", "tamir etmek", "tasarlamak"] },
    { word: "destroy", meaning: "yıkmak", options: ["inşa etmek", "yıkmak", "tamir etmek", "tasarlamak"] },
    { word: "repair", meaning: "tamir etmek", options: ["inşa etmek", "yıkmak", "tamir etmek", "tasarlamak"] },
    { word: "design", meaning: "tasarlamak", options: ["inşa etmek", "yıkmak", "tamir etmek", "tasarlamak"] },
    { word: "call", meaning: "aramak", options: ["aramak", "mesaj göndermek", "e-posta göndermek", "ziyaret etmek"] },
    { word: "message", meaning: "mesaj göndermek", options: ["aramak", "mesaj göndermek", "e-posta göndermek", "ziyaret etmek"] },
    { word: "email", meaning: "e-posta göndermek", options: ["aramak", "mesaj göndermek", "e-posta göndermek", "ziyaret etmek"] },
    { word: "visit", meaning: "ziyaret etmek", options: ["aramak", "mesaj göndermek", "e-posta göndermek", "ziyaret etmek"] },
    { word: "carry", meaning: "taşımak", options: ["taşımak", "bırakmak", "kaldırmak", "indirmek"] },
    { word: "drop", meaning: "bırakmak", options: ["taşımak", "bırakmak", "kaldırmak", "indirmek"] },
    { word: "lift", meaning: "kaldırmak", options: ["taşımak", "bırakmak", "kaldırmak", "indirmek"] },
    { word: "lower", meaning: "indirmek", options: ["taşımak", "bırakmak", "kaldırmak", "indirmek"] },
    { word: "change", meaning: "değiştirmek", options: ["değiştirmek", "düzeltmek", "geliştirmek", "bozmak"] },
    { word: "fix", meaning: "düzeltmek", options: ["değiştirmek", "düzeltmek", "geliştirmek", "bozmak"] },
    { word: "improve", meaning: "geliştirmek", options: ["değiştirmek", "düzeltmek", "geliştirmek", "bozmak"] },
    { word: "break", meaning: "bozmak", options: ["değiştirmek", "düzeltmek", "geliştirmek", "bozmak"] },
    { word: "choose", meaning: "seçmek", options: ["seçmek", "tercih etmek", "belirlemek", "kararlaştırmak"] },
    { word: "prefer", meaning: "tercih etmek", options: ["seçmek", "tercih etmek", "belirlemek", "kararlaştırmak"] },
    { word: "determine", meaning: "belirlemek", options: ["seçmek", "tercih etmek", "belirlemek", "kararlaştırmak"] },
    { word: "decide", meaning: "kararlaştırmak", options: ["seçmek", "tercih etmek", "belirlemek", "kararlaştırmak"] },
    { word: "clean", meaning: "temizlemek", options: ["temizlemek", "kirletmek", "düzenlemek", "dağıtmak"] },
    { word: "dirty", meaning: "kirletmek", options: ["temizlemek", "kirletmek", "düzenlemek", "dağıtmak"] },
    { word: "organize", meaning: "düzenlemek", options: ["temizlemek", "kirletmek", "düzenlemek", "dağıtmak"] },
    { word: "mess up", meaning: "dağıtmak", options: ["temizlemek", "kirletmek", "düzenlemek", "dağıtmak"] },
    { word: "collect", meaning: "toplamak", options: ["toplamak", "dağıtmak", "biriktirmek", "harcamak"] },
    { word: "distribute", meaning: "dağıtmak", options: ["toplamak", "dağıtmak", "biriktirmek", "harcamak"] },
    { word: "save", meaning: "biriktirmek", options: ["toplamak", "dağıtmak", "biriktirmek", "harcamak"] },
    { word: "spend", meaning: "harcamak", options: ["toplamak", "dağıtmak", "biriktirmek", "harcamak"] },
    { word: "cook", meaning: "pişirmek", options: ["pişirmek", "hazırlamak", "servis etmek", "tatmak"] },
    { word: "prepare", meaning: "hazırlamak", options: ["pişirmek", "hazırlamak", "servis etmek", "tatmak"] },
    { word: "serve", meaning: "servis etmek", options: ["pişirmek", "hazırlamak", "servis etmek", "tatmak"] },
    { word: "taste", meaning: "tatmak", options: ["pişirmek", "hazırlamak", "servis etmek", "tatmak"] },
    { word: "cover", meaning: "örtmek", options: ["örtmek", "açmak", "gizlemek", "göstermek"] },
    { word: "uncover", meaning: "açmak", options: ["örtmek", "açmak", "gizlemek", "göstermek"] },
    { word: "hide", meaning: "gizlemek", options: ["örtmek", "açmak", "gizlemek", "göstermek"] },
    { word: "show", meaning: "göstermek", options: ["örtmek", "açmak", "gizlemek", "göstermek"] },
    { word: "create", meaning: "yaratmak", options: ["yaratmak", "üretmek", "geliştirmek", "yok etmek"] },
    { word: "produce", meaning: "üretmek", options: ["yaratmak", "üretmek", "geliştirmek", "yok etmek"] },
    { word: "develop", meaning: "geliştirmek", options: ["yaratmak", "üretmek", "geliştirmek", "yok etmek"] },
    { word: "destroy", meaning: "yok etmek", options: ["yaratmak", "üretmek", "geliştirmek", "yok etmek"] },
    { word: "cry", meaning: "ağlamak", options: ["ağlamak", "gülmek", "bağırmak", "fısıldamak"] },
    { word: "laugh", meaning: "gülmek", options: ["ağlamak", "gülmek", "bağırmak", "fısıldamak"] },
    { word: "shout", meaning: "bağırmak", options: ["ağlamak", "gülmek", "bağırmak", "fısıldamak"] },
    { word: "whisper", meaning: "fısıldamak", options: ["ağlamak", "gülmek", "bağırmak", "fısıldamak"] }
    // Daha fazla A2 kelimesi eklenebilir (toplam 150+ olacak şekilde)
  ],
  B1: [
    // Mevcut kelimeler
    { word: "achievement", meaning: "başarı", options: ["başarı", "başarısızlık", "deneme", "hedef"] },
    { word: "environment", meaning: "çevre", options: ["dünya", "çevre", "doğa", "iklim"] },
    { word: "experience", meaning: "deneyim", options: ["deneyim", "bilgi", "eğitim", "tecrübe"] },
    { word: "opportunity", meaning: "fırsat", options: ["fırsat", "şans", "olasılık", "imkan"] },
    { word: "relationship", meaning: "ilişki", options: ["ilişki", "arkadaşlık", "evlilik", "bağ"] },
    { word: "technology", meaning: "teknoloji", options: ["bilim", "teknoloji", "inovasyon", "gelişim"] },
    { word: "necessary", meaning: "gerekli", options: ["gerekli", "gereksiz", "önemli", "faydalı"] },
    { word: "responsible", meaning: "sorumlu", options: ["sorumlu", "sorumsuz", "dikkatli", "özgür"] },
    { word: "attitude", meaning: "tutum", options: ["tutum", "davranış", "düşünce", "duygu"] },
    { word: "decision", meaning: "karar", options: ["karar", "seçim", "fikir", "düşünce"] },
    // Yeni B1 kelimeleri (150+ kelime ekleniyor)
    { word: "abandon", meaning: "terk etmek", options: ["terk etmek", "bırakmak", "vazgeçmek", "ayrılmak"] },
    { word: "abolish", meaning: "kaldırmak", options: ["kaldırmak", "yasaklamak", "engellemek", "değiştirmek"] },
    { word: "absence", meaning: "yokluk", options: ["yokluk", "varlık", "eksiklik", "boşluk"] },
    { word: "absorb", meaning: "emmek", options: ["emmek", "soğurmak", "içine çekmek", "sindirmek"] },
    { word: "abstract", meaning: "soyut", options: ["soyut", "somut", "karmaşık", "basit"] },
    { word: "abundant", meaning: "bol", options: ["bol", "kıt", "yeterli", "sınırlı"] },
    { word: "abuse", meaning: "istismar etmek", options: ["istismar etmek", "kötüye kullanmak", "zarar vermek", "incitmek"] },
    { word: "academic", meaning: "akademik", options: ["akademik", "eğitimsel", "bilimsel", "öğretimsel"] },
    { word: "accelerate", meaning: "hızlandırmak", options: ["hızlandırmak", "yavaşlatmak", "artırmak", "azaltmak"] },
    { word: "accessible", meaning: "erişilebilir", options: ["erişilebilir", "ulaşılabilir", "mevcut", "açık"] },
    { word: "accommodate", meaning: "barındırmak", options: ["barındırmak", "ağırlamak", "sığdırmak", "yerleştirmek"] },
    { word: "accomplishment", meaning: "başarı", options: ["başarı", "kazanım", "sonuç", "ödül"] },
    { word: "accountable", meaning: "sorumlu", options: ["sorumlu", "mesul", "yükümlü", "görevli"] },
    { word: "accumulate", meaning: "biriktirmek", options: ["biriktirmek", "toplamak", "yığmak", "artırmak"] },
    { word: "accurate", meaning: "doğru", options: ["doğru", "kesin", "tam", "hatasız"] },
    { word: "acquire", meaning: "edinmek", options: ["edinmek", "kazanmak", "elde etmek", "sahip olmak"] },
    { word: "adapt", meaning: "uyum sağlamak", options: ["uyum sağlamak", "alışmak", "değiştirmek", "düzenlemek"] },
    { word: "adequate", meaning: "yeterli", options: ["yeterli", "uygun", "münasip", "elverişli"] },
    { word: "adjacent", meaning: "bitişik", options: ["bitişik", "komşu", "yakın", "yan"] },
    { word: "adjust", meaning: "ayarlamak", options: ["ayarlamak", "düzenlemek", "uyarlamak", "değiştirmek"] },
    // Daha fazla B1 kelimesi eklenebilir (toplam 150+ olacak şekilde)
  ],
  B2: [
    // Mevcut kelimeler
    { word: "accomplish", meaning: "başarmak", options: ["başarmak", "denemek", "çalışmak", "planlamak"] },
    { word: "consideration", meaning: "düşünce", options: ["düşünce", "fikir", "öneri", "tavsiye"] },
    { word: "consequence", meaning: "sonuç", options: ["sonuç", "etki", "neden", "durum"] },
    { word: "significant", meaning: "önemli", options: ["önemli", "büyük", "küçük", "orta"] },
    { word: "perspective", meaning: "bakış açısı", options: ["görüş", "bakış açısı", "düşünce", "fikir"] },
    { word: "nevertheless", meaning: "yine de", options: ["yine de", "ancak", "fakat", "ayrıca"] },
    { word: "controversy", meaning: "tartışma", options: ["tartışma", "anlaşma", "uzlaşma", "çatışma"] },
    { word: "anticipate", meaning: "öngörmek", options: ["öngörmek", "beklemek", "tahmin etmek", "düşünmek"] },
    { word: "ultimately", meaning: "sonunda", options: ["sonunda", "başlangıçta", "sürekli", "aniden"] },
    { word: "devastating", meaning: "yıkıcı", options: ["yıkıcı", "üzücü", "zorlayıcı", "şaşırtıcı"] },
    // Yeni B2 kelimeleri (150+ kelime ekleniyor)
    { word: "aberration", meaning: "sapma", options: ["sapma", "bozukluk", "anormallik", "değişim"] },
    { word: "abhorrent", meaning: "iğrenç", options: ["iğrenç", "nefret edilen", "tiksindirici", "korkunç"] },
    { word: "abject", meaning: "sefil", options: ["sefil", "zavallı", "perişan", "acınası"] },
    { word: "abnegate", meaning: "reddetmek", options: ["reddetmek", "inkâr etmek", "vazgeçmek", "feragat etmek"] },
    { word: "abrasive", meaning: "aşındırıcı", options: ["aşındırıcı", "kaba", "sert", "rahatsız edici"] },
    { word: "abrogate", meaning: "feshetmek", options: ["feshetmek", "iptal etmek", "kaldırmak", "yürürlükten kaldırmak"] },
    { word: "abscond", meaning: "kaçmak", options: ["kaçmak", "sıvışmak", "firar etmek", "uzaklaşmak"] },
    { word: "absolution", meaning: "af", options: ["af", "bağışlama", "aklanma", "kurtulma"] },
    { word: "abstain", meaning: "kaçınmak", options: ["kaçınmak", "uzak durmak", "çekinmek", "sakınmak"] },
    { word: "abstruse", meaning: "anlaşılması güç", options: ["anlaşılması güç", "karmaşık", "zor", "belirsiz"] },
    { word: "accolade", meaning: "övgü", options: ["övgü", "takdir", "ödül", "beğeni"] },
    { word: "acerbic", meaning: "keskin", options: ["keskin", "acı", "sert", "ekşi"] },
    { word: "acquiesce", meaning: "boyun eğmek", options: ["boyun eğmek", "kabul etmek", "razı olmak", "teslim olmak"] },
    { word: "acrimonious", meaning: "acı", options: ["acı", "sert", "kızgın", "düşmanca"] },
    { word: "acumen", meaning: "zekâ", options: ["zekâ", "anlayış", "kavrayış", "sezgi"] },
    { word: "adamant", meaning: "kararlı", options: ["kararlı", "ısrarcı", "inatçı", "sabit"] },
    { word: "admonish", meaning: "uyarmak", options: ["uyarmak", "azarlamak", "ikaz etmek", "tenkit etmek"] },
    { word: "adroit", meaning: "becerikli", options: ["becerikli", "yetenekli", "usta", "maharetli"] },
    { word: "adulation", meaning: "yağcılık", options: ["yağcılık", "övgü", "hayranlık", "dalkavukluk"] },
    { word: "adversity", meaning: "zorluk", options: ["zorluk", "sıkıntı", "talihsizlik", "güçlük"] }
    // Daha fazla B2 kelimesi eklenebilir (toplam 150+ olacak şekilde)
  ]
};

// Oyun durumu
let gameState = {
  currentWord: null,
  currentLevel: 'A1',
  score: 110, // Başlangıç puanı
  dailyGoal: 0,
  learnedWords: [],
  currentScreen: 'start-screen',
  unlockedLevels: ['A1'], // Başlangıçta sadece A1 açık
  levelProgress: {
    'A1': 0,
    'A2': 0,
    'B1': 0,
    'B2': 0
  },
  requiredCorrectAnswers: {
    'A1': 50,  // A2'yi açmak için gereken doğru cevap sayısı
    'A2': 100, // B1'i açmak için
    'B1': 150  // B2'yi açmak için
  },
  lastPlayDate: null,
  allLevelsCompleted: false
};

// Speech Recognition API
let recognition = null;
try {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    console.log("Konuşma tanıma API'si başarıyla yüklendi");
  } else {
    console.log("Bu tarayıcı SpeechRecognition API'sini desteklemiyor");
  }
} catch (error) {
  console.error("Konuşma tanıma başlatılırken hata:", error);
}

// Yerel depolama işlemleri
function loadGameState() {
  const savedState = localStorage.getItem('wordQuestState');
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);

      // Doğru veri yapısıyla birleştir, varsayılan değerleri koru
      gameState = {
        ...gameState, 
        ...parsedState,
        // Nesneleri birleştir, değiştirme
        levelProgress: {
          ...gameState.levelProgress,
          ...(parsedState.levelProgress || {})
        },
        requiredCorrectAnswers: {
          ...gameState.requiredCorrectAnswers,
          ...(parsedState.requiredCorrectAnswers || {})
        }
      };

      // Günlük hedef kontrolü - her gün saat 00:00'da sıfırla
      const lastDate = parsedState.lastPlayDate;
      const now = new Date();
      const today = now.toDateString();

      if (lastDate !== today) {
        gameState.dailyGoal = 0;
        gameState.lastPlayDate = today;
      }

      // Kilidi açık seviyeleri kontrol et (en az A1 açık olmalı)
      if (!gameState.unlockedLevels || gameState.unlockedLevels.length === 0) {
        gameState.unlockedLevels = ['A1'];
      }

      // Geçerli bir seviye seçili mi kontrol et
      if (!gameState.currentLevel || !gameState.unlockedLevels.includes(gameState.currentLevel)) {
        gameState.currentLevel = gameState.unlockedLevels[0] || 'A1';
      }

      updateUI();
    } catch (e) {
      console.error('Oyun durumu yüklenirken hata:', e);
      // Yükleme başarısız olursa varsayılan durumu kullan
      resetGameState();
    }
  } else {
    // İlk kez oynama
    gameState.lastPlayDate = new Date().toDateString();
    saveGameState();
  }
}

function saveGameState() {
  try {
    // Son oynanma tarihini güncelle
    gameState.lastPlayDate = new Date().toDateString();

    localStorage.setItem('wordQuestState', JSON.stringify(gameState));
  } catch (e) {
    console.error('Oyun durumu kaydedilirken hata:', e);
    alert('Oyun durumu kaydedilemedi. Tarayıcınızın yerel depolama alanı dolu olabilir veya gizli modda olabilirsiniz.');
  }
}

// Oyun durumunu sıfırlama
function resetGameState() {
  gameState = {
    currentWord: null,
    currentLevel: 'A1',
    score: 0,
    dailyGoal: 0,
    learnedWords: [],
    currentScreen: 'start-screen',
    unlockedLevels: ['A1'],
    levelProgress: {
      'A1': 0,
      'A2': 0,
      'B1': 0,
      'B2': 0
    },
    requiredCorrectAnswers: {
      'A1': 50,
      'A2': 100,
      'B1': 150
    },
    lastPlayDate: new Date().toDateString()
  };

  saveGameState();
  updateUI();
}

// Ekran yönetimi
function showScreen(screenId) {
  document.querySelectorAll('.game-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
  gameState.currentScreen = screenId;
}

// UI güncelleme
function updateUI() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('daily-goal').textContent = gameState.dailyGoal;
  document.getElementById('level').value = gameState.currentLevel;

  // Level butonlarını güncelle
  document.querySelectorAll('.level-btn').forEach(btn => {
    const level = btn.dataset.level;

    // Seviye açık mı kontrol et
    if (!gameState.unlockedLevels.includes(level)) {
      btn.classList.add('locked');
      btn.innerHTML = `${level} <i class="fas fa-lock"></i>`;
      btn.title = `Bu seviyeyi açmak için ${gameState.requiredCorrectAnswers[gameState.currentLevel]} soruyu doğru cevaplayın`;
    } else {
      btn.classList.remove('locked');
      btn.innerHTML = level;
      btn.title = '';
    }

    // Aktif seviye kontrolü
    if (level === gameState.currentLevel) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Seviye ilerleme bilgisi
  if (document.getElementById('level-progress')) {
    const currentLevelProgress = gameState.levelProgress[gameState.currentLevel];
    const requiredAnswers = gameState.requiredCorrectAnswers[gameState.currentLevel] || 0;

    if (requiredAnswers > 0) {
      document.getElementById('level-progress').textContent = 
        `${currentLevelProgress}/${requiredAnswers}`;

      // İlerleme çubuğunu güncelle
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        const percentage = Math.min(100, (currentLevelProgress / requiredAnswers) * 100);
        progressBar.style.width = `${percentage}%`;
      }
    }
  }
}

// Kelime seçimi
function selectRandomWord() {
  const levelWords = wordDatabase[gameState.currentLevel];
  const randomIndex = Math.floor(Math.random() * levelWords.length);
  gameState.currentWord = levelWords[randomIndex];
  return gameState.currentWord;
}

// Kelime çalma (Text-to-Speech)
function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

// Şıkları karıştırma
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Oyunu başlatma
function startGame() {
  const word = selectRandomWord();
  document.getElementById('current-word').textContent = word.word;

  // Şıkları karıştır
  const shuffledOptions = shuffleArray(word.options);

  // Şıkları yerleştir
  const optionButtons = document.querySelectorAll('.option-btn');
  shuffledOptions.forEach((option, index) => {
    optionButtons[index].textContent = option;
    optionButtons[index].className = 'option-btn'; // Sınıfları sıfırla
  });

  // Geri bildirimi temizle
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('feedback').textContent = '';

  showScreen('question-screen');
}

// Çoktan seçmeli soruya cevap verme
function checkAnswer(selectedIndex) {
  const selectedOption = document.querySelectorAll('.option-btn')[selectedIndex].textContent;
  const correctAnswer = gameState.currentWord.meaning;

  if (selectedOption === correctAnswer) {
    // Doğru cevap
    document.querySelectorAll('.option-btn')[selectedIndex].classList.add('correct');
    document.getElementById('feedback').className = 'feedback success';
    document.getElementById('feedback').textContent = 'Doğru! +5 puan';
    gameState.score += 5;

    // Yazma ekranına geç
    setTimeout(() => {
      document.getElementById('word-meaning').textContent = correctAnswer;
      showScreen('writing-screen');
    }, 1500);
  } else {
    // Yanlış cevap
    document.querySelectorAll('.option-btn')[selectedIndex].classList.add('incorrect');

    // Doğru cevabı göster
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(button => {
      if (button.textContent === correctAnswer) {
        button.classList.add('correct');
      }
    });

    document.getElementById('feedback').className = 'feedback error';
    document.getElementById('feedback').textContent = 'Yanlış! Doğru cevap: ' + correctAnswer;

    // Yazma ekranına geç
    setTimeout(() => {
      document.getElementById('word-meaning').textContent = correctAnswer;
      showScreen('writing-screen');
    }, 2000);
  }

  updateUI();
  saveGameState();
}

// Yazım kontrolü
function checkSpelling() {
  const userInput = document.getElementById('word-input').value.trim().toLowerCase();
  const correctWord = gameState.currentWord.word.toLowerCase();
  const spellingFeedback = document.getElementById('spelling-feedback');

  if (userInput === correctWord) {
    // Doğru yazım
    spellingFeedback.className = 'feedback success';
    spellingFeedback.textContent = 'Doğru yazım! +10 puan';
    gameState.score += 10;

    // Telaffuz ekranına geç
    setTimeout(() => {
      document.getElementById('pronunciation-word').textContent = correctWord;
      showScreen('pronunciation-screen');
    }, 1500);
  } else {
    // Yanlış yazım - benzerlik kontrolü
    const similarity = calculateStringSimilarity(userInput, correctWord);

    if (similarity > 0.7) { // %70'den fazla benzerlik varsa ipucu ver
      spellingFeedback.className = 'feedback hint';
      spellingFeedback.textContent = `Çok yaklaştınız! Doğru yazım: ${correctWord}`;
    } else {
      spellingFeedback.className = 'feedback error';
      spellingFeedback.textContent = `Yanlış yazım. Doğru yazım: ${correctWord}`;
    }

    // Telaffuz ekranına geç
    setTimeout(() => {
      document.getElementById('pronunciation-word').textContent = correctWord;
      showScreen('pronunciation-screen');
    }, 2000);
  }

  updateUI();
  saveGameState();
}

// String benzerliği hesaplama (Levenshtein mesafesi)
function calculateStringSimilarity(a, b) {
  if (a.length === 0) return 0;
  if (b.length === 0) return 0;

  const matrix = [];

  // Matris oluştur
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Matris doldur
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // Silme
        matrix[i][j - 1] + 1,       // Ekleme
        matrix[i - 1][j - 1] + cost // Değiştirme
      );
    }
  }

  // Maksimum uzunluk
  const maxLength = Math.max(a.length, b.length);

  // Benzerlik oranı (1 - mesafe/maksimum uzunluk)
  return 1 - matrix[b.length][a.length] / maxLength;
}

// Telaffuz kontrolü
function startSpeechRecognition() {
  if (!recognition) {
    alert('Tarayıcınız konuşma tanıma özelliğini desteklemiyor.');
    return;
  }

  const micButton = document.getElementById('mic-button');
  const micStatus = document.getElementById('mic-status');

  micButton.classList.add('recording');
  micStatus.textContent = 'Dinleniyor...';

  // Önceki dinlemeyi durduralım
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.log("Seslendirme durdurma hatası:", error);
  }

  // Biraz bekleyelim ki kullanıcı telaffuza hazırlansın
  setTimeout(() => {
    recognition.start();
  }, 500);

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript.toLowerCase();
    const correctWord = gameState.currentWord.word.toLowerCase();
    const pronunciationFeedback = document.getElementById('pronunciation-feedback');

    console.log('Duyulan:', speechResult);
    console.log('Doğru:', correctWord);

    // Kelimenin telaffuz benzerliğini kontrol et
    // Ana kelime içinde var mı veya benzerlik oranı yüksek mi?
    if (speechResult.includes(correctWord) || 
        correctWord.includes(speechResult) || 
        calculateStringSimilarity(speechResult, correctWord) > 0.6) {

      pronunciationFeedback.className = 'feedback success';
      pronunciationFeedback.textContent = 'Harika telaffuz! +15 puan';
      gameState.score += 15;

      // Sonuç ekranına geç
      setTimeout(() => {
        showResult();
      }, 1500);
    } else {
      pronunciationFeedback.className = 'feedback error';
      pronunciationFeedback.textContent = `Telaffuz tanınmadı. Doğru telaffuz: "${correctWord}". Tekrar deneyin veya atlayın.`;

      // Doğru telaffuzu oynat
      speakWord(correctWord);
    }

    micButton.classList.remove('recording');
    micStatus.textContent = 'Tamamlandı';

    updateUI();
    saveGameState();
  };

  recognition.onerror = (event) => {
    micButton.classList.remove('recording');
    micStatus.textContent = 'Hata: ' + event.error;
    console.error('Konuşma tanıma hatası:', event.error);

    const pronunciationFeedback = document.getElementById('pronunciation-feedback');
    pronunciationFeedback.className = 'feedback error';
    pronunciationFeedback.textContent = `Ses tanıma hatası: ${event.error}. Lütfen tekrar deneyin veya atlayın.`;
  };

  recognition.onend = () => {
    micButton.classList.remove('recording');
    if (micStatus.textContent === 'Dinleniyor...') {
      micStatus.textContent = 'Tamamlandı';
    }
  };
}

// Sonraki kelimeye geçme
function nextWord() {
  // Günlük hedefi güncelle
  gameState.dailyGoal++;

  // Doğru cevaplandı, seviye ilerlemesini güncelle
  gameState.levelProgress[gameState.currentLevel]++;

  // Seviye kilidini kontrol et
  const currentLevel = gameState.currentLevel;
  const nextLevelMap = {
    'A1': 'A2',
    'A2': 'B1',
    'B1': 'B2'
  };

  // Gerekli doğru cevap sayısına ulaşıldıysa sonraki seviyeyi aç
  if (currentLevel in nextLevelMap && 
      gameState.levelProgress[currentLevel] >= gameState.requiredCorrectAnswers[currentLevel] &&
      !gameState.unlockedLevels.includes(nextLevelMap[currentLevel])) {

    const nextLevel = nextLevelMap[currentLevel];
    gameState.unlockedLevels.push(nextLevel);

    // Seviye açıldı bildirimi göster
    showLevelUnlockedNotification(nextLevel);

    // Seviye açma durumunu kaydet
    saveGameState();

    // UI'ı güncelle
    updateUI();
  }

  // Öğrenilen kelimeye ekle
  if (!gameState.learnedWords.some(w => w.word === gameState.currentWord.word)) {
    gameState.learnedWords.push({
      word: gameState.currentWord.word,
      meaning: gameState.currentWord.meaning,
      level: gameState.currentLevel,
      learnedAt: new Date().toISOString() // Ne zaman öğrenildiğini kaydet
    });
  }

  // Kelime defterini güncelle
  updateLearnedWordsDisplay();

  // Giriş alanını temizle
  document.getElementById('word-input').value = '';

  // Yeni kelime seç ve oyunu başlat
  startGame();

  updateUI();
  saveGameState();
}

// Seviye açıldı bildirimi
function showLevelUnlockedNotification(level) {
  const notification = document.createElement('div');
  notification.className = 'level-unlocked-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-unlock-alt"></i>
      <h3>Yeni Seviye Açıldı!</h3>
      <p>${level} seviyesindeki kelimeler artık kullanımınıza açık.</p>
    </div>
  `;

  document.body.appendChild(notification);

  // Animasyon için biraz bekle
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // 5 saniye sonra bildirimi kaldır
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Yardım/İpucu gösterme
function showHint() {
  const feedback = document.getElementById('feedback');
  const word = gameState.currentWord.word;

  // İlk ve son harfi göster
  const firstLetter = word.charAt(0);
  const lastLetter = word.charAt(word.length - 1);
  let hint = firstLetter;

  for (let i = 1; i < word.length - 1; i++) {
    hint += word[i] === ' ' ? ' ' : '_';
  }

  if (word.length > 1) {
    hint += lastLetter;
  }

  feedback.className = 'feedback hint';
  feedback.textContent = `İpucu: ${hint}`;
}

// Kelime defteri gösterme
function showDictionary() {
  const modal = document.getElementById('dictionary-modal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  updateLearnedWordsDisplay();
}

function closeDictionary() {
  const modal = document.getElementById('dictionary-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// Ayarlar modalını gösterme
function showSettings() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

function closeSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function updateLearnedWordsDisplay() {
  const container = document.getElementById('learned-words');
  container.innerHTML = '';

  if (gameState.learnedWords.length === 0) {
    container.innerHTML = '<p>Henüz öğrenilen kelime yok.</p>';
    return;
  }

  gameState.learnedWords.forEach(word => {
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    wordCard.innerHTML = `
      <h3>${word.word}</h3>
      <p>${word.meaning}</p>
      <p class="level-tag">${word.level}</p>
    `;
    container.appendChild(wordCard);
  });
}

// Tüm seviyelerin tamamlanıp tamamlanmadığını kontrol et
function checkAllLevelsCompleted() {
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];

  // GameState doğru şekilde yüklenmiş mi kontrol et
  if (!gameState || !gameState.unlockedLevels || !gameState.levelProgress) {
    console.log("GameState tam olarak yüklenemedi, seviye kontrolü atlanıyor");
    return;
  }

  // Tüm seviyeler açıldı mı?
  const allLevelsUnlocked = levelOrder.every(level => gameState.unlockedLevels.includes(level));

  // Son seviye de belirli bir ilerlemeye ulaştı mı?
  const lastLevelProgress = gameState.levelProgress['B2'] || 0;
  const minimumLastLevelProgress = 20; // B2 seviyesinde en az 20 kelime öğrenilmiş olsun

  if (allLevelsUnlocked && lastLevelProgress >= minimumLastLevelProgress && !gameState.allLevelsCompleted) {
    gameState.allLevelsCompleted = true;
    saveGameState();

    // Final deneme ekranını göster
    setTimeout(() => {
      showFinalExam();
    }, 1500);
  }
}

// Final deneme sınavını göster
function showFinalExam() {
  // Tüm seviyelerden rastgele 20 kelime seç
  const allWords = [];
  const levelOrder = ['A1', 'A2', 'B1', 'B2'];

  levelOrder.forEach(level => {
    if (wordDatabase[level]) {
      allWords.push(...wordDatabase[level]);
    }
  });

  // Kelimeleri karıştır ve ilk 20'sini al
  const shuffledWords = shuffleArray([...allWords]);
  const examWords = shuffledWords.slice(0, 20);

  // Exam state'i hazırla
  window.examState = {
    words: examWords,
    currentWordIndex: 0,
    correctAnswers: 0,
    totalWords: examWords.length
  };

  // İlk kelimeyi göster
  showNextExamWord();

  // Ekranı göster
  showScreen('final-exam-screen');
}

// Sonraki deneme kelimesini göster
function showNextExamWord() {
  if (window.examState.currentWordIndex >= window.examState.words.length) {
    // Deneme bitti, sertifika formunu göster
    showCertificateForm();
    return;
  }

  const currentWord = window.examState.words[window.examState.currentWordIndex];
  document.getElementById('exam-current-word').textContent = currentWord.meaning; // Türkçe anlamını göster
  document.getElementById('exam-word-input').value = '';
  document.getElementById('exam-feedback').className = 'feedback';
  document.getElementById('exam-feedback').textContent = '';

  // İlerleme çubuğunu güncelle
  document.getElementById('exam-progress-count').textContent = 
    `${window.examState.currentWordIndex}/${window.examState.totalWords}`;

  const percentage = Math.min(100, (window.examState.currentWordIndex / window.examState.totalWords) * 100);
  document.getElementById('exam-progress-bar').style.width = `${percentage}%`;
}

// Deneme cevabını kontrol et
function checkExamAnswer() {
  const userInput = document.getElementById('exam-word-input').value.trim().toLowerCase();
  const currentWord = window.examState.words[window.examState.currentWordIndex];
  const correctWord = currentWord.word.toLowerCase();
  const examFeedback = document.getElementById('exam-feedback');

  if (userInput === correctWord) {
    // Doğru cevap
    examFeedback.className = 'feedback success';
    examFeedback.textContent = 'Doğru cevap!';
    window.examState.correctAnswers++;

    // Sonraki kelimeye geç
    window.examState.currentWordIndex++;
    setTimeout(() => {
      showNextExamWord();
    }, 1500);
  } else {
    // Yanlış cevap
    examFeedback.className = 'feedback error';
    examFeedback.textContent = `Yanlış cevap. Doğrusu: ${correctWord}`;

    // Sonraki kelimeye geç
    window.examState.currentWordIndex++;
    setTimeout(() => {
      showNextExamWord();
    }, 2000);
  }
}

// Sertifika formunu göster
function showCertificateForm() {
  const successRate = Math.round((window.examState.correctAnswers / window.examState.totalWords) * 100);
  let level = '';

  // Başarı oranına göre seviye belirle
  if (successRate >= 90) {
    level = 'B2 (İleri)';
  } else if (successRate >= 75) {
    level = 'B1 (Orta-İleri)';
  } else if (successRate >= 60) {
    level = 'A2 (Temel)';
  } else {
    level = 'A1 (Başlangıç)';
  }

  // Kullanıcıya seviyesini göster
  const certificateMessage = document.getElementById('certificate-message');
  certificateMessage.className = 'feedback success';
  certificateMessage.textContent = `Doğru sayınız: ${window.examState.correctAnswers}/${window.examState.totalWords}. İngilizce seviyeniz: ${level}`;

  // Sertifika formunu göster
  showScreen('certificate-screen');
}

// Sertifikayı gönder
function sendCertificate() {
  const userName = document.getElementById('user-name').value.trim();
  const userEmail = document.getElementById('user-email').value.trim();

  if (!userName || !userEmail) {
    alert('Lütfen adınızı ve e-mail adresinizi giriniz.');
    return;
  }

  // E-mail formatını kontrol et
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    alert('Lütfen geçerli bir e-mail adresi giriniz.');
    return;
  }

  // Exam state kontrolü
  if (!window.examState || typeof window.examState.correctAnswers === 'undefined' || 
      typeof window.examState.totalWords === 'undefined') {
    console.error('Exam state bilgileri eksik');
    alert('Sınav bilgileri bulunamadı. Lütfen sınavı tekrar yapınız.');
    showScreen('start-screen');
    return;
  }

  const successRate = Math.round((window.examState.correctAnswers / window.examState.totalWords) * 100);
  let level = '';

  // Başarı oranına göre seviye belirle
  if (successRate >= 90) {
    level = 'B2 (İleri)';
  } else if (successRate >= 75) {
    level = 'B1 (Orta-İleri)';
  } else if (successRate >= 60) {
    level = 'A2 (Temel)';
  } else {
    level = 'A1 (Başlangıç)';
  }

  // Sertifika bilgilerini oluştur
  const certificateData = {
    userName: userName,
    userEmail: userEmail,
    score: `${window.examState.correctAnswers}/${window.examState.totalWords}`,
    successRate: `${successRate}%`,
    level: level,
    date: new Date().toLocaleDateString()
  };

  // Email gönderme kısmı
  const certificateMessage = document.getElementById('certificate-message');
  certificateMessage.className = 'feedback loading';
  certificateMessage.textContent = `Sertifikanız hazırlanıyor ve gönderiliyor...`;

  // Gönder butonunu devre dışı bırak
  document.getElementById('send-certificate').disabled = true;

  // Email API'sine istek gönder
  fetch('/send-certificate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(certificateData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server yanıt kodu: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      certificateMessage.className = 'feedback success';
      certificateMessage.textContent = `Tebrikler ${userName}! Sertifikanız ${userEmail} adresine gönderildi. Seviyeniz: ${level}`;

      // 5 saniye sonra ana ekrana dön
      setTimeout(() => {
        gameState.score += 200; // Bonus puan
        saveGameState();
        showScreen('start-screen');
        document.getElementById('send-certificate').disabled = false;
      }, 5000);
    } else {
      certificateMessage.className = 'feedback error';
      certificateMessage.textContent = `Hata: ${data.error || 'Sertifika gönderilirken bir sorun oluştu.'}`;
      document.getElementById('send-certificate').disabled = false;
    }
  })
  .catch(error => {
    console.error('Sertifika gönderme hatası:', error);
    certificateMessage.className = 'feedback error';
    certificateMessage.textContent = 'Bir hata oluştu. Lütfen tekrar deneyiniz.';
    document.getElementById('send-certificate').disabled = false;
  });
}

// Sonuç ekranını gösterme
function showResult() {
  document.getElementById('correct-answer').textContent = gameState.currentWord.word;
  document.getElementById('points-earned').textContent = gameState.score;
  showScreen('result-screen');

  // Tüm seviyeler tamamlandı mı kontrol et
  checkAllLevelsCompleted();
}

// Ses kontrolü
function isSoundMuted() {
  return localStorage.getItem('muteSound') === 'true';
}

function toggleSound(mute) {
  localStorage.setItem('muteSound', mute);

  // Eğer seçenek değiştiyse ses/bildirim ayarlarını güncelle
  try {
    if (mute && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (error) {
    console.log("Ses değiştirme hatası:", error);
  }
}

// Kelime çalma (Text-to-Speech) - düzeltildi
function speakWord(word) {
  try {
    if ('speechSynthesis' in window && !isSoundMuted()) {
      // Önce aktif seslendirmeleri durdur
      window.speechSynthesis.cancel();

      // Yeni seslendirme oluştur
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.volume = 1;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Seslendirmeyi başlat
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.log("Seslendirme hatası:", error);
  }
}

// Günlük hedefi sıfırlama kontrolü - periyodik olarak kontrol et
function checkDailyReset() {
  const lastDate = gameState.lastPlayDate;
  const now = new Date();
  const today = now.toDateString();

  if (lastDate !== today) {
    // Günü değiştir ve hedefi sıfırla
    gameState.dailyGoal = 0;
    gameState.lastPlayDate = today;
    saveGameState();
    updateUI();

    // Güncelleme bildirimini göster
    const notification = document.createElement('div');
    notification.className = 'level-unlocked-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-calendar-day"></i>
        <h3>Yeni Gün</h3>
        <p>Günlük hedefler sıfırlandı!</p>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Oyun durumunu yükle
  loadGameState();

  // Her dakika günlük sıfırlama kontrolü yap
  setInterval(checkDailyReset, 60000);

  // Ses ayarlarını kontrol et
  document.getElementById('mute-sounds').checked = isSoundMuted();

  // Başlangıç ekranı
  document.getElementById('start-button').addEventListener('click', startGame);

  // Ayarlar butonunu kur
  document.getElementById('settings-button').addEventListener('click', showSettings);
  document.querySelector('.settings-close').addEventListener('click', closeSettings);

  // Ses ayarlarını değiştirme
  document.getElementById('mute-sounds').addEventListener('change', function() {
    toggleSound(this.checked);
  });

  // İlerlemeyi sıfırlama
  document.getElementById('reset-progress').addEventListener('click', function() {
    const confirmation = confirm('Tüm ilerlemeniz sıfırlanacaktır. Emin misiniz?');
    if (confirmation) {
      resetGameState();
      closeSettings();

      // Bildirim göster
      const notification = document.createElement('div');
      notification.className = 'level-locked-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-check-circle"></i>
          <h3>İlerleme Sıfırlandı</h3>
          <p>Oyun durumunuz başarıyla sıfırlandı.</p>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('show');
      }, 100);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);

      // Ana ekrana dön
      showScreen('start-screen');
    }
  });

  // Seviye değiştirme - buton ile
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;

      // Kilitli seviyeler için uyarı göster
      if (!gameState.unlockedLevels.includes(level)) {
        // Bir önceki seviyeyi bul
        const levelOrder = ['A1', 'A2', 'B1', 'B2'];
        const currentLevelIndex = levelOrder.indexOf(gameState.currentLevel);
        const selectedLevelIndex = levelOrder.indexOf(level);

        let message = '';
        let previousLevel = '';

        // Seçilen seviye, mevcut seviyeden daha yüksek mi?
        if (selectedLevelIndex > currentLevelIndex) {
          previousLevel = levelOrder[selectedLevelIndex - 1];
          const requiredAnswers = gameState.requiredCorrectAnswers[previousLevel];
          const currentProgress = gameState.levelProgress[previousLevel] || 0;
          const remainingAnswers = Math.max(0, requiredAnswers - currentProgress);

          message = `Bu seviyeyi açmak için ${previousLevel} seviyesinde ${remainingAnswers} kelime daha doğru öğrenmeniz gerekiyor.`;
        } else {
          // Atlama yapmış olabilir, örn. A1'den B1'e
          const allPreviousLevels = levelOrder.slice(0, selectedLevelIndex);
          const unlockedPreviousLevels = allPreviousLevels.filter(l => gameState.unlockedLevels.includes(l));
          const lastUnlockedLevel = unlockedPreviousLevels[unlockedPreviousLevels.length - 1] || 'A1';

          message = `Önce ${lastUnlockedLevel} seviyesinden başlayarak sırayla ilerleyiniz.`;
        }

        const notification = document.createElement('div');
        notification.className = 'level-locked-notification';
        notification.innerHTML = `
          <div class="notification-content">
            <i class="fas fa-lock"></i>
            <h3>Seviye Kilitli</h3>
            <p>${message}</p>
          </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
          notification.classList.add('show');
        }, 100);

        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => {
            notification.remove();
          }, 300);
        }, 5000);

        return;
      }

      // Aktif sınıfı kaldır
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      // Tıklanan butona aktif sınıfı ekle
      btn.classList.add('active');
      // Select değerini güncelle
      document.getElementById('level').value = level;
      gameState.currentLevel = level;
      saveGameState();

      // İlerleme çubuğunu güncelle
      const currentLevelProgress = gameState.levelProgress[level] || 0;
      const requiredAnswers = gameState.requiredCorrectAnswers[level] || 0;

      if (requiredAnswers > 0) {
        document.getElementById('level-progress').textContent = 
          `${currentLevelProgress}/${requiredAnswers}`;

        // İlerleme çubuğunu güncelle
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
          const percentage = Math.min(100, (currentLevelProgress / requiredAnswers) * 100);
          progressBar.style.width = `${percentage}%`;
        }
      }

      // Yeni seviyede oyunu başlat
      startGame();
    });
  });

  // Select değiştiğinde butonları güncelle (geriye dönük uyumluluk için)
  document.getElementById('level').addEventListener('change', (e) => {
    const level = e.target.value;
    gameState.currentLevel = level;

    // Butonları güncelle
    document.querySelectorAll('.level-btn').forEach(btn => {
      if (btn.dataset.level === level) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    saveGameState();
  });

  // Şık seçme
  document.querySelectorAll('.option-btn').forEach(button => {
    button.addEventListener('click', () => {
      const index = button.dataset.index;
      checkAnswer(index);
    });
  });

  // Yazım kontrolü
  document.getElementById('check-spelling').addEventListener('click', checkSpelling);
  document.getElementById('word-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkSpelling();
    }
  });

  // Kelime dinleme
  document.getElementById('listen-word').addEventListener('click', () => {
    if (gameState.currentWord && gameState.currentWord.word) {
      speakWord(gameState.currentWord.word);
    }
  });

  document.getElementById('listen-pronunciation').addEventListener('click', () => {
    if (gameState.currentWord && gameState.currentWord.word) {
      speakWord(gameState.currentWord.word);
    }
  });

  // Mikrofon
  document.getElementById('mic-button').addEventListener('click', startSpeechRecognition);

  // Telaffuzu atla
  document.getElementById('skip-pronunciation').addEventListener('click', showResult);

  // Sonraki kelime
  document.getElementById('next-word').addEventListener('click', nextWord);

  // İpucu
  document.getElementById('hint-button').addEventListener('click', showHint);

  // Kelime defteri
  document.getElementById('dictionary-button').addEventListener('click', showDictionary);
  document.querySelector('.close').addEventListener('click', closeDictionary);

  // Final deneme sınavı dinleyicileri
  document.getElementById('exam-check-answer').addEventListener('click', checkExamAnswer);
  document.getElementById('exam-word-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      checkExamAnswer();
    }
  });
  document.getElementById('exam-listen-word').addEventListener('click', () => {
    const currentWord = window.examState.words[window.examState.currentWordIndex];
    speakWord(currentWord.word);
  });

  // Sertifika işlemleri
  document.getElementById('send-certificate').addEventListener('click', sendCertificate);

  // Modalları kapatma (dışarı tıklandığında)
  window.addEventListener('click', (e) => {
    const dictionaryModal = document.getElementById('dictionary-modal');
    const settingsModal = document.getElementById('settings-modal');

    if (e.target === dictionaryModal) {
      closeDictionary();
    }

    if (e.target === settingsModal) {
      closeSettings();
    }
  });
});