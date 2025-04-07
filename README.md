# OmGame

OmGame, çeşitli interaktif oyunlar içeren bir eğitim platformudur. Beyin egzersizleri, hafıza geliştirme, ve eğlenceli aktiviteler sunarak kullanıcıların zihinsel becerilerini geliştirmeyi amaçlamaktadır.

## Özellikler

- Kullanıcı kaydı ve oturum yönetimi
- Çeşitli interaktif oyunlar (Hafıza Kartları, Wordle, Satranç, Sudoku, Ses Hafıza Oyunu ve daha fazlası)
- Puan takibi ve liderlik tablosu
- Kullanıcı profil sayfası ve istatistikler
- Responsive tasarım (mobil ve masaüstü uyumlu)
- Seviye ve XP sistemi

## Oyunlar

- **Hafıza Kartları**: Kart eşleştirme oyunu
- **Ses Hafıza Oyunu**: İşitsel hafızayı geliştiren melodi eşleştirme
- **Wordle**: Kelime tahmin oyunu
- **Sudoku**: Klasik sayı bulmaca oyunu
- **Satranç**: Zeka geliştirici stratejik oyun
- **2048**: Sayı birleştirme oyunu
- **IQ Test**: Zeka ve mantık sorularını çözme
- **Tetris**: Klasik blok bulmaca oyunu
- ve daha fazlası...

## Teknolojiler

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python/Flask
- **Veritabanı**: PostgreSQL
- **Deployment**: Gunicorn

## Kurulum

1. Depoyu klonlayın
   ```
   git clone https://github.com/Orhan120/OmGame.git
   cd OmGame
   ```

2. Gerekli Python paketlerini yükleyin
   ```
   pip install email-validator flask flask-sqlalchemy gunicorn psycopg2-binary sqlalchemy werkzeug
   ```

3. Uygulamayı başlatın
   ```
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
