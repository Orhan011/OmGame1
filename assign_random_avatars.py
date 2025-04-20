
from models import db, User
import random
import os
from flask import Flask
import logging

# Log yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/omgame.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def assign_random_avatars():
    """Profil resmi olmayan kullanıcılara rastgele avatarlar atar"""
    app = create_app()
    
    with app.app_context():
        users = User.query.all()
        logger.info(f"Toplam {len(users)} kullanıcı bulundu.")
        
        avatar_count = 0
        
        for user in users:
            # Eğer kullanıcının avatarı yoksa veya boşsa
            if not user.avatar_url or user.avatar_url.strip() == '':
                # Erkek veya kadın avatarı rastgele seç
                gender = random.choice(['male', 'female'])
                num = random.randint(1, 3 if gender == 'male' else 2)
                
                # Avatar yolunu ayarla
                avatar_path = f"static/avatars/bots/avatar_{gender}_{num}.svg"
                
                # Kullanıcıyı güncelle
                user.avatar_url = avatar_path
                avatar_count += 1
                
                logger.info(f"Kullanıcı {user.username} için avatar atandı: {avatar_path}")
        
        # Değişiklikleri kaydet
        if avatar_count > 0:
            db.session.commit()
            logger.info(f"Toplam {avatar_count} kullanıcıya avatar atandı.")
        else:
            logger.info("Hiçbir kullanıcı güncellenmedi.")

if __name__ == "__main__":
    assign_random_avatars()
