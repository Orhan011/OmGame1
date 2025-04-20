import os
import random
import sys
from flask import Flask
from models import db, User

# SVG avatar seçenekleri
MALE_AVATARS = [
    "/static/avatars/bots/avatar_male_1.svg",
    "/static/avatars/bots/avatar_male_2.svg",
    "/static/avatars/bots/avatar_male_3.svg"
]

FEMALE_AVATARS = [
    "/static/avatars/bots/avatar_female_1.svg",
    "/static/avatars/bots/avatar_female_2.svg"
]

# Bot isimleri listesi (bot_system.py'den alındı)
MALE_NAMES = [
    "Mehmet", "Ali", "Ömer", "Mert", "Kerem", "Arda", "Efe", "Enes", 
    "Burak", "Emirhan", "Hakan", "Samir", "Nihat", "Fərid", "Murad", "Ayxan"
]

FEMALE_NAMES = [
    "Yağmur", "Sude", "Defne", "Azra", "Nehir", "Melisa", "Ceren", "Rabia", 
    "Nigar", "Ləman", "Aysel", "Nərmin", "Şəbnəm", "Lale", "Türkan", "Fidan"
]

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def update_bot_avatars():
    """Mevcut bot kullanıcılarının avatarlarını SVG avatarlarla günceller"""
    with app.app_context():
        # Bot kullanıcıları bul
        bot_users = User.query.filter_by(account_status='bot').all()
        
        if not bot_users:
            print("Güncellenecek bot kullanıcı bulunamadı!")
            return
        
        updated_count = 0
        for bot in bot_users:
            # Cinsiyet kontrolü (isim listelerinden)
            is_female = bot.username in FEMALE_NAMES
            
            # Cinsiyete göre avatar seç
            if is_female:
                new_avatar = random.choice(FEMALE_AVATARS)
            else:
                new_avatar = random.choice(MALE_AVATARS)
            
            # Avatar URL'sini güncelle
            bot.avatar_url = new_avatar
            updated_count += 1
        
        # Değişiklikleri kaydet
        db.session.commit()
        print(f"{updated_count} bot kullanıcının avatarı güncellendi.")

if __name__ == "__main__":
    update_bot_avatars()
    print("Bot avatar güncelleme işlemi tamamlandı!")