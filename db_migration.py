from main import app, db
from alembic import op
import sqlalchemy as sa
from datetime import datetime
import logging

# Logger yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Tüm tabloları oluştur"""
    with app.app_context():
        logger.info("Tüm tabloları oluşturuluyor...")
        db.create_all()
        logger.info("Tablolar oluşturuldu!")

def add_game_session_table():
    """GameSession tablosu ekle"""
    with app.app_context():
        try:
            # GameSession tablosunu kontrol et
            logger.info("GameSession tablosu kontrol ediliyor...")
            from models import GameSession
            if not db.engine.dialect.has_table(db.engine, 'game_sessions'):
                logger.info("GameSession tablosu oluşturuluyor...")
                db.create_all()
                logger.info("GameSession tablosu oluşturuldu!")
            else:
                logger.info("GameSession tablosu zaten mevcut.")
        except Exception as e:
            logger.error(f"Hata: {str(e)}")

def add_user_columns():
    """User tablosuna yeni kolonlar ekle"""
    with app.app_context():
        try:
            # User tablosunu kontrol et
            logger.info("User tablosu güncellemesi kontrol ediliyor...")
            
            # Sütunları ekle
            connection = db.engine.connect()
            
            # Toplam puanlar
            if 'total_points' not in [c.name for c in sa.inspect(db.engine).get_columns('users')]:
                logger.info("total_points sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0'))
            
            # Seviye
            if 'level' not in [c.name for c in sa.inspect(db.engine).get_columns('users')]:
                logger.info("level sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1'))
            
            # Son oyun tarihi
            if 'last_play_date' not in [c.name for c in sa.inspect(db.engine).get_columns('users')]:
                logger.info("last_play_date sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE users ADD COLUMN last_play_date DATE'))
            
            # Ardışık oynama sayısı
            if 'streak_count' not in [c.name for c in sa.inspect(db.engine).get_columns('users')]:
                logger.info("streak_count sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE users ADD COLUMN streak_count INTEGER DEFAULT 0'))
            
            connection.close()
            logger.info("User tablosu güncellendi!")
        except Exception as e:
            logger.error(f"Hata: {str(e)}")

def add_score_columns():
    """Score tablosuna yeni kolonlar ekle"""
    with app.app_context():
        try:
            # Score tablosunu kontrol et
            logger.info("Score tablosu güncellemesi kontrol ediliyor...")
            
            # Sütunları ekle
            connection = db.engine.connect()
            
            # Puanlar
            if 'points_earned' not in [c.name for c in sa.inspect(db.engine).get_columns('scores')]:
                logger.info("points_earned sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE scores ADD COLUMN points_earned INTEGER DEFAULT 0'))
            
            # XP
            if 'xp_earned' not in [c.name for c in sa.inspect(db.engine).get_columns('scores')]:
                logger.info("xp_earned sütunu ekleniyor...")
                connection.execute(sa.text('ALTER TABLE scores ADD COLUMN xp_earned INTEGER DEFAULT 0'))
            
            connection.close()
            logger.info("Score tablosu güncellendi!")
        except Exception as e:
            logger.error(f"Hata: {str(e)}")

if __name__ == '__main__':
    # Tüm tabloları oluştur
    create_tables()
    
    # User tablosunu güncelle
    add_user_columns()
    
    # Score tablosunu güncelle
    add_score_columns()
    
    # GameSession tablosunu ekle
    add_game_session_table()
    
    logger.info("Tüm veritabanı migrasyonları tamamlandı!")