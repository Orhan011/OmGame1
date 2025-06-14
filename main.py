from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, make_response
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import json
from werkzeug.utils import secure_filename
import logging
import uuid

from werkzeug.utils import secure_filename
import os
import time

import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email_validator import validate_email, EmailNotValidError
import time
from functools import wraps

# Logger yapılandırması
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", "sqlite:///beyin_egzersizi.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
app.secret_key = os.environ.get("SESSION_SECRET", "beyin_egzersizi_gizli_anahtar")

# Yükleme klasörü ayarları
UPLOAD_FOLDER = 'static/uploads/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB limit
app.config['FEEDBACK_EMAIL'] = "omgameee@gmail.com"
app.config['SENDGRID_API_KEY'] = os.environ.get("SENDGRID_API_KEY")

# Logging ayarları
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Veritabanı
from models import db, User, Score, Article, Achievement, GameStat, AdminUser, Game, SiteSettings, Page, BlogPost, Category, MediaFile, AdminLog, GameRating

# Veritabanını uygulama ile ilişkilendir
db.init_app(app)

# Blueprint'leri içe aktar
from admin import admin_bp
from password_reset import password_reset

# Blueprint'leri kaydet
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(password_reset, url_prefix='/password')

# Veritabanı tabloları oluştur
with app.app_context():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database creation error: {e}")

def allowed_file(filename):
    """Dosya uzantısının izin verilen uzantılardan olup olmadığını kontrol eder."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

import threading

def send_email_in_background(to_email, subject, html_body, from_name="OmGame", verification_code=None):
    """
    E-posta gönderme işlemini gerçekleştirir.
    Doğrudan SMTP kullanarak e-posta gönderimi.
    
    Args:
        to_email (str): Gönderilecek e-posta adresi
        subject (str): E-posta konusu
        html_body (str): E-posta içeriği (HTML)
        from_name (str, optional): Gönderen adı. Varsayılan: "OmGame"
        verification_code (str, optional): Doğrulama kodu. Belirtilmezse içerikten otomatik çıkarılmaya çalışılır.
    """
    # İşlem başlangıcını logla
    logger.info(f"E-posta gönderme işlemi başlatıldı: {to_email}, Konu: {subject}")
    
    # Doğrulama kodunu belirle (içerikten çıkarma gerekirse)
    if not verification_code:
        # HTML içeriğinden doğrulama kodunu çıkarmaya çalış
        try:
            import re
            # Verification code'u çıkart (verification-code class'ındaki)
            code_match = re.search(r'verification-code[^>]*>(\d+)<', html_body)
            if code_match:
                verification_code = code_match.group(1)
                logger.info(f"Doğrulama Kodu (HTML'den çıkarıldı): {verification_code} - E-posta: {to_email}")
            else:
                # Başka bir desene bakın
                code_match2 = re.search(r'<h3[^>]*>(\d+)</h3>', html_body)
                if code_match2:
                    verification_code = code_match2.group(1)
                    logger.info(f"Doğrulama Kodu (h3 etiketinden çıkarıldı): {verification_code} - E-posta: {to_email}")
                else:
                    # Doğrulama kodunu arama için diğer desen - divler içindeki kod
                    code_match3 = re.search(r'class="verification-code"[^>]*>(\d+)<', html_body)
                    if code_match3:
                        verification_code = code_match3.group(1)
                        logger.info(f"Doğrulama Kodu (verification-code class'ından çıkarıldı): {verification_code} - E-posta: {to_email}")
        except Exception as e:
            logger.error(f"Doğrulama kodu çıkarılırken hata: {str(e)}")
    
    # Sadece loglama için doğrulama kodu bilgisi (kullanıcıya gösterilmiyor)
    if verification_code:
        logger.info(f"E-posta gönderimi - Doğrulama Kodu: {verification_code}, Alıcı: {to_email}")
    
    # SMTP ile e-posta gönderimi
    try:
        # Gmail SMTP ayarları - doğrudan SMTP kullan
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        from_email = "omgameee@gmail.com"
        password = os.environ.get('GMAIL_APP_PASSWORD', '')  # Çevresel değişkenden alınan Gmail uygulama şifresi
        
        # Eğer şifre yoksa uyarı ver ve başarısız dön
        if not password:
            logger.error("GMAIL_APP_PASSWORD çevresel değişkeni ayarlanmamış!")
            return False
        
        # E-posta mesajını oluştur
        smtp_msg = MIMEMultipart()
        
        # E-posta başlıklarını Türkçe karakterleri destekleyecek şekilde kodla
        from email.header import Header
        smtp_msg['From'] = f"{Header(from_name, 'utf-8').encode()} <{from_email}>"
        smtp_msg['To'] = to_email
        smtp_msg['Subject'] = Header(subject, 'utf-8').encode()
        
        # HTML içeriği UTF-8 olarak kodla
        smtp_msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # SMTP sunucusuna bağlan ve e-postayı gönder
        logger.info(f"SMTP sunucusuna bağlanılıyor: smtp.gmail.com:465")
        try:
            # SSL bağlantısı dene (debug modda)
            logger.info(f"SMTP SSL bağlantısı kuruluyor...")
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
            server.set_debuglevel(1)  # Debug mode
            logger.info(f"SMTP giriş yapılıyor: {from_email}")
            server.login(from_email, password)
            logger.info(f"SMTP login başarılı")
            # Türkçe karakterler için UTF-8 kodlaması kullan
            text = smtp_msg.as_string().encode('utf-8')
            logger.info(f"Mesaj gönderiliyor: {from_email} -> {to_email}")
            server.sendmail(from_email, to_email, text)
            server.quit()
            logger.info(f"SMTP SSL bağlantısı ile e-posta gönderildi")
        except Exception as ssl_error:
            logger.warning(f"SSL ile bağlantı hatası, TLS denenecek: {str(ssl_error)}")
            # SSL başarısız olursa TLS bağlantısı dene
            try:
                server = smtplib.SMTP('smtp.gmail.com', 587, timeout=30)
                server.starttls()
                server.login(from_email, password)
                # Türkçe karakterler için UTF-8 kodlaması kullan
                text = smtp_msg.as_string().encode('utf-8')
                server.sendmail(from_email, to_email, text)
                server.quit()
                logger.info(f"SMTP TLS bağlantısı ile e-posta gönderildi")
            except Exception as tls_error:
                logger.error(f"TLS ile bağlantı hatası: {str(tls_error)}")
                raise  # Hatayı yeniden yükselt
        
        logger.info(f"E-posta başarıyla gönderildi: {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"E-posta gönderme işlemi sırasında hata: {str(e)}")
        
        # Hata detaylarını logla
        import traceback
        logger.error(f"E-posta gönderim hatası detayları: {traceback.format_exc()}")
        
        # Gmail uygulama şifresiyle ilgili bir hata olabilir
        if "Application-specific password required" in str(e) or "Invalid credentials" in str(e):
            logger.critical("Gmail uygulama şifresi geçersiz veya süresi dolmuş olabilir!")
            
        return False

def send_verification_email(to_email, subject, html_message):
    """
    Kullanıcıya bilgilendirme e-postası gönderir.
    
    Args:
        to_email (str): Kullanıcının e-posta adresi
        subject (str): E-posta konusu
        html_message (str): HTML formatında e-posta içeriği
    
    Returns:
        bool: E-posta gönderme işleminin başarılı olup olmadığı
    """
    try:
        # E-posta gönderme işlemi
        result = send_email_in_background(to_email, subject, html_message)
        if result:
            logger.info(f"E-posta başarıyla gönderildi: {to_email}")
            return True
        else:
            logger.error(f"E-posta gönderimi başarısız")
            return False
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        return False


def send_welcome_email(to_email, username):
    """
    Kayıt olan kullanıcıya modern ve hoş bir karşılama e-postası gönderir.
    
    Args:
        to_email: Kullanıcının e-posta adresi
        username: Kullanıcının adı
        
    Returns:
        bool: E-posta gönderme işleminin başarılı olup olmadığı
    """
    subject = "OmGame Dünyasına Hoş Geldiniz! 🎮"
    
    # Modern HTML e-posta tasarımı
    html_body = f"""
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OmGame'e Hoş Geldiniz</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            body {{
                font-family: 'Poppins', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f5f7;
                color: #333;
                line-height: 1.6;
            }}
            
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            }}
            
            .header {{
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                padding: 30px 0;
                text-align: center;
            }}
            
            .header img {{
                width: 140px;
                height: auto;
            }}
            
            .content {{
                padding: 30px 40px;
            }}
            
            h1 {{
                color: #224abe;
                margin-top: 0;
                font-size: 24px;
                font-weight: 600;
            }}
            
            p {{
                margin-bottom: 20px;
                color: #555;
                font-size: 16px;
            }}
            
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 500;
                margin: 15px 0;
                text-align: center;
                transition: transform 0.3s ease;
            }}
            
            .button:hover {{
                transform: translateY(-2px);
            }}
            
            .features {{
                display: flex;
                flex-wrap: wrap;
                margin: 25px 0;
                justify-content: space-between;
            }}
            
            .feature {{
                flex-basis: 48%;
                background-color: #f8f9fc;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                border-left: 3px solid #4e73df;
            }}
            
            .feature h3 {{
                margin-top: 0;
                color: #224abe;
                font-size: 16px;
                font-weight: 600;
            }}
            
            .feature p {{
                margin-bottom: 0;
                font-size: 14px;
            }}
            
            .footer {{
                background-color: #f8f9fc;
                padding: 20px 40px;
                text-align: center;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eaeaea;
            }}
            
            .social-links {{
                margin-top: 15px;
            }}
            
            .social-links a {{
                display: inline-block;
                margin: 0 8px;
                color: #666;
                font-size: 18px;
                text-decoration: none;
            }}
            
            @media (max-width: 480px) {{
                .container {{
                    margin: 10px;
                    width: auto;
                }}
                
                .content {{
                    padding: 20px;
                }}
                
                .feature {{
                    flex-basis: 100%;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://omgame.repl.co/static/images/logo.png" alt="OmGame Logo">
            </div>
            
            <div class="content">
                <h1>Merhaba {username}!</h1>
                <p>OmGame dünyasına hoş geldiniz! Artık aramıza katıldığınız için çok mutluyuz. OmGame'de zihinsel becerilerinizi geliştirebileceğiniz onlarca oyun, bilişsel yeteneklerinizi test eden zorlu görevler ve daha pek çok keyifli aktivite sizi bekliyor.</p>
                
                <a href="https://omgame.repl.co" class="button">Hemen Oynamaya Başla</a>
                
                <p>İşte OmGame'de seni bekleyen bazı özellikler:</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>Beyin Egzersizleri</h3>
                        <p>Beyin jimnastiği yaparak zihinsel becerilerinizi güçlendirin.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Hafıza Oyunları</h3>
                        <p>Hafıza oyunlarıyla odaklanma ve hatırlama yeteneklerinizi geliştirin.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Liderlik Tablosu</h3>
                        <p>Diğer oyuncularla rekabet edin ve en yüksek skorları görün.</p>
                    </div>
                    
                    <div class="feature">
                        <h3>Rozet Sistemi</h3>
                        <p>Başarılarınızı gösteren rozetler kazanın ve koleksiyonunuzu büyütün.</p>
                    </div>
                </div>
                
                <p>Herhangi bir sorunuz veya geri bildiriminiz için bize <a href="mailto:omgameee@gmail.com">omgameee@gmail.com</a> adresinden ulaşabilirsiniz.</p>
                
                <p>İyi oyunlar!</p>
                <p><em>OmGame Ekibi</em></p>
            </div>
            
            <div class="footer">
                <p>© 2024 OmGame. Tüm hakları saklıdır.</p>
                <p>Bu e-posta size kayıt olduğunuz için gönderilmiştir.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # E-postayı gönder
    logger.info(f"'{username}' kullanıcısına hoş geldin e-postası gönderiliyor: {to_email}")
    return send_email_in_background(to_email, subject, html_body)

# Doğrulama e-postası gönderme fonksiyonu kaldırıldı

def get_user_avatar(user_id):
    """
    Kullanıcının profil fotoğrafının URL'sini döndürür.
    Profil fotoğrafı yoksa varsayılan avatar URL'sini döndürür.

    URL'leri frontend'de kullanmak için hazır hale getirir.
    """
    try:
        user = User.query.get(user_id)
        if user and user.avatar_url and user.avatar_url.strip():
            # Kullanıcının avatar_url'si var, session'a kaydedelim
            if 'avatar_url' not in session or session['avatar_url'] != user.avatar_url:
                session['avatar_url'] = user.avatar_url
            return user.avatar_url
        else:
            # Kullanıcının avatar_url'si yok, session'dan silelim (varsa)
            if 'avatar_url' in session:
                session.pop('avatar_url', None)
            return "images/placeholder.jpg"  # Varsayılan profil fotoğrafı
    except Exception as e:
        print(f"Avatar URL alınırken hata: {str(e)}")
        return "images/placeholder.jpg"  # Hata durumunda varsayılan

@app.context_processor
def utility_processor():
    def get_current_user():
        """Session'daki kullanıcı kimliğine göre mevcut kullanıcıyı döndürür"""
        if 'user_id' in session:
            try:
                user = User.query.get(session['user_id'])
                return user
            except Exception as e:
                print(f"Kullanıcı bilgisi alınırken hata: {str(e)}")
                db.session.rollback()
        return None

    def get_user_data():
        """Session'daki kullanıcı bilgilerini döndürür"""
        if 'user_id' in session:
            try:
                user = User.query.get(session['user_id'])
                if user:
                    return {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'full_name': user.full_name,
                        'avatar_url': user.avatar_url,
                        'experience_points': user.experience_points,
                        'rank': user.rank,
                        'theme_preference': user.theme_preference or 'dark'
                    }
            except Exception as e:
                # Veritabanı hatası olursa session'ı temizle
                print(f"Kullanıcı verisi alınırken hata: {str(e)}")
                # Önceki işlemi geri al
                db.session.rollback()
        return None

    def get_avatar_url():
        """Kullanıcının avatar URL'sini döndürür"""
        if 'user_id' in session:
            try:
                return get_user_avatar(session['user_id'])
            except Exception as e:
                print(f"Kullanıcı avatar url'si alınırken hata: {str(e)}")
                db.session.rollback()
                return None
        return None

    def get_user_scores():
        """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
        if 'user_id' in session:
            try:
                scores = Score.query.filter_by(user_id=session['user_id']).all()
                result = {}
                for score in scores:
                    if score.game_type not in result or score.score > result[score.game_type]:
                        result[score.game_type] = score.score
                return result
            except Exception as e:
                print(f"Kullanıcı skorları alınırken hata: {str(e)}")
                db.session.rollback()
                return {}
        return {}

    return dict(
        get_current_user=get_current_user,
        get_user_data=get_user_data,
        get_avatar_url=get_avatar_url,
        get_user_scores=get_user_scores
    )

def initialize_database():
    """Initialize the database with sample data"""
    try:
        # Eğer herhangi bir kullanıcı yoksa, örnek veri oluştur
        if User.query.count() == 0:
            # Örnek kullanıcılar
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=generate_password_hash("password123"),
                full_name="Admin User",
                age=30,
                bio="ZekaPark platformunun yöneticisiyim.",
                location="İstanbul",
                experience_points=5000,
                rank="Uzman",
                total_games_played=100,
                highest_score=1000
            )

            demo = User(
                username="demo",
                email="demo@example.com",
                password_hash=generate_password_hash("demo123"),
                full_name="Demo User",
                age=25,
                bio="ZekaPark'ta bilişsel becerilerimi geliştiriyorum.",
                location="Ankara",
                experience_points=1500,
                rank="Orta Seviye",
                total_games_played=50,
                highest_score=750
            )

            db.session.add(admin)
            db.session.add(demo)

            # Admin paneli için admin kullanıcısı
            admin_user = AdminUser(
                username="admin",
                email="admin@omgame.com",
                password_hash=generate_password_hash("admin123"),
                role="admin",
                is_active=True,
                created_at=datetime.utcnow()
            )

            db.session.add(admin_user)

            # Örnek site ayarları ekle
            site_settings = [
                SiteSettings(setting_key="site_name", setting_value="OmGame", setting_type="text", category="general"),
                SiteSettings(setting_key="site_description", setting_value="Bilişsel Becerileri Geliştiren Eğitici Oyunlar", setting_type="text", category="general"),
                SiteSettings(setting_key="primary_color", setting_value="#4e73df", setting_type="color", category="theme"),
                SiteSettings(setting_key="secondary_color", setting_value="#1cc88a", setting_type="color", category="theme"),
                SiteSettings(setting_key="show_leaderboard", setting_value="true", setting_type="boolean", category="game"),
                SiteSettings(setting_key="show_achievements", setting_value="true", setting_type="boolean", category="game")
            ]

            for setting in site_settings:
                db.session.add(setting)

            # Örnek oyunlar
            games = [
                Game(
                    name="Tetris",
                    slug="tetris",
                    short_description="Klasik blok puzzle oyunu",
                    description="""<p>Tetris, klasik bir blok düzenleme oyunudur. Düşen blokları doğru yerleştirerek çizgileri tamamlayın ve puanları toplayın.</p>
                    <p>Oyun, hızlı düşünme, mekansal zeka ve planlama becerilerinizi geliştirmeye yardımcı olur.</p>""",
                    template_path="games/tetris.html",
                    categories="bulmaca,strateji",
                    difficulty="medium",
                    published=True,
                    featured=True,
                    created_by=1
                ),
                Game(
                    name="Yazma Hızı",
                    slug="typing-speed",
                    short_description="Klavye hızı ve doğruluk testi",
                    description="""<p>Yazma Hızı oyunu, klavye becerinizi test eder ve geliştirir. Belirli metinleri hızlı ve doğru bir şekilde yazarak yazma becerilerinizi geliştirin.</p>
                    <p>Bu oyun, parmak koordinasyonu, dikkat ve hızlı düşünme yeteneklerinizi artırır.</p>""",
                    template_path="games/typingSpeed.html",
                    categories="hız,konsantrasyon",
                    difficulty="easy",
                    published=True,
                    featured=False,
                    created_by=1
                ),
                Game(
                    name="Puzzle Slider",
                    slug="puzzle-slider",
                    short_description="Görsel bulmaca",
                    description="""<p>Puzzle Slider, parçalara ayrılmış bir görseli doğru şekilde birleştirmeniz gereken bir bulmaca oyunudur.</p>
                    <p>Bu oyun, görsel-uzamsal düşünme, dikkat ve problem çözme becerilerinizi geliştirir.</p>""",
                    template_path="games/puzzleSlider.html",
                    categories="bulmaca,dikkat",
                    difficulty="medium",
                    published=True,
                    featured=True,
                    created_by=1
                ),
                Game(
                    name="Renk Eşleştirme",
                    slug="color-match",
                    short_description="Odaklanma ve tepki oyunu",
                    description="""<p>Renk Eşleştirme oyununda, kelimelerin anlamı ve rengi arasındaki uyumu kontrol ederek hızlı tepki vermeniz gerekir.</p>
                    <p>Bu oyun, dikkat, hızlı tepki ve bilişsel esneklik becerilerinizi geliştirir.</p>""",
                    template_path="games/colorMatch.html",
                    categories="dikkat,hız",
                    difficulty="medium",
                    published=True,
                    featured=False,
                    created_by=1
                )
            ]

            for game in games:
                db.session.add(game)

            # Örnek skorlar
            admin_scores = [
                Score(user_id=1, game_type="wordPuzzle", score=850),
                Score(user_id=1, game_type="memoryMatch", score=920),
                Score(user_id=1, game_type="numberSequence", score=780),
                Score(user_id=1, game_type="3dRotation", score=700)
            ]

            demo_scores = [
                Score(user_id=2, game_type="wordPuzzle", score=650),
                Score(user_id=2, game_type="memoryMatch", score=720),
                Score(user_id=2, game_type="numberSequence", score=580),
                Score(user_id=2, game_type="3dRotation", score=500)
            ]

            for score in admin_scores + demo_scores:
                db.session.add(score)

            # Örnek makaleler
            articles = [
                Article(
                    title="Bilişsel Becerileri Geliştirmenin Önemi",
                    content="""
                    <h3>Neden Bilişsel Becerilerimizi Geliştirmeliyiz?</h3>
                    <p>Bilişsel becerilerimiz, günlük yaşamda bilgiyi işleme, anlama ve kullanma yeteneğimiz için temel oluşturur. Bu becerileri düzenli olarak geliştirmek şunları sağlar:</p>
                    <ul>
                        <li>Daha iyi problem çözme yeteneği</li>
                        <li>Gelişmiş hafıza ve konsantrasyon</li>
                        <li>Daha hızlı bilgi işleme</li>
                        <li>Yaşla ilgili bilişsel gerilemenin yavaşlatılması</li>
                        <li>Genel zihinsel esnekliğin artması</li>
                    </ul>

                    <h4>Temel Bilişsel Beceriler</h4>
                    <p>ZekaPark'taki oyunlarımız aşağıdaki temel bilişsel becerileri geliştirmeye odaklanır:</p>
                    <ul>
                        <li><strong>Dikkat ve Konsantrasyon:</strong> Odaklanma sürenizi ve dış uyarıcılara rağmen konsantrasyonunuzu koruma yeteneğinizi geliştirir.</li>
                        <li><strong>İşleyen Bellek:</strong> Zihninizde bilgiyi kısa süre tutma ve manipüle etme becerinizi güçlendirir.</li>
                        <li><strong>İşleme Hızı:</strong> Zihinsel görevleri hızlı ve verimli bir şekilde tamamlama becerinizi artırır.</li>
                        <li><strong>Görsel-Uzamsal Düşünme:</strong> Zihinsel rotasyon ve uzamsal ilişkileri anlama yeteneğinizi geliştirir.</li>
                        <li><strong>Mantıksal Akıl Yürütme:</strong> Problem çözme ve kritik düşünme becerinizi iyileştirir.</li>
                    </ul>

                    <h4>Bilimsel Temeller</h4>
                    <p>Beyin egzersizinin bilişsel sağlık üzerindeki olumlu etkileri, nöroplastisite kavramına dayanır - yani beynin yeni öğrenme deneyimlerine yanıt olarak kendini yeniden şekillendirme ve yeni nöral yollar oluşturma yeteneği.</p>
                    <p>Düzenli beyin egzersizi, nöronlar arasındaki bağlantıları güçlendirir ve hatta yeni bağlantıların oluşmasını teşvik eder, bu da bilişsel rezervinizi artırır - beyninizin hasara veya yaşlanmaya karşı direncini artıran bir kaynak.</p>

                    <h4>ZekaPark Yaklaşımı</h4>
                    <p>ZekaPark'ta, bilimsel olarak tasarlanmış oyunlar, eğlence ve bilişsel gelişimin mükemmel birleşimini sunuyoruz. Her oyun belirli bilişsel becerilere hitap eden zorluklar sunar, öğrenme eğrisini artırır ve düzenli olarak oynandığında uzun vadeli bilişsel faydalar sağlar.</p>
                    <p>Temel prensiplerimiz şunlardır:</p>
                    <ul>
                        <li>Artan zorluk seviyesi - çünkü beyninizin gelişmesi için kendini zorlaması gerekir</li>
                        <li>Çeşitlilik - farklı bilişsel becerilerin bütünsel gelişimi için</li>
                        <li>Süreklilik - bilişsel gelişim, düzenli uygulama gerektirir</li>
                        <li>Kişiselleştirme - özel zayıf yönleri ve güçlü yönleri hedeflemek için</li>
                        <li>Eğlence - çünkü keyif aldığınız aktivitelere daha fazla odaklanır ve bağlı kalırsınız</li>
                    </ul>
                    <p>ZekaPark'ta düzenli oynayarak, günlük yaşamda fark edebileceğiniz uzun süreli bilişsel gelişim sağlayın.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Beyin Sağlığını Destekleyen Besinler",
                    content="""
                    <h3>Bilişsel Performansı Artırmak İçin Beslenme</h3>
                    <p>Düzenli beyin egzersizlerinin yanı sıra, doğru beslenme de optimal beyin sağlığı ve bilişsel performans için kritik öneme sahiptir. Beyin, vücudumuzun enerji tüketiminin yaklaşık %20'sini gerçekleştirir, bu nedenle doğru yakıtla beslenmesi gerekir.</p>

                    <h4>Beyin dostu besinler:</h4>
                    <ul>
                        <li><strong>Yağlı Balıklar:</strong> Somon, sardalye ve uskumru gibi balıklar, beyin sağlığı için önemli olan omega-3 yağ asitleri açısından zengindir.</li>
                        <li><strong>Kuruyemişler ve Tohumlar:</strong> Ceviz, badem, keten tohumu ve chia, sağlıklı yağlar, antioksidanlar ve E vitamini içerir.</li>
                        <li><strong>Yaban Mersini ve Diğer Meyveler:</strong> Antioksidanlarla dolu olan bu meyveler, beyin hücrelerini oksidatif stresten korur.</li>
                        <li><strong>Tam Tahıllar:</strong> Kompleks karbonhidratlar, beyninize sabit bir enerji kaynağı sağlar.</li>
                        <li><strong>Zerdeçal ve Tarçın:</strong> Bu baharatlar güçlü anti-enflamatuar özelliklere sahiptir ve nöron sağlığını destekleyebilir.</li>
                        <li><strong>Koyu Çikolata:</strong> Flavonoidler içeren koyu çikolata, beyin kan akışını artırabilir.</li>
                    </ul>
                    <p>Beyninizi beslemek için bu besinleri düzenli olarak tüketmeyi ve işlenmiş gıdaları, rafine şekerleri ve trans yağları sınırlandırmayı hedefleyin.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Stresin Beyin Üzerindeki Etkileri ve Yönetimi",
                    content="""
                    <h3>Stres ve Bilişsel Performans</h3>
                    <p>Kısa süreli stres, odaklanmayı ve performansı artırabilirken, kronik stres beyin yapısını ve işlevini olumsuz etkileyebilir.</p>

                    <h4>Kronik stresin beyin üzerindeki etkileri:</h4>
                    <ul>
                        <li>Hipokampusta (hafıza merkezi) hacim kaybı</li>
                        <li>Nöron bağlantılarının azalması</li>
                        <li>Kortizon seviyelerinin yükselmesi ve hafıza üzerinde olumsuz etki</li>
                        <li>Beyin kimyasalları dengesi üzerinde bozucu etki</li>
                        <li>Prefrontal korteksin (karar verme merkezi) işlevinde azalma</li>
                    </ul>

                    <h4>Stres yönetimi teknikleri:</h4>
                    <ul>
                        <li><strong>Derin Nefes Egzersizleri:</strong> Günde birkaç dakika derin nefes alıp vermek, sempatik sinir sistemini sakinleştirebilir.</li>
                        <li><strong>Meditasyon ve Mindfulness:</strong> Bu pratikler, beynin stres tepkisini düzenleyen bölgelerini güçlendirir.</li>
                        <li><strong>Düzenli Fiziksel Aktivite:</strong> Egzersiz, stresi azaltan endorfinlerin salınımını tetikler.</li>
                        <li><strong>Yeterli Uyku:</strong> Kaliteli uyku, stres hormonlarını düzenler ve duygusal dengeyi destekler.</li>
                        <li><strong>Sosyal Bağlantılar:</strong> Destekleyici ilişkiler, stres tepkilerini hafifletebilir.</li>
                        <li><strong>Eğlenceli Aktiviteler:</strong> ZekaPark'taki beyin oyunları gibi eğlenceli aktiviteler, zihinsel molanın bir formudur ve stresi azaltabilir.</li>
                    </ul>
                    <p>Düzenli stres yönetimi, bilişsel sağlığınızı korumanın ve ZekaPark oyunlarında optimal performans göstermenin anahtarıdır.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Dikkat Kontrolü ve Odaklanma Becerileri",
                    content="""
                    <h3>Dikkat Dağınıklığını Yenme ve Odaklanma Gücünüzü Artırma</h3>
                    <p>Modern dünyada sürekli dikkat dağıtıcılarla karşı karşıyayız. Ancak dikkatimizi kontrol etme yeteneğimizi geliştirebiliriz.</p>
                    
                    <h4>Dikkat kontrolünü geliştirme teknikleri:</h4>
                    <ul>
                        <li><strong>Pomodoro Tekniği:</strong> 25 dakika tam odaklanma, 5 dakika mola vererek çalışın.</li>
                        <li><strong>Tek Görev Odaklı Çalışma:</strong> Multitasking yerine, bir seferde tek göreve odaklanın.</li>
                        <li><strong>Dikkat Dağıtıcıları Azaltın:</strong> Çalışma ortamınızı bildirimlerden ve gürültüden arındırın.</li>
                        <li><strong>Mindfulness Meditasyonu:</strong> Düzenli meditasyon, dikkat kontrolü için beyni eğitir.</li>
                        <li><strong>OmGame Dikkat Oyunları:</strong> Visual Attention ve Pattern Recognition gibi oyunlar, dikkat becerinizi güçlendirir.</li>
                    </ul>
                    
                    <p>Bu teknikleri günlük yaşamınıza entegre ederek ve düzenli beyin egzersizleri yaparak, zamanla dikkat kontrolünüzü önemli ölçüde geliştirebilirsiniz.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Daha İyi Konsantrasyon İçin İpuçları",
                    content="""
                    <ol>
                        <li><strong>Yeterli Uyku:</strong> Düzenli ve kaliteli uyku, beyin fonksiyonlarınız için kritik öneme sahiptir.</li>
                        <li><strong>Beslenme:</strong> Omega-3, antioksidanlar ve kompleks karbonhidratlar beyin sağlığınız için önemlidir.</li>
                        <li><strong>Meditasyon:</strong> Günlük kısa meditasyon seansları odaklanma yeteneğinizi artırabilir.</li>
                        <li><strong>Egzersiz:</strong> Fiziksel aktivite, beyninize oksijen akışını artırır ve bilişsel işlevleri destekler.</li>
                        <li><strong>Mola Verin:</strong> Uzun süre aynı göreve odaklanmak yerine düzenli molalar verin.</li>
                    </ol>
                    """,
                    category="article"
                ),
                Article(
                    title="Bilişsel Becerileri Geliştirmenin Günlük Yaşama Etkileri",
                    content="""
                    <h3>Oyunlar Ötesinde Faydalar</h3>
                    <p>Beyin egzersizlerinin yararları sadece oyun performansınızla sınırlı değildir. Geliştirdiğiniz bilişsel beceriler, günlük yaşamın çeşitli alanlarında da size avantaj sağlar.</p>

                    <h4>Gelişmiş bilişsel becerilerin günlük yaşamdaki yansımaları:</h4>
                    <ul>
                        <li><strong>İş ve Akademik Performans:</strong> Daha hızlı öğrenme, daha iyi problem çözme ve gelişmiş kritik düşünme becerileri.</li>
                        <li><strong>Günlük Görevler:</strong> Alışveriş listesini hatırlama, randevulara zamanında gitme ve çoklu görevleri daha verimli yönetme.</li>
                        <li><strong>İletişim:</strong> Daha iyi dinleme, daha keskin sözel beceriler ve daha iyi sosyal ipuçları algılama.</li>
                        <li><strong>Yaratıcılık:</strong> Daha geniş düşünme, farklı bakış açıları geliştirme ve daha yenilikçi çözümler bulma.</li>
                        <li><strong>Duygusal Zeka:</strong> Duyguları daha iyi tanıma, dürtüleri kontrol etme ve stresle başa çıkma yeteneği.</li>
                        <li><strong>Yaşla İlgili Gerilemeye Karşı Koruma:</strong> Bilişsel rezerv oluşturarak yaşlanmanın etkilerine karşı direnç geliştirme.</li>
                    </ul>
                    <p>ZekaPark'ta düzenli olarak egzersiz yapmak, beyninizin "kas belleğini" geliştirerek bu becerileri günlük yaşamınıza daha kolay aktarmanızı sağlar.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Hafıza Geliştirme Teknikleri",
                    content="""
                    <h3>Hafızanızı geliştirmek için deneyebileceğiniz etkili teknikler:</h3>
                    <ul>
                        <li><strong>Görselleştirme:</strong> Hatırlamak istediğiniz bilgiyi canlı görüntülerle ilişkilendirin.</li>
                        <li><strong>Çağrışım:</strong> Yeni bilgileri, zaten bildiğiniz şeylerle ilişkilendirin.</li>
                        <li><strong>Bölme:</strong> Uzun bilgi dizilerini daha küçük, yönetilebilir parçalara ayırın.</li>
                        <li><strong>Tekrar:</strong> Aralıklı tekrar, bilgilerin uzun süreli hafızaya geçmesini sağlar.</li>
                        <li><strong>Hikaye Tekniği:</strong> Hatırlanması gereken öğeleri bir hikaye içinde birleştirin.</li>
                    </ul>
                    <p>Bu teknikleri ZekaPark oyunlarında pratik ederek hafızanızı güçlendirebilirsiniz.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Nöroplastisite: Beynin Kendini Yenileme Gücü",
                    content="""
                    <h3>Beynin İnanılmaz Uyum Yeteneği</h3>
                    <p>Nöroplastisite, beynin yaşam boyu değişme, uyum sağlama ve yeniden yapılanma yeteneğidir. Bu özellik, beyin egzersizlerinin neden bu kadar etkili olduğunu açıklar.</p>
                    
                    <h4>Nöroplastisitenin temel özellikleri:</h4>
                    <ul>
                        <li><strong>Yaşam Boyu Sürer:</strong> Beyin plastisitesi yaşlanmayla azalsa da hiçbir zaman tamamen kaybolmaz.</li>
                        <li><strong>Kullan ya da Kaybet:</strong> Aktif olarak kullanılan beyin bölgeleri güçlenirken, kullanılmayanlar zayıflar.</li>
                        <li><strong>Bağlantı Ağları:</strong> Tekrarlanan aktiviteler, nöronlar arasında daha güçlü bağlantılar oluşturur.</li>
                        <li><strong>Çevresel Uyarılar:</strong> Zengin ve uyarıcı ortamlar, beyin plastisite süreçlerini destekler.</li>
                    </ul>
                    
                    <p>OmGame'deki beyin egzersizleri, çeşitli bilişsel zorluklar sunarak, beyninizin farklı bölgelerini aktive eder ve nöroplastisite süreçlerini teşvik eder. Bu süreçler, bilişsel becerilerin geliştirilmesi ve korunması için temel oluşturur.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Zihinsel Dayanıklılık Geliştirme",
                    content="""
                    <h3>Zorluklarla Başa Çıkma Kapasitesini Artırmak</h3>
                    <p>Zihinsel dayanıklılık, bilişsel zorluklarla karşılaştığınızda pes etmeden devam etme yeteneğidir. Bu özellik, tüm beyin egzersizlerinde ve gerçek yaşam zorluklarında başarı için kritiktir.</p>

                    <h4>Zihinsel dayanıklılığı geliştirme stratejileri:</h4>
                    <ul>
                        <li><strong>Zorluk Seviyesini Kademeli Artırın:</strong> Kendinizi konfor alanınızın biraz dışına çıkaran, ama tamamen bunaltmayan zorluklarla düzenli olarak meydan okuyun.</li>
                        <li><strong>Hatalardan Öğrenin:</strong> Her başarısızlığı öğrenme fırsatı olarak görün ve neyin işe yaramadığını analiz edin.</li>
                        <li><strong>Olumlu İç Konuşma:</strong> Kendinizle konuşma şeklinize dikkat edin. "Yapamam" yerine "Henüz yapamıyorum, ama pratikle gelişeceğim" demeyi deneyin.</li>
                        <li><strong>Mikro-Hedefler Belirleyin:</strong> Büyük zorlukları daha küçük, ulaşılabilir adımlara bölün.</li>
                        <li><strong>Başarılarınızı Takdir Edin:</strong> Küçük ilerlemeleri bile kutlayın ve kendinizi düzenli olarak ödüllendirin.</li>
                    </ul>
                    <p>ZekaPark'taki oyunları oynarken, zor bölümlerde pes etmeyip stratejinizi ayarlayarak zihinsel dayanıklılığınızı geliştirebilirsiniz. Bu yetenek zamanla gelişir ve günlük yaşamınızdaki engelleri aşmanıza da yardımcı olur.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Sabah Rutinleriyle Zihinsel Performansı Artırma",
                    content="""
                    <h3>Güne Zihinsel Olarak Hazır Başlamak İçin İpuçları</h3>
                    <p>Sabah rutininiz, günün geri kalanında beyin performansınızı önemli ölçüde etkileyebilir. İşte zihinsel netliği ve odaklanmayı artırmak için sabah rutini önerileri:</p>
                    
                    <ul>
                        <li><strong>Tutarlı Uyku Programı:</strong> Her gün aynı saatte uyanmak, biyolojik saatinizi düzenler ve zihinsel netliği artırır.</li>
                        <li><strong>Güneş Işığı:</strong> Uyandıktan sonra en az 10 dakika doğal güneş ışığına maruz kalmak, uyku hormonlarını baskılar ve dikkat hormonlarını artırır.</li>
                        <li><strong>Sabah Egzersizi:</strong> Kısa bir yürüyüş veya 5-10 dakikalık hafif egzersiz, beyne oksijen akışını artırarak zihinsel berraklığı hızla yükseltir.</li>
                        <li><strong>Soğuk Duş:</strong> Kısa bir soğuk duş veya yüzünüzü soğuk suyla yıkamak, beyin aktivitesini uyarır ve odaklanmayı artırır.</li>
                        <li><strong>Meditasyon:</strong> 5-10 dakikalık sabah meditasyonu, gün boyu dikkat kontrolünü geliştirir ve stres seviyelerini düşürür.</li>
                        <li><strong>Dengeli Kahvaltı:</strong> Protein, sağlıklı yağlar ve kompleks karbonhidratlar içeren bir kahvaltı, sabit enerji ve zihinsel performans sağlar.</li>
                    </ul>
                    
                    <p>Bu sabah alışkanlıklarını ZekaPark'ta oyun oynamadan önce uygulamak, özellikle zorlu zihinsel oyunlarda daha iyi skorlar elde etmenize yardımcı olabilir.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Dikkat Dağınıklığını Yenme Stratejileri",
                    content="""
                    <h3>Daha İyi Odaklanmak İçin Pratik Yöntemler</h3>
                    <p>Günümüzün dijital dünyasında dikkat dağınıklığı, bilişsel performansı önemli ölçüde düşürebilir. İşte dikkat sürenizi ve odaklanma kalitesini artırmak için bilimsel olarak kanıtlanmış stratejiler:</p>
                    
                    <ul>
                        <li><strong>Pomodoro Tekniği:</strong> 25 dakika tam odaklanma, 5 dakika mola döngüsüyle çalışın. Dört döngü sonunda daha uzun bir mola verin.</li>
                        <li><strong>Tek Görev Odaklı Çalışma:</strong> Multitasking, her iki görevi de daha kötü yapmanıza neden olur. Bir seferde tek bir işe odaklanın.</li>
                        <li><strong>Bildirim Detoksu:</strong> Çalışırken telefon ve bilgisayar bildirimlerini kapatın veya sessiz moda alın.</li>
                        <li><strong>Rahatsız Edilmeme Saatleri:</strong> Günde 1-2 saat "rahatsız edilmeme zamanı" belirleyin ve bunu çevrenizdekilerle paylaşın.</li>
                        <li><strong>Düzenli Beyin Molaları:</strong> Her 90 dakikada bir, beyne dinlenme fırsatı vererek kısa molalar verin. Bu, uzun vadeli odaklanmayı artırır.</li>
                        <li><strong>Ortam Düzenlemesi:</strong> Çalışma alanınızı dikkat dağıtıcı unsurlardan arındırın ve sadece gerekli araçları bulundurun.</li>
                    </ul>
                    
                    <p>ZekaPark oyunlarını oynarken bu stratejileri uygulayarak daha iyi sonuçlar elde edebilir, puanlarınızı artırabilirsiniz. Özellikle bellek ve dikkat gerektiren oyunlarda bu tekniklerin önemli faydaları olacaktır.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Duygusal Zeka ve Bilişsel Performans İlişkisi",
                    content="""
                    <h3>Duygusal Zekanızı Geliştirerek Bilişsel Performansınızı Artırın</h3>
                    <p>Duygusal zeka, duygularınızı tanıma, anlama ve yönetme yeteneğidir. Bu yetenek, sadece sosyal ilişkilerinizi değil, aynı zamanda zihinsel performansınızı da önemli ölçüde etkiler.</p>
                    
                    <h4>Duygusal zekanın bilişsel performansa katkısı:</h4>
                    <ul>
                        <li><strong>Stres Yönetimi:</strong> Duygularınızı etkili bir şekilde yönetmek, kortizol seviyelerini düşürür ve hipokampus ile prefrontal korteksin (hafıza ve karar verme merkezleri) daha iyi çalışmasını sağlar.</li>
                        <li><strong>Duygusal Farkındalık:</strong> Hangi duyguların düşüncelerinizi etkilediğini anlamak, olumsuz düşünce kalıplarını kırmaya yardımcı olur.</li>
                        <li><strong>Öz-motivasyon:</strong> İçsel motivasyonu artırmak, zorlu görevlerde daha uzun süre odaklanmayı sağlar.</li>
                        <li><strong>Bilişsel Esneklik:</strong> Farklı duygusal perspektifleri anlama yeteneği, problem çözmede daha yaratıcı yaklaşımlar geliştirmenize olanak tanır.</li>
                    </ul>
                    
                    <h4>Duygusal zekanızı geliştirmek için alıştırmalar:</h4>
                    <ul>
                        <li><strong>Duygu Günlüğü:</strong> Her gün hissettiğiniz duyguları ve bunların altında yatan nedenleri not edin.</li>
                        <li><strong>Aktif Dinleme:</strong> Konuşurken tam dikkatinizi vererek ve yargılamadan dinlemeyi alışkanlık haline getirin.</li>
                        <li><strong>Duygu Düzenleme:</strong> Olumsuz duygular hissettiğinizde bunları bastırmak yerine, "Bu duygu bana ne anlatmaya çalışıyor?" diye sorun.</li>
                        <li><strong>Empati Pratiği:</strong> Her gün farklı bir kişinin bakış açısını anlamaya çalışın.</li>
                    </ul>
                    
                    <p>ZekaPark'ta oyun oynarken duygusal zekanızın farkında olmak, özellikle baskı altında veya rekabetçi durumlarda daha iyi performans göstermenize yardımcı olacaktır.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Oyun Oynarken Optimum Performans İçin Hazırlık",
                    content="""
                    <h3>Oyuna Başlamadan Önce En İyi Performans İçin İpuçları</h3>
                    <ol>
                        <li><strong>Hidrasyon:</strong> Oyuna başlamadan önce ve oyun sırasında su için. Hafif dehidrasyon bile bilişsel performansı düşürebilir.</li>
                        <li><strong>Duruş Kontrolü:</strong> Omurganızı dik tutacak ergonomik bir oturma pozisyonu belirleyin. İyi duruş, oksijen akışını ve odaklanmayı destekler.</li>
                        <li><strong>Göz Dinlendirme:</strong> Her 20 dakikada bir, 20 saniye boyunca 20 feet (yaklaşık 6 metre) uzağa bakarak gözlerinizi dinlendirin (20-20-20 kuralı).</li>
                        <li><strong>Beyin Isınması:</strong> Tam konsantrasyona ihtiyaç duyan oyunlara başlamadan önce basit zihinsel egzersizlerle ısının.</li>
                        <li><strong>Arka Plan Müziği:</strong> Dikkatinizi dağıtmayan, sabit tempolu enstrümantal müzik, bazı kişilerde konsantrasyonu artırabilir.</li>
                        <li><strong>Dikkat Dağıtıcıları Kaldırın:</strong> Optimum performans için telefonunuzu sessize alın ve diğer dikkat dağıtıcıları minimize edin.</li>
                    </ol>
                    """,
                    category="tip"
                ),
                Article(
                    title="Yaşlılıkta Bilişsel Canlılığı Koruma",
                    content="""
                    <h3>Her Yaşta Zihinsel Keskinliği Koruma</h3>
                    <p>Yaşlanma bazı bilişsel değişikliklerle ilişkilendirilse de, düzenli zihinsel aktivite ve sağlıklı alışkanlıklar, bu değişiklikleri yavaşlatabilir veya bazı durumlarda tersine çevirebilir.</p>

                    <h4>Her yaşta bilişsel sağlığı desteklemek için:</h4>
                    <ul>
                        <li><strong>Sürekli Öğrenme:</strong> Yeni beceriler ve konular öğrenmek, yeni nöral yollar oluşturur.</li>
                        <li><strong>Beyin Jimnastiği:</strong> ZekaPark oyunları gibi düzenli bilişsel aktiviteler, beyninizi aktif tutar.</li>
                        <li><strong>Sosyalleşme:</strong> Sosyal etkileşim, bilişsel gerilemeye karşı koruma sağlar.</li>
                        <li><strong>Fiziksel Aktivite:</strong> Düzenli egzersiz, beyin hücrelerini besleyen kan akışını artırır.</li>
                        <li><strong>Dengeli Beslenme:</strong> Akdeniz diyeti gibi beyin dostu beslenme modelleri, bilişsel sağlığı destekler.</li>
                        <li><strong>Kaliteli Uyku:</strong> Uyku sırasında, beyin toksinlerden arınır ve hafıza konsolidasyonu gerçekleşir.</li>
                        <li><strong>Stres Yönetimi:</strong> Kronik stres, hipokampus dahil beynin önemli bölgelerine zarar verebilir.</li>
                    </ul>
                    <p>Yaşlanma sürecinde bilişsel işlevleri korumak için en etkili stratejilerden biri, çeşitli zorluklarla beyninizi düzenli olarak çalıştırmaktır. ZekaPark platformu, her yaştan kullanıcılar için bilişsel stimülasyon için eğlenceli bir yol sunar.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Çocuklarda Bilişsel Gelişimi Teşvik Etme",
                    content="""
                    <h3>Gençlerde Bilişsel Büyümeyi Destekleme</h3>
                    <p>Çocukluk, beyin gelişiminde kritik bir dönemdir. Aşağıdaki stratejiler, çocuğunuzun bilişsel potansiyelini en üst düzeye çıkarmasına yardımcı olabilir.</p>

                    <h4>Çocuğunuzun beyin gelişimini desteklemek için:</h4>
                    <ul>
                        <li><strong>Etkileşimli Oyun:</strong> Yaş uygun beyin oyunları, bilmeceleri ve beyin egzersizleri, bilişsel becerileri güçlendirir.</li>
                        <li><strong>Açık Uçlu Sorular:</strong> Çocuğunuza "neden" ve "nasıl" soruları sorarak kritik düşünme becerilerini geliştirin.</li>
                        <li><strong>Okuma Alışkanlığı:</strong> Düzenli okuma, dil becerileri, hayal gücü ve odaklanmayı geliştirir.</li>
                        <li><strong>Fiziksel Aktivite:</strong> Hareket, beyin gelişimi için önemlidir ve koordinasyon, denge ve uzamsal farkındalığı geliştirir.</li>
                        <li><strong>Müzik ve Sanat:</strong> Müzik eğitimi ve yaratıcı sanat çalışmaları beynin her iki yarımküresini de çalıştırır.</li>
                        <li><strong>Sınırlı Ekran Süresi:</strong> Ekran zamanını kısıtlamak ve anlamlı teknoloji etkileşimlerini teşvik etmek.</li>
                        <li><strong>Sağlıklı Beslenme:</strong> DHA gibi beyin dostu besin maddeleri sağlayan dengeli beslenme.</li>
                        <li><strong>Tutarlı Uyku Düzeni:</strong> Yeterli ve düzenli uyku, bilişsel gelişim için hayati önem taşır.</li>
                    </ul>
                    <p>ZekaPark gibi platform, çocuklar ve gençler için yaşa uygun zorluklar sunarak eğlenceli bir bilişsel gelişim yolu sağlar.</p>
                    """,
                    category="article"
                ),
                Article(
                    title="Oyunlarda En Yüksek Puanı Almak İçin Stratejiler",
                    content="""
                    <h3>Skorunuzu En Üst Düzeye Çıkarmak İçin İpuçları</h3>
                    <ol>
                        <li><strong>Konsantrasyonunuzu Maksimize Edin:</strong> Dikkat dağıtıcı olmayan bir ortamda oynayın.</li>
                        <li><strong>Oyun Mekaniklerini Öğrenin:</strong> Her oyunun puanlama sistemini ve en iyi stratejilerini öğrenin.</li>
                        <li><strong>Düzenli Pratik Yapın:</strong> Beceriler zamanla gelişir, düzenli oynamak iyileşmeye yol açar.</li>
                        <li><strong>Zamanlamanızı İyileştirin:</strong> Birçok oyunda hızlı ve doğru yanıtlar daha yüksek puanlar sağlar.</li>
                        <li><strong>Kendi Rekorlarınızı Takip Edin:</strong> Gelişiminizi takip edin ve kendi skorlarınızı geçmeye çalışın.</li>
                        <li><strong>Rakiplerinizi Gözlemleyin:</strong> Lider tablosundaki üst düzey oyuncuların stratejilerini anlamaya çalışın.</li>
                        <li><strong>Yorgunken Oynamaktan Kaçının:</strong> Beyniniz en keskin olduğunda oynayın.</li>
                        <li><li><strong>Başarısızlıkları Analiz Edin:</strong> Hatalarınızdan öğrenin ve stratejinizi buna göre ayarlayın.</li>
                    </ol>
<p>ZekaPark oyunlarındayüksek puan almak, sadece eğlencelibir rekabet değil, aynı zamanda bilişsel becerilerinizin gelişimine de bir işarettir.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Çalışma Hafızasını Güçlendirme Teknikleri",
                    content="""
                    <h3>Çalışma Hafızanızı Geliştirmek İçin Pratik Yöntemler</h3>
                    <p>Çalışma hafızası, bilgileri geçici olarak tutup işleme yeteneğinizdir ve problem çözme, karar verme ve öğrenme için hayati önem taşır.</p>
                    
                    <h4>Çalışma hafızasını güçlendirme alıştırmaları:</h4>
                    <ul>
                        <li><strong>Geri Sayım Egzersizleri:</strong> 100'den geriye 7'şer sayarak gidin. Bu, hem konsantrasyon hem de çalışma hafızası için mükemmel bir egzersizdir.</li>
                        <li><strong>Dual N-Back Oyunları:</strong> OmGame'deki N-Back oyunu, çalışma hafızasını geliştirmek için özel olarak tasarlanmıştır.</li>
                        <li><strong>Akıldan Hesaplama:</strong> Günlük hesaplamaları hesap makinesi olmadan yapmaya çalışın.</li>
                        <li><strong>Alışveriş Listesi Ezberleme:</strong> Alışveriş listenizi ezberlemeye çalışın ve markette ne kadar doğru hatırladığınızı kontrol edin.</li>
                    </ul>
                    
                    <p>Günlük yaşamda bu teknikleri uygulayarak ve OmGame'deki hafıza oyunlarını düzenli oynayarak, çalışma hafızanızı kademeli olarak geliştirebilirsiniz.</p>
                    """,
                    category="tip"
                ),
                Article(
                    title="Beyni Yaşlandıkça Sağlıklı Tutmak",
                    content="""
                    <h3>Bilişsel Sağlığı Yaş Aldıkça Koruma Yöntemleri</h3>
                    <p>Yaşlanma kaçınılmaz olsa da, bilişsel gerilemeyi yavaşlatmak ve beyni sağlıklı tutmak için atılabilecek birçok adım vardır.</p>
                    """,
                    category="tip"
                ),
            ]
            db.session.add_all(articles)
            db.session.commit()
            
            logging.info(f"Created {len(articles)} articles")
            return "Veritabanı başarıyla başlatıldı!"
    except Exception as e:
        logging.error(f"Veritabanı başlatma hatası: {str(e)}")
        return f"Veritabanı başlatma hatası: {str(e)}"

@app.route('/profile/update/avatar', methods=['POST'])
def update_avatar():
    """Kullanıcı profil fotoğrafını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı!'})

        # Avatar seçimi kontrolü
        selected_avatar = request.form.get('selected_avatar', '')
        
        # Dosya yükleme kontrolü
        if 'avatar' in request.files and request.files['avatar'].filename:
            # Dosya yüklendi
            avatar_file = request.files['avatar']
            
            # Dosya doğrulama
            if not allowed_file(avatar_file.filename):
                return jsonify({'success': False, 'message': 'Geçersiz dosya formatı! İzin verilen formatlar: JPG, JPEG, PNG, GIF'})
            
            if not avatar_file.content_type.startswith('image/'):
                return jsonify({'success': False, 'message': 'Yüklenen dosya bir resim değil!'})
            
            # Dosya boyutu kontrolü (5MB)
            avatar_file.seek(0, os.SEEK_END)
            file_size = avatar_file.tell()
            avatar_file.seek(0)
            
            if file_size > 5 * 1024 * 1024:  # 5MB
                return jsonify({'success': False, 'message': 'Dosya boyutu çok büyük! Maksimum 5MB.'})
            
            # Güvenli dosya adı oluştur
            filename = secure_filename(avatar_file.filename)
            timestamp = int(time.time())
            new_filename = f"{user.id}_{timestamp}_{filename}"
            
            # Dosya yolunu oluştur ve kaydet
            upload_folder = os.path.join('static', 'uploads', 'avatars')
            os.makedirs(upload_folder, exist_ok=True)
            
            filepath = os.path.join(upload_folder, new_filename)
            avatar_file.save(filepath)
            
            # Veritabanında güncelle
            avatar_url = os.path.join('uploads', 'avatars', new_filename)
            user.avatar_url = avatar_url
            db.session.commit()
            
            logger.info(f"Kullanıcı {user.username} profil fotoğrafını güncelledi. Dosya: {new_filename}")
            return jsonify({'success': True, 'message': 'Profil fotoğrafı başarıyla güncellendi!', 'avatar_url': avatar_url})
            
        elif selected_avatar:
            # Hazır avatar seçildi
            user.avatar_url = selected_avatar
            db.session.commit()
            
            logger.info(f"Kullanıcı {user.username} hazır avatar seçti: {selected_avatar}")
            return jsonify({'success': True, 'message': 'Avatar başarıyla güncellendi!', 'avatar_url': selected_avatar})
        
        else:
            return jsonify({'success': False, 'message': 'Lütfen bir fotoğraf yükleyin veya hazır avatar seçin!'})
    
    except Exception as e:
        logger.error(f"Avatar güncelleme hatası: {str(e)}")
        return jsonify({'success': False, 'message': 'Avatar güncellenirken bir hata oluştu!'})

def allowed_file(filename):
    """Dosya uzantısının izin verilen formatlardan olup olmadığını kontrol eder."""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/profile/remove/avatar', methods=['POST'])
def remove_avatar():
    """Kullanıcı avatarını kaldırma."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı!'})
        
        # Kullanıcının avatar yolunu kaydet (eğer dosyaysa silmek için)
        old_avatar = user.avatar_url
        
        # Varsayılan avatarı ayarla
        user.avatar_url = "avatars/default/default_avatar.png"
        db.session.commit()
        
        # Eğer önceki avatar bir dosya yüklemesiyse ve uploads klasöründeyse dosyayı sil
        if old_avatar and 'uploads' in old_avatar:
            try:
                avatar_path = os.path.join('static', old_avatar)
                if os.path.exists(avatar_path):
                    os.remove(avatar_path)
                    logger.info(f"Kullanıcı {user.username} dosya avatarı silindi: {old_avatar}")
            except Exception as e:
                logger.error(f"Avatar dosyası silinirken hata: {str(e)}")
        
        logger.info(f"Kullanıcı {user.username} avatarını kaldırdı")
        return jsonify({
            'success': True, 
            'message': 'Avatar başarıyla kaldırıldı!',
            'default_avatar': user.avatar_url
        })
        
    except Exception as e:
        logger.error(f"Avatar kaldırma hatası: {str(e)}")
        return jsonify({'success': False, 'message': 'Avatar kaldırılırken bir hata oluştu!'})

@app.route('/initialize-database')
def initialize_database():
    try:
        # Veritabanında kullanıcı var mı kontrol et
        if User.query.count() == 0:
            # Test kullanıcıları oluştur
            users = [
                User(
                    username="admin",
                    email="admin@example.com",
                    password_hash=generate_password_hash("adminpass"),
                    role="admin",
                    is_verified=True,
                    avatar_url="avatars/default/default_avatar.png"
                ),
                User(
                    username="test",
                    email="test@example.com",
                    password_hash=generate_password_hash("testpass"),
                    role="user",
                    is_verified=True,
                    avatar_url="avatars/default/default_avatar.png"
                )
            ]
            
            for user in users:
                db.session.add(user)
            
            # Örnek makaleler
            articles = [
                Article(
                    title="Bilişsel Egzersizin Faydaları",
                    content="Bu makalede beyin egzersizlerinin bilişsel sağlığa faydaları anlatılacaktır.",
                    category="article"
                )
            ]
            
            for article in articles:
                db.session.add(article)

            # Değişiklikleri kaydet
            db.session.commit()
            return "Başarıyla örnek veriler oluşturuldu!"
        else:
            return "Veritabanında zaten veri var, işlem iptal edildi."
    except Exception as e:
        logger.error(f"Veritabanı başlatma hatası: {str(e)}")
        return f"Veritabanı başlatma hatası: {str(e)}"

@app.route('/init-db')
def init_db_route():
    try:
        db.drop_all()
        db.create_all()
        initialize_database()
        return "Veritabanı başarıyla sıfırlandı ve örnek veriler eklendi!"
    except Exception as e:
        return f"Veritabanı sıfırlama hatası: {str(e)}"

def get_most_played_games(limit=4):
    """En çok oynanan oyunları sayısına göre döndürür."""
    # Oyun istatistiklerini analiz et
    from sqlalchemy import func, desc
    from datetime import datetime, timedelta
    import logging

    # Varsayılan oyunlar listesi (veritabanı hatası durumunda kullanılacak)
    popular_games = []

    # Çıkarılacak oyun türleri
    excluded_games = ["2048", "memory_cards"]

    try:
        # Son 24 saat içinde oynanan oyunları al
        yesterday = datetime.now() - timedelta(days=1)

        # En çok oynanan oyunları bul (çıkarılacak oyunlar hariç)
        popular_games = Score.query.with_entities(
            Score.game_type, 
            func.count(Score.id).label('play_count')
        ).filter(
            Score.timestamp >= yesterday,
            ~Score.game_type.in_(excluded_games)  # Belirtilen oyunları hariç tut
        ).group_by(
            Score.game_type
        ).order_by(
            desc('play_count')
        ).limit(limit).all()

        # Eğer son 24 saatte yeterli veri yoksa, tüm zamanların en popüler oyunlarını al (çıkarılacak oyunlar hariç)
        if len(popular_games) < limit:
            popular_games = Score.query.with_entities(
                Score.game_type, 
                func.count(Score.id).label('play_count')
            ).filter(
                ~Score.game_type.in_(excluded_games)  # Belirtilen oyunları hariç tut
            ).group_by(
                Score.game_type
            ).order_by(
                desc('play_count')
            ).limit(limit).all()
    except Exception as e:
        # Herhangi bir hata oluşursa logla ve boş liste döndür
        logging.error(f"Oyun istatistikleri alınırken hata oluştu: {str(e)}")
        popular_games = []

    # Oyun listesini oluştur
    games = []

    # Oyun türü ve rota eşleştirmeleri
    game_info = {
        "word_puzzle": {
            "name": "Kelime Bulmaca",
            "description": "Kelimeler ve sözcüklerle çalışarak dil becerilerinizi geliştirin.",
            "icon": "fas fa-font",
            "route": "word_puzzle"
        },
        "wordle": {
            "name": "Wordle",
            "description": "5 harfli gizli kelimeyi 6 denemede bulmaya çalışın!",
            "icon": "fas fa-keyboard",
            "route": "wordle"
        },
        "audio_memory": {
            "name": "Sesli Hafıza",
            "description": "Ses dizilerini hatırlayarak işitsel hafızanızı güçlendirin.",
            "icon": "fas fa-music",
            "route": "audio_memory"
        },
        "chess": {
            "name": "Satranç",
            "description": "Stratejik düşünme ve planlama becerilerinizi geliştirin.",
            "icon": "fas fa-chess",
            "route": "chess"
        },
        "tetris": {
            "name": "Tetris",
            "description": "Düşen blokları doğru yerleştirerek çizgileri tamamlayın.",
            "icon": "fas fa-shapes",
            "route": "tetris"
        },
        "snake": {
            "name": "Yılan Oyunu",
            "description": "Yılanı yönlendirerek en yüksek skoru elde etmeye çalışın.",
            "icon": "fas fa-gamepad",
            "route": "snake_game"
        },
        "minesweeper": {
            "name": "Mayın Tarlası",
            "description": "Mantık yürüterek mayınları işaretle ve tarlanı temizle!",
            "icon": "fas fa-bomb",
            "route": "minesweeper"
        },
        "sudoku": {
            "name": "Sudoku",
            "description": "Sayı bulmaca oyunu.",
            "icon": "fas fa-th",
            "route": "sudoku"
        },
        "math_challenge": {
            "name": "Matematik Mücadelesi",
            "description": "Hızlı düşünme ve matematiksel becerilerinizi test edin.",
            "icon": "fas fa-calculator",
            "route": "math_challenge"
        },
        "color_match": {
            "name": "Renk Eşleştirme",
            "description": "Kelimelerin anlamı ve rengi arasındaki uyumu kontrol ederek hızlı tepki verin.",
            "icon": "fas fa-palette",
            "route": "color_match_game"
        },
        "hangman": {
            "name": "Adam Asmaca",
            "description": "Gizli kelimeyi bulmak için harfleri tahmin edin ve kelimeyi tamamlamaya çalışın.",
            "icon": "fas fa-user-slash",
            "route": "hangman"
        }
    }

    # Varsayılan oyunlar (veri yoksa kullanılacak)
    default_games = [
        "wordle", "audio_memory", "tetris", "hangman", "snake"
    ]

    # Popüler oyun verilerine göre oyun listesini oluştur
    for game_type, count in popular_games:
        if game_type in game_info:
            games.append(game_info[game_type])

    # Eğer hala yeterli oyun yoksa, varsayılan oyunları ekle
    if len(games) < limit:
        for game_type in default_games:
            if len(games) >= limit:
                break

            # Bu oyun zaten listeye eklenmişse atla
            if game_type in [g.get("route", "") for g in games]:
                continue

            if game_type in game_info:
                games.append(game_info[game_type])

    # Sadece istenen sayıda oyunu döndür
    return games[:limit]

# Ana Sayfa
@app.route('/')
def index():
    try:
        # En çok oynanan 4 oyunu çek
        most_played_games = get_most_played_games(limit=4)
        return render_template('index.html', most_played_games=most_played_games)
    except Exception as e:
        # Herhangi bir hata olursa logla ve varsayılan oyunları göster
        import logging
        logging.error(f"Ana sayfa yüklenirken hata oluştu: {str(e)}")

        # Varsayılan oyunlar
        default_game_info = {
            "wordle": {
                "name": "Wordle",
                "description": "5 harfli gizli kelimeyi 6 denemede bulmaya çalışın!",
                "icon": "fas fa-keyboard",
                "route": "wordle"
            },
            "memory_cards": {
                "name": "Hafıza Kartları",
                "description": "Eşleşen kartları bularak görsel hafıza ve odaklanma becerilerinizi geliştirin.",
                "icon": "fas fa-clone",
                "route": "memory_cards"
            },
            "audio_memory": {
                "name": "Sesli Hafıza",
                "description": "Ses dizilerini hatırlayarak işitsel hafızanızı güçlendirin.",
                "icon": "fas fa-music",
                "route": "audio_memory"
            },
            "2048": {
                "name": "2048",
                "description": "Sayıları kaydırarak aynı değere sahip kareleri birleştirin ve 2048'e ulaşın!",
                "icon": "fas fa-cubes",
                "route": "game_2048"
            }
        }

        default_games = ["wordle", "memory_cards", "audio_memory", "2048"]
        most_played_games = [default_game_info[game] for game in default_games]
        return render_template('index.html', most_played_games=most_played_games)

# Giriş Sayfası
@app.route('/login', methods=['GET', 'POST'])
def login():
    # Redirect parametresini al (varsa)
    redirect_url = request.args.get('redirect', '')

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Email ile kullanıcıyı bul
        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            
            # Kullanıcının avatar_url'sini session'a kaydet
            if user.avatar_url and user.avatar_url.strip():
                session['avatar_url'] = user.avatar_url
            
            # Tema tercihini session'a ekle
            session['theme_preference'] = user.theme_preference or 'dark'
            
            # Kullanıcının son aktif zamanını güncelle
            user.last_active = datetime.utcnow()
            db.session.commit()

            flash('Giriş başarılı!', 'success')

            # Debug için console log ekle
            print(f"Kullanıcı girişi başarılı: {user.username}, Avatar: {user.avatar_url}")

            # Yönlendirilecek sayfa varsa oraya git
            if redirect_url:
                return redirect(redirect_url)
            return redirect(url_for('index'))
        else:
            flash('Email veya şifre hatalı!', 'danger')

    return render_template('login.html')

# Şifre Sıfırlama Fonksiyonları
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    try:
        if request.method == 'POST':
            email = request.form.get('email')
            if not email:
                flash('Lütfen e-posta adresinizi girin.', 'danger')
                return redirect(url_for('forgot_password'))

            user = User.query.filter_by(email=email).first()
            if not user:
                # Kullanıcı bulunamadı mesajı
                flash('Bu email ile kayıtlı bir kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('forgot_password'))

            # 4 haneli doğrulama kodu oluşturma
            verification_code = ''.join(random.choices('0123456789', k=4))
            token_expiry = datetime.utcnow() + timedelta(minutes=30)
            user.reset_token = verification_code
            user.reset_token_expiry = token_expiry
            db.session.commit()

            # E-posta için HTML içeriği oluştur
            html_body = f"""
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Şifre Sıfırlama Doğrulama Kodu</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    
                    body {{
                        font-family: 'Poppins', sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f5f7;
                        color: #333;
                        line-height: 1.6;
                    }}
                    
                    .container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                    }}
                    
                    .header {{
                        background: linear-gradient(135deg, #6b46c1 0%, #8a63d2 100%);
                        padding: 30px 40px;
                        text-align: center;
                    }}
                    
                    .header h1 {{
                        color: white;
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }}
                    
                    .content {{
                        padding: 40px;
                        text-align: center;
                    }}
                    
                    .verification-code {{
                        font-size: 36px;
                        font-weight: 700;
                        letter-spacing: 5px;
                        margin: 30px 0;
                        color: #6b46c1;
                        background: #f7f4ff;
                        padding: 15px 25px;
                        border-radius: 8px;
                        display: inline-block;
                    }}
                    
                    .expiry-notice {{
                        color: #e53e3e;
                        margin-top: 25px;
                        font-size: 14px;
                        font-weight: 500;
                    }}
                    
                    .notice {{
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        padding: 15px;
                        margin-top: 30px;
                        font-size: 14px;
                        color: #718096;
                    }}
                    
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #a0aec0;
                        border-top: 1px solid #edf2f7;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Şifre Sıfırlama Doğrulama Kodunuz</h1>
                    </div>
                    <div class="content">
                        <p>Merhaba,</p>
                        <p>Şifrenizi sıfırlamak için talepte bulundunuz. Şifre sıfırlama işlemine devam etmek için aşağıdaki doğrulama kodunu kullanın:</p>
                        
                        <div class="verification-code">{verification_code}</div>
                        
                        <p class="expiry-notice">Bu kod 30 dakika içinde geçerliliğini yitirecektir.</p>
                        
                        <div class="notice">
                            <strong>Önemli:</strong> Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın ve hesabınızın güvenliği için şifrenizi değiştirin.
                        </div>
                    </div>
                    <div class="footer">
                        <p>Bu e-posta, OmGame şifre sıfırlama talebiniz üzerine gönderilmiştir.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # E-postayı gönder
            email_sent = send_email_in_background(
                to_email=email,
                subject="OmGame - Şifre Sıfırlama Doğrulama Kodunuz",
                html_body=html_body,
                verification_code=verification_code
            )
            
            # E-posta gönderildi mesajı
            flash('Doğrulama kodu e-posta adresinize gönderildi.', 'success')
            return redirect(url_for('reset_code', email=email))

    except Exception as e:
        logger.error(f"Şifre sıfırlama hatası: {str(e)}")
        flash('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
        return render_template('forgot_password.html')

    return render_template('forgot_password.html')

@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    try:
        email = request.args.get('email', '')
        if not email:
            flash('Geçersiz istek.', 'danger')
            return redirect(url_for('forgot_password'))

        if request.method == 'POST':
            verification_code = ""
            # Dört ayrı input alanından gelen değerleri birleştir
            for i in range(1, 5):
                code_part = request.form.get(f'code{i}', '')
                verification_code += code_part
            
            user = User.query.filter_by(email=email).first()
            if not user:
                flash('Kullanıcı bulunamadı.', 'danger')
                return redirect(url_for('forgot_password'))

            if user.reset_token != verification_code:
                flash('Geçersiz doğrulama kodu.', 'danger')
                return render_template('reset_code.html', email=email)

            if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
                flash('Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin.', 'danger')
                return redirect(url_for('forgot_password'))

            # Geçici bir token oluştur
            reset_token = str(uuid.uuid4())
            user.reset_token = reset_token
            db.session.commit()

            return redirect(url_for('reset_password', email=email, token=reset_token))

    except Exception as e:
        logger.error(f"Doğrulama kodu hatası: {str(e)}")
        flash('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return render_template('reset_code.html', email=email)

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    try:
        email = request.args.get('email', '')
        token = request.args.get('token', '')
        
        if not email or not token:
            flash('Geçersiz istek.', 'danger')
            return redirect(url_for('forgot_password'))
            
        user = User.query.filter_by(email=email, reset_token=token).first()
        if not user:
            flash('Geçersiz veya süresi dolmuş link. Lütfen tekrar şifre sıfırlama talebinde bulunun.', 'danger')
            return redirect(url_for('forgot_password'))
            
        if request.method == 'POST':
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            if password != confirm_password:
                flash('Şifreler eşleşmiyor.', 'danger')
                return render_template('reset_password.html', email=email, token=token)
                
            if len(password) < 6:
                flash('Şifre en az 6 karakter uzunluğunda olmalıdır.', 'danger')
                return render_template('reset_password.html', email=email, token=token)
                
            # Şifreyi güncelle
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            
            flash('Şifreniz başarıyla değiştirildi! Artık giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))
            
    except Exception as e:
        logger.error(f"Şifre sıfırlama hatası: {str(e)}")
        flash('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
        
    return render_template('reset_password.html', email=email, token=token)

# OYUNLAR

# 3D Rotasyon Oyunu
# 3D Döndürme Oyunu kaldırıldı

# Kelime Bulmaca Oyunu
@app.route('/games/word-puzzle')
def word_puzzle():
    return render_template('games/wordPuzzle.html')

# Hafıza Eşleştirme Oyunu
@app.route('/games/memory-match')
def memory_match():
    return render_template('games/memoryMatch.html')

# Memory Card Flip removed

# 3D Labirent Oyunu
@app.route('/games/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

# Bayrak Tahmin Oyunu
@app.route('/games/flag-quiz')
def flag_quiz():
    """Bayrak Tahmin Oyunu: Görsel hafıza ve coğrafi bilgi testi
    Dünya bayraklarını tahmin ederek görsel hafızanızı ve coğrafi bilginizi geliştirin."""
    return render_template('games/flagQuiz.html')

# Bulmaca Oyunu
@app.route('/games/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

# Sayı Dizisi Oyunu
@app.route('/games/number-sequence')
def number_sequence():
    return render_template('games/numberSequence.html')

# Hafıza Kartları Oyunu
@app.route('/games/memory-cards')
def memory_cards():
    return render_template('games/memoryCards.html')

# Sayı Zinciri Oyunu
@app.route('/games/number-chain')
def number_chain():
    return render_template('games/numberChain.html')

# Sesli Hafıza Oyunu
@app.route('/games/audio-memory')
def audio_memory():
    """Sesli Hafıza: Melodi oyunu
    İşitsel hafızayı geliştirmek için tasarlanmış interaktif bir oyun.
    Doğa sesleri, enstrümanlar veya diğer sesler ile hafıza egzersizi."""
    return render_template('games/audioMemory.html')

# N-Back Oyunu
@app.route('/games/n-back')
def n_back():
    return render_template('games/nBack.html')

# Sudoku Oyunu kaldırıldı

# Tower Defense ve Space Shooter oyunları kaldırıldı

# 2048 Oyunu
@app.route('/2048')
def game_2048_redirect():
    # Redirect to the proper /games/2048 route
    return redirect(url_for('game_2048'))

@app.route('/games/2048')
def game_2048():
    return render_template('games/2048.html')

# Wordle Oyunu
@app.route('/wordle')
def wordle_redirect():
    # Fix the redirect to go to the proper 'games/wordle' route
    return redirect(url_for('wordle'))

@app.route('/games/wordle')
def wordle():
    """Wordle kelime tahmin oyunu"""
    return render_template('games/wordle.html')

# Satranç Oyunu
@app.route('/chess')
def chess_redirect():
    # Redirect to the /games/chess route
    return redirect(url_for('chess'))

@app.route('/games/chess')
def chess():
    """Satranç oyunu"""
    return render_template('games/chess.html')

# IQ Test Oyunu
@app.route('/games/iq-test')
def iq_test():
    """IQ Test: Zeka ve mantık oyunu
    Farklı kategorilerde zeka ve mantık sorularını çözerek IQ seviyenizi test edin."""
    return render_template('games/iqTest_simplified.html')

# Simon Says Oyunu
@app.route('/simon_says')
def simon_says_old():
    """Eski rota - yönlendirme yapar"""
    return redirect(url_for('simon_says'))

@app.route('/games/simon-says')
def simon_says():
    """Simon Says: Hafıza ve konsantrasyon oyunu
    Renkli düğmelerin yanma sırasını hatırlayarak hafızanızı güçlendirin."""
    return render_template('games/simonSays.html')

# Kelime Avı Oyunu
# Kelime Avı oyunu kaldırıldı

# Tetris Oyunu
@app.route('/tetris')
def tetris_redirect():
    """Tetris oyununa yönlendirme"""
    # Redirect to the proper /games/tetris route
    return redirect(url_for('tetris'))

@app.route('/games/tetris')
def tetris():
    """Tetris: Klasik blok puzzle oyunu
    Düşen blokları doğru yerleştirerek çizgileri tamamlayın."""
    return render_template('games/tetris.html')

# Typing Speed Oyunu
@app.route('/games/typing-speed')
def typing_speed():
    """Yazma Hızı: Klavye hızı testi
    Belirli metinleri hızlı ve doğru bir şekilde yazarak yazma becerilerinizi geliştirin."""
    return render_template('games/typingSpeed_simplified.html')

@app.route('/games/puzzle-slider')
def puzzle_slider():
    """Puzzle Slider: Görsel bulmaca
    Görsel dikkat ve mekansal becerileri geliştiren kare bulmaca oyunu"""
    return render_template('games/puzzleSlider.html')
    
@app.route('/games/photo-puzzle')
def photo_puzzle():
    """Fotoğraf Yapboz: Görsel bulmaca oyunu
    Ünlü kişilerin, manzaraların ve sanat eserlerinin resimlerini parçalara ayırıp birleştirerek
    görsel dikkat ve mekansal becerilerinizi geliştirin."""
    try:
        return render_template('games/photo_puzzle.html')
    except Exception as e:
        logger.error(f"Photo puzzle game error: {str(e)}")
        return render_template('error.html', message="Oyun yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")

@app.route('/games/inventions-quiz')
def inventions_quiz():
    """İcatlar ve İsimler: Tarih bilgisi oyunu
    Tarih boyunca önemli icatları ve mucitlerini eşleştirerek bilgi dağarcığınızı 
    genişletin ve genel kültürünüzü artırın."""
    try:
        return render_template('games/inventions_quiz.html')
    except Exception as e:
        logger.error(f"Inventions quiz game error: {str(e)}")
        return render_template('error.html', message="Oyun yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
            return redirect(url_for('login', redirect=request.url))
        return f(*args, **kwargs)
    return login_required

# Mayın Tarlası Oyunu
@app.route('/games/minesweeper')
def minesweeper():
    """Mayın Tarlası: Mantık ve strateji oyunu
    Mantık yürüterek mayınları işaretle ve tarlanı temizle!"""
    return render_template('games/minesweeper.html')

@app.route('/games/color-match')
def color_match_game():
    """Renk Eşleştirme: Odaklanma oyunu
    Kelimelerin anlamı ve rengi arasındaki uyumu kontrol ederek hızlı tepki verin."""
    return render_template('games/colorMatch_modern.html')

@app.route('/games/math-challenge')
def math_challenge():
    """Matematik Mücadelesi: Sayısal beceri testi
    Hızlı düşünme ve matematiksel becerilerinizi test edin."""
    return render_template('games/mathChallenge_simplified.html')

# Breakout game removed

@app.route('/snake')
def snake_redirect():
    # Redirect to the proper /games/snake route
    return redirect(url_for('snake_game'))

@app.route('/games/snake')
def snake_game():
    """Yılan Oyunu: Klasik arcade
    Yılanı yönlendirerek en yüksek skoru elde etmeye çalışın."""
    return render_template('games/snake_simplified.html')



# Pattern Flow ve Modern Puzzle oyunları kaldırıldı

# Sudoku
@app.route('/games/sudoku')
def sudoku():
    """Sudoku: Sayı bulmaca oyunu
    9x9 grid üzerinde her satır, sütun ve 3x3 karede 1-9 arasındaki tüm rakamları yerleştirerek
    mantık ve problem çözme becerilerinizi geliştirin."""
    try:
        return render_template('games/sudoku.html')
    except Exception as e:
        logger.error(f"Error rendering sudoku.html: {str(e)}")
        return render_template('games/sudoku.html')

# Tangram
@app.route('/games/tangram')
def tangram():
    """Tangram: Geometrik bulmaca oyunu
    Farklı geometrik şekilleri birleştirerek belirli formları oluşturun ve mekansal zekânızı geliştirin."""
    try:
        return render_template('games/tangram.html')
    except Exception as e:
        logger.error(f"Error rendering tangram.html: {str(e)}")
        return render_template('games/sudoku.html')

# Hangman (Adam Asmaca)
@app.route('/hangman')
def hangman_redirect():
    """Adam Asmaca oyununa yönlendirme"""
    # Yönlendirmeyi /games/hangman rotasına yap
    return redirect(url_for('hangman'))

@app.route('/games/hangman')
def hangman():
    """Adam Asmaca: Kelime tahmin oyunu
    Gizli kelimeyi bulmak için harfleri tahmin edin ve kelimeyi tamamlamaya çalışın."""
    return render_template('games/hangman.html')

@app.route('/games/crossword')
def crossword():
    """Bulmaca: Kelime bulmaca oyunu
    İpuçlarına göre kelimeleri grid üzerinde yerleştirerek kelime haznenizi ve mantıksal düşünme becerilerinizi geliştirin."""
    try:
        return render_template('games/crossword.html')
    except Exception as e:
        logger.error(f"Error rendering crossword.html: {str(e)}")
        return render_template('games/crossword.html')

# Solitaire
@app.route('/games/solitaire')
def solitaire():
    """Solitaire: Klasik kart oyunu
    Kartları uygun şekilde sıralayarak stratejik düşünme ve planlama becerilerinizi geliştirin."""
    try:
        return render_template('games/solitaire.html')
    except Exception as e:
        logger.error(f"Error rendering solitaire.html: {str(e)}")
        return render_template('games/solitaire.html')

# Minesweeper rotası yukarıda tanımlanmıştır

@app.route('/all-games')
def all_games():
    """Tüm oyunları listeleyen sayfa"""
    try:
        return render_template('all_games.html')
    except Exception as e:
        logger.error(f"Error rendering all_games.html: {str(e)}")
        return f"An error occurred: {str(e)}", 500
        
# Profesyonel Oyunlar - Yeni eklenen oyunlar

@app.route('/games/stock-simulator')
def stock_simulator():
    """Stok Piyasası Simülatörü: Borsa eğitim oyunu
    Gerçek verilere dayalı bir borsa simülasyonunda yatırım stratejileri geliştirin."""
    return render_template('games/professional/stock_simulator.html')

@app.route('/games/coding-expert')
def coding_expert():
    """Kod Çözme Uzmanı: Programlama mantık oyunu
    Programlama mantığını öğreten interaktif bulmacalarla algoritma becerilerini geliştirin."""
    return render_template('games/professional/coding_expert.html')

@app.route('/games/business-strategy')
def business_strategy():
    """İş Stratejisi Simülatörü: Yönetim oyunu
    Sanal bir şirketi yöneterek stratejik karar verme ve iş yönetimi becerilerinizi geliştirin."""
    return render_template('games/professional/business_strategy.html')

@app.route('/games/architecture-studio')
def architecture_studio():
    """Mimari Tasarım Stüdyosu: 3D modelleme oyunu
    3D tasarım araçlarıyla mimari projeler geliştirerek mekansal düşünme yeteneklerinizi artırın."""
    return render_template('games/professional/architecture_studio.html')

@app.route('/games/translation-master')
def translation_master():
    """Çeviri Ustası: Dil gelişim oyunu
    Farklı zorluk seviyelerindeki metinleri çevirerek dil becerilerinizi geliştirin."""
    return render_template('games/professional/translation_master.html')

@app.route('/games/logistics-manager')
def logistics_manager():
    """Üretim & Lojistik Yöneticisi: Tedarik zinciri simülasyonu
    Karmaşık tedarik zinciri simülasyonlarında verimlilik ve optimizasyon becerilerinizi test edin."""
    return render_template('games/professional/logistics_manager.html')

# Skor Tablosu
@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

# Makaleler
@app.route('/articles')
def articles():
    articles = Article.query.filter_by(category="article").all()
    return render_template('articles.html', articles=articles)

# İpuçları
@app.route('/tips')
def tips():
    tips = Article.query.filter_by(category="tip").all()
    return render_template('tips.html', tips=tips)

# Kayıt Sayfası
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            username = request.form.get('username')
            email = request.form.get('email')
            password = request.form.get('password')
            password_confirm = request.form.get('password_confirm')  # register.html'deki alan adı ile eşleşecek şekilde
            terms = request.form.get('terms')

            # Validasyon kontrolleri
            if not username or not email or not password:
                flash('Tüm alanlar doldurulmalıdır!', 'danger')
                return redirect(url_for('register'))

            if password != password_confirm:
                flash('Şifreler eşleşmiyor!', 'danger')
                return redirect(url_for('register'))

            if not terms:
                flash('Kullanım koşullarını kabul etmelisiniz!', 'danger')
                return redirect(url_for('register'))

            # Kullanıcı adı formatını kontrol et (sadece harf, rakam, tire ve alt çizgi)
            if not re.match(r'^[a-zA-Z0-9_-]+$', username):
                flash('Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir!', 'danger')
                return redirect(url_for('register'))

            # Kullanıcı adı en az 3 karakter olmalı
            if len(username) < 3:
                flash('Kullanıcı adı en az 3 karakter olmalıdır!', 'danger')
                return redirect(url_for('register'))

            # Şifre en az 6 karakter olmalı
            if len(password) < 6:
                flash('Şifre en az 6 karakter olmalıdır!', 'danger')
                return redirect(url_for('register'))

            # E-posta formatını kontrol et
            try:
                valid = validate_email(email)
                email = valid.email
            except EmailNotValidError:
                flash('Geçersiz e-posta formatı!', 'danger')
                return redirect(url_for('register'))

            # Kullanıcı veya e-posta zaten kayıtlı mı kontrol et
            existing_user = None
            try:
                existing_user = User.query.filter_by(username=username).first()
            except Exception as e:
                logger.error(f"Kullanıcı adı kontrolü sırasında hata: {str(e)}")
                db.session.rollback()
                
            if existing_user:
                flash('Bu kullanıcı adı zaten kullanılıyor!', 'danger')
                return redirect(url_for('register'))

            existing_email = None
            try:
                existing_email = User.query.filter_by(email=email).first()
            except Exception as e:
                logger.error(f"E-posta kontrolü sırasında hata: {str(e)}")
                db.session.rollback()
                
            if existing_email:
                flash('Bu e-posta adresi zaten kullanılıyor!', 'danger')
                return redirect(url_for('register'))

            # Yeni kullanıcı oluştur
            hashed_password = generate_password_hash(password)
            new_user = User(
                username=username,
                email=email,
                password_hash=hashed_password
            )

            # Veritabanına kaydet
            try:
                db.session.add(new_user)
                db.session.commit()
            except Exception as e:
                logger.error(f"Kullanıcı kaydedilirken hata: {str(e)}")
                db.session.rollback()
                flash('Kayıt sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
                return redirect(url_for('register'))

            # Kullanıcı kaydı başarılı mesajı
            logger.info(f"Yeni kullanıcı kaydedildi: {username} ({email})")
            
            # Her durumda hoş geldiniz e-postası gönder (hesap silindikten sonra bile)
            send_welcome_email(email, username)
            
            # Başarılı mesajını göster
            flash('Kayıt başarılı! OmGame dünyasına hoş geldiniz! E-posta kutunuzu kontrol edin.', 'success')

            # Otomatik giriş yap
            try:
                session['user_id'] = new_user.id
                flash('Kayıt başarılı! OmGame dünyasına hoş geldiniz!', 'success')
                return redirect(url_for('index'))
            except Exception as session_error:
                logger.error(f"Oturum başlatılırken hata: {str(session_error)}")
                flash('Kayıt başarılı! Lütfen giriş yapın.', 'success')
                return redirect(url_for('login'))
                
        except Exception as e:
            logger.error(f"Kayıt işlemi sırasında beklenmeyen hata: {str(e)}")
            db.session.rollback()
            flash('Bir hata oluştu, lütfen daha sonra tekrar deneyin.', 'danger')
            return render_template('register.html')

    return render_template('register.html')

    return render_template('register.html')

# Çıkış
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Başarıyla çıkış yaptınız!', 'success')
    return redirect(url_for('index'))

def xp_for_level(level):
    """
    Belirli bir seviyeye ulaşmak için gereken toplam XP değerini hesaplar.
    Her seviye yükseldikçe gereken XP miktarı artar.
    - 1. seviye: 100 XP
    - 2. seviye: 300 XP toplam (100 + 200)
    - 3. seviye: 600 XP toplam (300 + 300)
    - 4. seviye: 1000 XP toplam (600 + 400)
    - Her seviye için gereken XP, seviye sayısı × 100 olarak artar
    """
    if level <= 1:
        return 0

    total_xp = 0
    for i in range(1, level):
        total_xp += i * 100

    return total_xp

def calculate_level(xp):
    """
    Toplam XP'ye göre kullanıcı seviyesini hesaplar.
    Optimize edilmiş algoritma - her seviyeyi kontrol etmek yerine ikili arama kullanır.
    """
    # Başlangıç seviyesinden başla
    level = 1

    # Kullanıcı 0 XP ile başlıyor
    if xp <= 0:
        return level

    # Maksimum seviye sınırı (performans için)
    max_check_level = 100

    # İkili arama ile seviye bulma - daha hızlı hesaplama
    left, right = 1, max_check_level
    while left <= right:
        mid = (left + right) // 2
        if xp_for_level(mid) <= xp < xp_for_level(mid + 1):
            return mid
        elif xp < xp_for_level(mid):
            right = mid - 1
        else:
            left = mid + 1

    # Eğer ikili arama sonuç vermezse, doğrusal arama yap
    level = 1
    while level < max_check_level and xp >= xp_for_level(level + 1):
        level += 1

    return level

def get_user_scores():
    """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
    if 'user_id' in session:
        scores = Score.query.filter_by(user_id=session['user_id']).all()
        result = {}
        for score in scores:
            if score.game_type not in result or score.score > result[score.game_type]:
                result[score.game_type] = score.score
        return result
    return {}

# Profil Sayfası
@app.route('/profile')
def profile():
    """Mevcut profil sayfası."""
    if 'user_id' not in session:
        flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
        return redirect(url_for('login'))

    user = User.query.get(session['user_id'])

    # Toplam oyun sayısı ve en yüksek skoru hesapla
    scores = Score.query.filter_by(user_id=user.id).all()

    user_scores = {}
    for score in scores:
        if score.game_type not in user_scores or score.score > user_scores[score.game_type]:
            user_scores[score.game_type] = score.score

    # Kullanıcı seviyesini hesapla
    user_level = calculate_level(user.experience_points)

    # Bir sonraki seviyeye ne kadar XP kaldığını hesapla
    next_level_xp = xp_for_level(user_level + 1)
    current_level_xp = xp_for_level(user_level)
    xp_progress = ((user.experience_points - current_level_xp) / (next_level_xp - current_level_xp)) * 100

    return render_template(
        'profile.html', 
        user=user, 
        scores=user_scores,
        user_level=user_level,
        xp_progress=xp_progress,
        next_level_xp=next_level_xp,
        current_xp=user.experience_points
    )

# Profil Sayfası (Yeni Tasarım)
@app.route('/profile/v2')
def profile_v2():
    """Yeni tasarımlı profil sayfası."""
    try:
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
            return redirect(url_for('login'))

        user = User.query.get(session['user_id'])

        if not user:
            logger.error(f"Kullanıcı bulunamadı: user_id={session['user_id']}")
            flash('Kullanıcı bilgilerinize erişilemedi. Lütfen tekrar giriş yapın.', 'danger')
            return redirect(url_for('logout'))

        # Kullanıcı istatistiklerini hesapla
        try:
            scores = Score.query.filter_by(user_id=user.id).all()

            total_games = len(scores)
            highest_score = 0
            if scores:
                highest_score = max(score.score for score in scores)

            # Oyun başına en yüksek skorlar
            user_scores = {}
            for score in scores:
                if score.game_type not in user_scores or score.score > user_scores[score.game_type]:
                    user_scores[score.game_type] = score.score
        except Exception as e:
            logger.error(f"Skor verileri alınırken hata: {str(e)}")
            # Veri olmasa da devam et
            scores = []
            total_games = 0
            highest_score = 0
            user_scores = {}

        # Kullanıcı seviyesini hesapla
        current_level = calculate_level(user.experience_points)

        # XP hesaplamaları
        xp_for_current = xp_for_level(current_level)
        xp_for_next = xp_for_level(current_level + 1)
        try:
            xp_progress = ((user.experience_points - xp_for_current) / (xp_for_next - xp_for_current)) * 100
        except ZeroDivisionError:
            xp_progress = 100  # Eğer mevcut ve sonraki seviye XP'si aynı ise %100 göster

        return render_template(
            'profile_v2.html', 
            user=user, 
            scores=user_scores,
            total_games=total_games,
            highest_score=highest_score,
            current_level=current_level,
            xp_progress=xp_progress,
            xp_for_current=xp_for_current,
            xp_for_next=xp_for_next,
            current_xp=user.experience_points,
            xp_needed=xp_for_next - user.experience_points
        )
    except Exception as e:
        logger.error(f"Profil sayfası yüklenirken hata: {str(e)}")
        return render_template('error.html', message="Profil sayfası yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")

# Profil Güncelleme
@app.route('/profile/update', methods=['POST'])
def update_profile():
    """Profil bilgilerini güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])

    # POST verilerini al
    full_name = request.form.get('full_name', user.full_name)
    bio = request.form.get('bio', user.bio)
    age = request.form.get('age')
    location = request.form.get('location', user.location)

    # Yaşı sayıya çevir veya None olarak bırak
    try:
        age = int(age) if age else None
    except:
        age = None

    # Kullanıcı bilgilerini güncelle
    user.full_name = full_name
    user.bio = bio
    user.age = age
    user.location = location

    db.session.commit()

    return jsonify({'success': True, 'message': 'Profil bilgileri güncellendi!'})

# First implementation is kept, this duplicate route has been removed
    
    # JSON veri kontrolü (hazır avatar seçimi için)
    if request.is_json:
        data = request.get_json()
        selected_avatar = data.get('selected_avatar')
        if selected_avatar and selected_avatar.strip():
            # Seçili hazır avatarı kullan
            user.avatar_url = selected_avatar
            db.session.commit()
            return jsonify({'success': True, 'message': 'Avatar güncellendi!', 'avatar_url': user.avatar_url})
        return jsonify({'success': False, 'message': 'Geçersiz avatar seçimi!'})
    
    # Form verisi kontrolü
    # Hazır avatar seçimi kontrolü
    selected_avatar = request.form.get('selected_avatar')
    if selected_avatar and selected_avatar.strip():
        # Seçili hazır avatarı kullan
        user.avatar_url = selected_avatar
        db.session.commit()
        return jsonify({'success': True, 'message': 'Avatar güncellendi!', 'avatar_url': user.avatar_url})

    # Dosyanın gelip gelmediğini kontrol et
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': 'Dosya seçilmedi!'})

    avatar = request.files['avatar']

    # Dosya adı boş mu kontrol et
    if avatar.filename == '':
        return jsonify({'success': False, 'message': 'Dosya seçilmedi!'})

    # Dosya uzantısı uygun mu kontrol et
    if not allowed_file(avatar.filename):
        return jsonify({'success': False, 'message': 'Geçersiz dosya formatı! Sadece PNG, JPG, JPEG ve GIF dosyaları kabul edilir.'})

    # Dosya ismini güvenli hale getir ve benzersiz yap
    filename = secure_filename(avatar.filename)
    unique_filename = f"{user.id}_{int(time.time())}_{filename}"

    # Yükleme klasörü yoksa oluştur
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Dosyayı kaydet
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    avatar.save(filepath)

    # Veritabanını güncelle (static/ öneki olmadan kaydet)
    user.avatar_url = os.path.join('uploads/avatars', unique_filename)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Profil fotoğrafı güncellendi!', 'avatar_url': user.avatar_url})


# Bu route kaldırıldı, çünkü yukarıda zaten tanımlanmış.

# Şifre Değiştirme
@app.route('/profile/change-password', methods=['POST'])
def change_password():
    """Şifre değiştirme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])

    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    # Validasyon
    if not current_password or not new_password or not confirm_password:
        return jsonify({'success': False, 'message': 'Tüm alanları doldurun!'})

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'success': False, 'message': 'Mevcut şifre yanlış!'})

    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'Yeni şifreler eşleşmiyor!'})

    if len(new_password) < 8:
        return jsonify({'success': False, 'message': 'Şifre en az 8 karakter olmalıdır!'})

    # Şifreyi güncelle
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Şifre başarıyla değiştirildi!'})

# Güvenlik Ayarları
@app.route('/profile/security', methods=['POST'])
def update_security_settings():
    """Güvenlik ayarlarını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])

    # Güvenlik ayarlarını al (örnek olarak 2FA)
    two_factor = request.form.get('two_factor', 'off') == 'on'

    # Burada gerçek 2FA implementasyonu yapılabilir
    # Şimdilik sadece bir ayar olarak kaydediyoruz

    return jsonify({'success': True, 'message': 'Güvenlik ayarları güncellendi!'})

# Bildirim Ayarları
@app.route('/profile/notifications', methods=['POST'])
def update_notification_settings():
    """Bildirim ayarlarını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])

    # Bildirim ayarlarını al
    email_notifications = request.form.get('email_notifications', 'off') == 'on'
    achievement_notifications = request.form.get('achievement_notifications', 'off') == 'on'
    leaderboard_notifications = request.form.get('leaderboard_notifications', 'off') == 'on'

    # Kullanıcı ayarlarını güncelle
    user.email_notifications = email_notifications
    user.achievement_notifications = achievement_notifications
    user.leaderboard_notifications = leaderboard_notifications

    db.session.commit()

    return jsonify({'success': True, 'message': 'Bildirim ayarları güncellendi!'})

# Tema Ayarları
@app.route('/profile/theme', methods=['POST'])
def update_theme():
    """Tema tercihini güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı!'})

    # Tema tercihini al
    theme = request.form.get('theme_preference', 'dark')

    # Tema tercihini doğrula
    if theme not in ['light', 'dark', 'system']:
        theme = 'dark'  # Varsayılan tema

    # Kullanıcı ayarını güncelle
    user.theme_preference = theme
    
    try:
        # Session'daki tema tercihini de güncelle
        session['theme_preference'] = theme
        
        # Veritabanına kaydet
        db.session.commit()
        
        print(f"Tema tercihi güncellendi: {user.username}, Tema: {theme}")
        return jsonify({'success': True, 'message': 'Tema tercihi güncellendi!'})
    except Exception as e:
        db.session.rollback()
        print(f"Tema güncelleme hatası: {str(e)}")
        return jsonify({'success': False, 'message': 'Tema güncellenirken bir hata oluştu!'})

# Hesap Silme
@app.route('/profile/delete', methods=['POST'])
def delete_account():
    """Hesabı silme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])
    if not user:
        # Kullanıcı bulunamadıysa oturumu temizle ve hata mesajı döndür
        session.pop('user_id', None)
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı. Oturumunuz sonlandırıldı.'})
    
    password = request.form.get('password')
    if not password:
        return jsonify({'success': False, 'message': 'Şifre girilmedi!'})

    # Şifre doğrulama
    if not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Şifre doğrulaması başarısız!'})

    try:
        # Kullanıcının skorlarını sil
        Score.query.filter_by(user_id=user.id).delete()
        
        # Kullanıcının derecelendirmelerini sil
        GameRating.query.filter_by(user_id=user.id).delete()

        # Kullanıcıyı sil
        db.session.delete(user)
        db.session.commit()

        # Oturumu sonlandır
        session.pop('user_id', None)

        return jsonify({'success': True, 'message': 'Hesabınız başarıyla silindi!'})
    except Exception as e:
        logger.error(f"Hesap silme hatası: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'})

# Hesap Dondurma
@app.route('/profile/suspend', methods=['POST'])
def suspend_account():
    """Hesabı dondurma."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])
    if not user:
        # Kullanıcı bulunamadıysa oturumu temizle ve hata mesajı döndür
        session.pop('user_id', None)
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı. Oturumunuz sonlandırıldı.'})
    
    password = request.form.get('password')
    if not password:
        return jsonify({'success': False, 'message': 'Şifre girilmedi!'})
        
    duration = request.form.get('duration', '30')  # Varsayılan 30 gün

    # Şifre doğrulama
    if not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Şifre doğrulaması başarısız!'})

    # Süreyi doğrula ve ayarla
    try:
        duration = int(duration)
        if duration not in [7, 30, 90]:
            duration = 30
    except:
        duration = 30

    try:
        # Hesabı dondur
        user.account_status = 'suspended'
        user.suspended_until = datetime.utcnow() + timedelta(days=duration)
        db.session.commit()

        # Oturumu sonlandır
        session.pop('user_id', None)

        return jsonify({'success': True, 'message': f'Hesabınız {duration} gün boyunca donduruldu!'})
    except Exception as e:
        logger.error(f"Hesap dondurma hatası: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Hesap dondurulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'})

# Şifre sıfırlama ile ilgili rotalar kaldırıldı

# Oyun zorluğuna göre puan ve XP çarpanı hesaplama fonksiyonu
def calculate_multipliers(game_type, difficulty=None, game_stats=None):
    """
    Oyun türüne, zorluğuna ve oyun istatistiklerine göre puan ve XP çarpanlarını hesaplar
    Yeni 0-100 standardize edilmiş puan sistemini kullanır

    Args:
        game_type (str): Oyun türü
        difficulty (str, optional): Zorluk seviyesi (easy, medium, hard, expert)
        game_stats (dict, optional): Oyun istatistikleri (süre, hamle sayısı, ipucu sayısı, vb.)

    Returns:
        dict: Puan ve XP çarpanları
    """
    # Zorluk seviyesi çarpanları
    difficulty_multipliers = {
        'easy': 0.8,
        'medium': 1.0,
        'hard': 1.3,
        'expert': 1.6
    }
    
    # Varsayılan çarpanlar
    multipliers = {
        'point_base': 10,            # Temel puan
        'score_multiplier': 1.0,     # Skor çarpanı
        'xp_base': 15,               # Temel XP
        'xp_score_multiplier': 0.5,  # Skor başına XP
        'difficulty_multiplier': difficulty_multipliers.get(difficulty, 1.0),  # Zorluk çarpanı
        'final_score': None,         # Hesaplanacak nihai skor (0-100)
        'minimum_score_required': 5, # Minimum puan almak için gereken skor
        'performance_score': 0,      # Performans puanı (0-60)
        'skill_score': 0,            # Beceri puanı (0-30)
        'social_score': 0            # Sosyal puanı (0-10)
    }

    # Oyun türüne göre özel çarpanlar - geriye dönük uyumluluk için korundu
    game_multipliers = {
        'memoryCards': {'point_base': 70, 'score_multiplier': 0.6},
        'wordPuzzle': {'point_base': 60, 'score_multiplier': 0.7},
        'numberSequence': {'point_base': 80, 'score_multiplier': 0.5},
        'tetris': {'point_base': 40, 'score_multiplier': 0.8},
        'wordle': {'point_base': 100, 'score_multiplier': 0.3},
        'puzzle_slider': {'point_base': 60, 'score_multiplier': 0.6},
        'chess': {'point_base': 120, 'score_multiplier': 0.2},
        'simon_says': {'point_base': 50, 'score_multiplier': 0.7},
        'typing_speed': {'point_base': 40, 'score_multiplier': 0.9},
        'snake_game': {'point_base': 30, 'score_multiplier': 1.0},
        'audioMemory': {'point_base': 65, 'score_multiplier': 0.6},
        'nBack': {'point_base': 85, 'score_multiplier': 0.45},
        '2048': {'point_base': 45, 'score_multiplier': 0.75},
        'labyrinth': {'point_base': 80, 'score_multiplier': 0.5},
        'puzzle': {'point_base': 60, 'score_multiplier': 0.65},
        'color_match': {'point_base': 55, 'score_multiplier': 0.7},
        'math_challenge': {'point_base': 70, 'score_multiplier': 0.6},
        'iq_test': {'point_base': 90, 'score_multiplier': 0.4},
        'numberChain': {'point_base': 75, 'score_multiplier': 0.55},
        'minesweeper': {'point_base': 90, 'score_multiplier': 0.4},
        'memoryMatch': {'point_base': 60, 'score_multiplier': 0.7},
        'audio_memory': {'point_base': 65, 'score_multiplier': 0.6},
        'hangman': {'point_base': 70, 'score_multiplier': 0.6}
    }

    # Oyun türüne göre çarpanları güncelle (geriye dönük uyumluluk)
    if game_type in game_multipliers:
        multipliers.update(game_multipliers[game_type])

    # XP hesaplamaları için zorluk seviyesini ayarla
    if difficulty:
        if difficulty == 'easy':
            multipliers['xp_base'] = 20  # Kolay seviye temel XP
        elif difficulty == 'medium':
            multipliers['xp_base'] = 30  # Orta seviye temel XP
        elif difficulty == 'hard':
            multipliers['xp_base'] = 45  # Zor seviye temel XP
        elif difficulty == 'expert':
            multipliers['xp_base'] = 70  # Uzman seviye temel XP

    # İstemciden önceden hesaplanmış normalized_score geldiyse (0-100 arası), doğrudan kullan
    if game_stats and 'normalized_score' in game_stats:
        normalized_score = game_stats.get('normalized_score', 0)
        multipliers['final_score'] = max(0, min(100, int(normalized_score)))
        
        # İstemciden gelen performans, beceri ve sosyal puanları kullan (eğer varsa)
        multipliers['performance_score'] = game_stats.get('score_breakdown', {}).get('performance', {}).get('total', 60)
        multipliers['skill_score'] = game_stats.get('score_breakdown', {}).get('skill', {}).get('total', 30)
        multipliers['social_score'] = game_stats.get('score_breakdown', {}).get('social', {}).get('total', 10)
        
        # İstemci puanlamasına güven - burada tamamlanıyor
        return multipliers

    # Eğer game_stats varsa ve istemciden normalized_score gelmemişse, 
    # sunucu tarafında 0-100 arası puan hesapla
    if game_stats:
        # =====================================================
        # 1. PERFORMANS METRİKLERİ (Toplam Puanın %60'ı)
        # =====================================================
        
        # Oyun tamamlama bilgisi
        game_completed = game_stats.get('completed', True)
        
        # Oyun tamamlama puanı (0-10 puan)
        completion_score = 10 if game_completed else 2
        
        # Ham skoru normalize et (0-20 puan)
        score_value = float(game_stats.get('original_score', 0))
        max_possible_score = {
            'tetris': 200,
            'wordle': 6,
            'memoryCards': 20,
            'puzzle': 500,
            'snake': 50,
            'minesweeper': 300,
            'hangman': 100,
            'numberSequence': 500,
            'numberChain': 300,
            'nBack': 200,
            'audio_memory': 150
        }.get(game_type, 100)
        
        score_ratio = min(1.0, score_value / max_possible_score)
        score_based_points = score_ratio * 20
        
        # Performans puanı (0-60 arası normalize edilecek)
        performance_raw = completion_score + score_based_points
        performance_score = min(60, (performance_raw / 30) * 60)
        
        # =====================================================
        # 2. YETENEK & BECERİ FAKTÖRLERİ (Toplam Puanın %30'u)
        # =====================================================
        
        # Süre bilgisi
        playtime = game_stats.get('playtime', 0)
        max_time = game_stats.get('max_time', 300)  # Varsayılan 5 dakika
        
        # Süre puanı (0-10 puan)
        time_score = 5  # Varsayılan orta değer
        if max_time > 0 and playtime > 0:
            # Süre bazlı oyunlarda (Tetris, Snake) uzun süre = iyi
            if game_type in ['tetris', 'snake_game']:
                time_score = min(10, (playtime / max_time) * 10)
            else:
                # Hızlı bitirme = iyi
                time_score = max(0, min(10, (1 - (playtime / max_time)) * 10))
        
        # Doğruluk bilgisi
        correct_answers = game_stats.get('correct_answers', 0)
        total_questions = game_stats.get('total_questions', 0)
        accuracy = game_stats.get('accuracy', 0)
        
        # Doğruluk puanı (0-10 puan)
        accuracy_score = 5  # Varsayılan orta değer
        if total_questions > 0:
            accuracy_score = min(10, (correct_answers / total_questions) * 10)
        elif accuracy > 0:
            accuracy_score = accuracy / 10
        
        # İpucu kullanımı
        hint_count = game_stats.get('hint_count', 0)
        
        # İpucu cezası (0-10 puan)
        hint_penalty = min(10, hint_count * 2)
        
        # Beceri puanı (0-30 arası normalize edilecek)
        skill_raw = time_score + accuracy_score - hint_penalty
        skill_score = min(30, (skill_raw / 20) * 30)
        
        # =====================================================
        # 3. SOSYAL & DAVRANIŞSAL FAKTÖRLER (Toplam Puanın %10'u)
        # =====================================================
        
        # Kullanıcının streak bilgisi
        streak_days = game_stats.get('streak_days', 0)
        
        # Streak puanı (0-7 puan)
        streak_score = min(7, streak_days)
        
        # Sosyal aktiviteler
        social_actions = game_stats.get('social_actions', 0)
        
        # Sosyal puan (0-3 puan)
        social_action_score = min(3, social_actions)
        
        # Sosyal faktör puanı (0-10 arası normalize edilecek)
        social_raw = streak_score + social_action_score
        social_score = min(10, (social_raw / 10) * 10)
        
        # =====================================================
        # 4. TOPLAM PUAN HESAPLAMA
        # =====================================================
        
        # Ana formül: Toplam Puan = (Performans Puanı * 0.6) + (Yetenek Puanı * 0.3) + (Sosyal Puan * 0.1)
        raw_score = performance_score * 0.6 + skill_score * 0.3 + social_score * 0.1
        
        # Zorluk seviyesi çarpanını uygula
        adjusted_score = raw_score * multipliers['difficulty_multiplier']
        
        # Son sınırları uygula (0-100 arası)
        final_score = max(0, min(100, int(adjusted_score)))
        
        # Hesaplanan değerleri multipliers'a ekle
        multipliers['final_score'] = final_score
        multipliers['performance_score'] = int(performance_score)
        multipliers['skill_score'] = int(skill_score)
        multipliers['social_score'] = int(social_score)
        
        logger.debug(f"Performans: {performance_score}, Beceri: {skill_score}, Sosyal: {social_score}, Final: {final_score}")

    # Eğer final_score hala hesaplanmadıysa basit bir hesaplama yap
    if multipliers['final_score'] is None:
        # Basit hesaplama: temel puan + skor bazlı puan * zorluk çarpanı
        base_score = multipliers['point_base']
        score_points = multipliers.get('score', 0) * multipliers['score_multiplier']
        total_points = base_score + score_points
        
        # Sınırları uygula (0-100 arası)
        total_points = max(0, min(100, int(total_points * multipliers['difficulty_multiplier'])))
        
        # Nihai puanı ayarla
        multipliers['final_score'] = total_points

    return multipliers

# Günlük bonus kontrolü
def check_daily_bonus(user_id):
    """
    Kullanıcının günlük bonus hakkı olup olmadığını kontrol eder

    Args:
        user_id (int): Kullanıcı ID

    Returns:
        bool: Günlük bonus hakkı varsa True, yoksa False
    """
    user = User.query.get(user_id)
    now = datetime.utcnow()

    # Eğer kullanıcı daha önce hiç oynamamışsa veya son aktif olduğu gün bugün değilse
    if not user.last_active or user.last_active.date() < now.date():
        return True

    return False

# Skor Kaydetme API'si
@app.route('/api/save-score', methods=['POST'])
def save_score():
    """
    Oyun skorlarını kaydetme ve kullanıcı XP'sini güncelleme API'si
    Yeni 0-100 standardize edilmiş puan sistemini kullanır
    """
    # Gelen veriyi al ve doğrula
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Geçersiz JSON verisi!'})

    game_type = data.get('game_type')
    score = data.get('score')  # Orijinal/ham skor
    normalized_score = data.get('normalized_score')  # İstemci tarafından hesaplanmış 0-100 arası puan
    playtime = data.get('playtime', 60)  # Varsayılan oyun süresi 60 saniye
    difficulty = data.get('difficulty', 'medium')  # Varsayılan zorluk medium
    game_stats = data.get('game_stats', {})  # Oyun istatistikleri

    # Verilerin doğruluğunu kontrol et
    if not game_type:
        return jsonify({'success': False, 'message': 'Oyun türü belirtilmedi!'})

    if score is None:
        return jsonify({'success': False, 'message': 'Skor değeri belirtilmedi!'})

    try:
        # Çok önemli: Bazen string veya float olarak gönderiliyor, int'e çevir
        score = int(float(score))
        playtime = int(float(playtime))
        # Normalize edilmiş skor kontrolü (0-100 arası)
        if normalized_score is not None:
            normalized_score = int(float(normalized_score))
            normalized_score = max(0, min(100, normalized_score))
            # Normalize edilmiş skoru game_stats'e ekle
            game_stats['normalized_score'] = normalized_score
        
        logger.debug(f"Skor dönüşümü: {score}, Süre dönüşümü: {playtime}")
    except (ValueError, TypeError) as e:
        logger.error(f"Skor veya süre dönüşüm hatası: {str(e)}, Değerler: score={score}, playtime={playtime}")
        return jsonify({'success': False, 'message': 'Geçersiz skor veya süre değeri!'})

    # Çarpanları ve standartlaştırılmış skoru hesapla
    logger.debug(f"Çarpanlar hesaplanıyor: game_type={game_type}, difficulty={difficulty}")
    multipliers = calculate_multipliers(game_type, difficulty, game_stats)
    logger.debug(f"Hesaplanan çarpanlar: {multipliers}")

    # Standart puan hesaplama (0-100 arası)
    if multipliers.get('final_score') is not None:
        # Hesaplanan standart puan (0-100 arası)
        standard_score = multipliers['final_score']
        logger.debug(f"Final skor hesaplaması: {standard_score}")
    else:
        # Eğer final_score hesaplanmadıysa basit bir hesaplama yap
        standard_score = 50  # Varsayılan orta değer
        logger.warning(f"Standart puan hesaplanamadı, varsayılan değer kullanıldı: {standard_score}")

    # Kullanıcı giriş yapmış mı kontrol et
    if 'user_id' in session:
        user_id = session['user_id']
        user = User.query.get(user_id)
        now = datetime.utcnow()

        # Günlük bonus kontrolü
        daily_bonus = 0
        streak_bonus = 0

        if check_daily_bonus(user_id):
            daily_bonus = 10  # Günlük ilk oyun bonusu

            # Ardışık günlerde oynama bonusu (streak bonus)
            last_play_date = user.last_active
            if last_play_date and (now.date() - last_play_date.date()).days == 1:
                # Kullanıcının streak_count'u yoksa 0 kabul eder
                streak_count = getattr(user, 'streak_count', 0) + 1

                # streak_count değeri yoksa ekle
                if not hasattr(user, 'streak_count'):
                    user.streak_count = streak_count
                else:
                    user.streak_count = streak_count

                # Streak bonusu hesapla (her ardışık gün için artan bonus)
                streak_bonus = min(streak_count * 2, 10)  # Maximum 10 puan
                
                # Game stats için streak bilgisi ekle
                game_stats['streak_days'] = streak_count
            else:
                # Ardışık oynama bozulmuşsa sıfırla
                if hasattr(user, 'streak_count'):
                    user.streak_count = 1
                else:
                    user.streak_count = 1
                
                # Game stats için streak bilgisi ekle
                game_stats['streak_days'] = 1

        # XP hesaplama sistemi
        # Temel XP değeri (standardize edilmiş puana göre)
        xp_base = multipliers.get('xp_base', 15)
        
        # Performansa dayalı XP 
        xp_from_performance = standard_score * 0.5  # Standart puanın %50'si kadar XP
        
        # Zorluk seviyesine göre çarpan
        difficulty_multiplier = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.5,
            'expert': 4.0
        }.get(difficulty, 1.0)
        
        # Tamamlama bonusu
        completion_bonus = 0
        if game_stats.get('completed', False):
            completion_bonus = xp_base * 0.3  # %30 bonus
        
        # Streak bonusu
        streak_xp_bonus = 0
        if streak_count := getattr(user, 'streak_count', 0):
            streak_xp_bonus = min(streak_count * 2, 20)  # En fazla 20 XP
        
        # Toplam XP hesaplama
        xp_gain = int((xp_base + xp_from_performance) * difficulty_multiplier + completion_bonus + streak_xp_bonus)
        
        # Yeni skoru kaydet
        new_score = Score(
            user_id=user_id,
            game_type=game_type,
            score=score,  # Orijinal oyun skoru
            difficulty=difficulty,  # Zorluk seviyesi
            adjusted_score=standard_score  # 0-100 arası standardize edilmiş puan
        )

        db.session.add(new_score)

        # Kullanıcı bilgilerini güncelle
        user.experience_points += xp_gain
        user.total_games_played += 1
        user.last_active = now

        # Kullanıcının en yüksek skorunu güncelle (gerekirse)
        if score > user.highest_score:
            user.highest_score = score
            
        # Kullanıcının toplam puanını güncelle
        # 0-100 arası standardize edilmiş puanı kullanıcının toplam_score değerine ekle
        user.total_score += standard_score
        
        logger.debug(f"Kullanıcı toplam puanı güncellendi: {user.total_score} (+{standard_score})")

        db.session.commit()

        # Eski seviyeyi kaydet ve yeni seviyeyi hesapla
        old_level = calculate_level(user.experience_points - xp_gain)
        new_level = calculate_level(user.experience_points)
        next_level_xp = xp_for_level(new_level + 1)
        current_level_xp = xp_for_level(new_level)
        xp_progress = user.experience_points - current_level_xp
        xp_needed = next_level_xp - current_level_xp

        # Seviye yükseltme oldu mu kontrol et
        level_up = new_level > old_level

        # Puan detayları
        rewards = {
            'base_points': int(multipliers.get('point_base', 10)),
            'score_points': int(standard_score * 0.7),  # Standardize edilmiş puanın %70'i skor puanı
            'daily_bonus': daily_bonus,
            'streak_bonus': streak_bonus,
            'difficulty_multiplier': multipliers['difficulty_multiplier'],
            'time_bonus': int(playtime / 60),  # Dakika başına puan
            'time_factor': game_stats.get('time_factor', 1.0)
        }

        # Yanıt JSON'u oluştur - yeni puan sistemine göre
        return jsonify({
            'success': True, 
            'message': 'Skor kaydedildi!',
            'points': {
                'total': standard_score,  # 0-100 arası standartlaştırılmış puan
                'rewards': rewards
            },
            'xp': {
                'gain': xp_gain,
                'total': user.experience_points,
                'level': new_level,
                'progress': xp_progress,
                'needed': xp_needed,
                'progress_percent': int((xp_progress / xp_needed) * 100) if xp_needed > 0 else 100,
                'level_up': level_up,
                'old_level': old_level
            },
            'score_info': {
                'total_score': standard_score,
                'difficulty': difficulty,
                'game_type': game_type,
                'performance_score': multipliers.get('performance_score', 0),
                'skill_score': multipliers.get('skill_score', 0),
                'social_score': multipliers.get('social_score', 0)
            },
            'playtime': playtime,
            'redirect_params': {
                'levelUp': True,
                'newLevel': new_level
            } if level_up else {}
        })
    else:
        # Kullanıcı giriş yapmamış - skorunu kaydetmiyoruz
        # Sadece gösterge amaçlı hesaplama yapıyoruz
        
        # Puan detayları (gösterge amaçlı)
        rewards = {
            'base_points': int(multipliers.get('point_base', 10)),
            'score_points': int(standard_score * 0.7),
            'daily_bonus': 0,
            'streak_bonus': 0,
            'difficulty_multiplier': multipliers['difficulty_multiplier']
        }

        # Misafir kullanıcılar için tahmini XP hesaplama (gösterge amaçlı)
        xp_base = multipliers.get('xp_base', 15)
        xp_from_score = standard_score * 0.5
        difficulty_multiplier = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.5,
            'expert': 4.0
        }.get(difficulty, 1.0)
        
        # Tahmini XP hesaplama
        xp_gain = int((xp_base + xp_from_score) * difficulty_multiplier)

        # Misafir kullanıcılara bilgi mesajı
        guest_message = "Skorunuz kaydedilmedi! Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın veya kayıt olun."

        return jsonify({
            'success': False, 
            'message': guest_message,
            'guest': True,  # Misafir kullanıcı olduğunu belirt
            'login_required': True,  # Giriş gerektiğini belirt
            'points': {
                'total': standard_score,
                'rewards': rewards
            },
            'xp': {
                'gain': xp_gain,
                'level': 1,
                'progress_percent': 0
            },
            'score_info': {
                'total_score': standard_score,
                'difficulty': difficulty,
                'game_type': game_type,
                'performance_score': multipliers.get('performance_score', 0),
                'skill_score': multipliers.get('skill_score', 0),
                'social_score': multipliers.get('social_score', 0)
            }
        })

# Oyun derecelendirme API'si
@app.route('/api/rate-game', methods=['POST'])
def rate_game():
    """Oyun derecelendirme API'si

    Kullanıcının bir oyuna 1-5 arası puan vermesini sağlar.
    """
    # Kullanıcı girişi kontrolü
    if 'user_id' not in session:
        return jsonify({
            'success': False,
            'message': 'Derecelendirme yapmak için giriş yapmalısınız!',
            'guest': True,
            'login_required': True
        })

    # Gelen veriyi al ve doğrula
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Geçersiz JSON verisi!'})

    game_type = data.get('game_type')
    rating = data.get('rating')
    comment = data.get('comment', '')

    # Verilerin doğruluğunu kontrol et
    if not game_type:
        return jsonify({'success': False, 'message': 'Oyun türü belirtilmedi!'})

    if rating is None:
        return jsonify({'success': False, 'message': 'Derecelendirme değeri belirtilmedi!'})

    try:
        # Derecelendirme değerini int'e çevir
        rating = int(rating)

        # Derecelendirme 1-5 arasında olmalı
        if rating < 1 or rating > 5:
            return jsonify({'success': False, 'message': 'Derecelendirme 1-5 arasında olmalıdır!'})

    except (ValueError, TypeError) as e:
        logger.error(f"Derecelendirme dönüşüm hatası: {str(e)}, Değer: rating={rating}")
        return jsonify({'success': False, 'message': 'Geçersiz derecelendirme değeri!'})

    user_id = session['user_id']

    # Aynı kullanıcının aynı oyuna önceki derecelendirmesini kontrol et
    existing_rating = GameRating.query.filter_by(user_id=user_id, game_type=game_type).first()

    if existing_rating:
        # Varolan derecelendirmeyi güncelle
        existing_rating.rating = rating
        existing_rating.comment = comment
        existing_rating.timestamp = datetime.utcnow()
        db.session.commit()
        action = "güncellendi"
    else:
        # Yeni derecelendirme oluştur
        new_rating = GameRating(
            user_id=user_id,
            game_type=game_type,
            rating=rating,
            comment=comment
        )
        db.session.add(new_rating)
        db.session.commit()
        action = "eklendi"

    # Oyunun ortalama puanını güncelle (Game modeli varsa)
    game = Game.query.filter_by(slug=game_type).first()
    if game:
        # Bu oyuna ait tüm derecelendirmeleri al
        all_ratings = GameRating.query.filter_by(game_type=game_type).all()

        if all_ratings:
            # Ortalama puanı hesapla
            total_rating = sum(r.rating for r in all_ratings)
            avg_rating = total_rating / len(all_ratings)

            # Ortalama puanı güncelle
            game.avg_rating = avg_rating
            db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Derecelendirmeniz başarıyla {action}!',
        'rating': rating,
        'game_type': game_type
    })

# Oyun derecelendirmelerini getirme API'si
@app.route('/api/get-game-ratings/<game_type>')
def get_game_ratings(game_type):
    """Bir oyuna ait tüm derecelendirmeleri getirir"""
    try:
        # Oyunun derecelendirmelerini getir
        ratings = GameRating.query.filter_by(game_type=game_type).order_by(GameRating.timestamp.desc()).all()

        # Derecelendirme verisini düzenle
        ratings_data = []
        for rating in ratings:
            # Kullanıcı bilgilerini al
            user = User.query.get(rating.user_id)
            username = user.username if user else "Bilinmeyen Kullanıcı"

            # Avatar URL'si
            avatar_url = user.avatar_url if user and user.avatar_url else "/static/images/placeholder.jpg"

            # Derecelendirme verisini ekle
            ratings_data.append({
                'user': {
                    'id': rating.user_id,
                    'username': username,
                    'avatar_url': avatar_url
                },
                'rating': rating.rating,
                'comment': rating.comment,
                'timestamp': rating.timestamp.strftime("%d.%m.%Y %H:%M")
            })

        # Ortalama derecelendirmeyi hesapla
        avg_rating = 0
        if ratings:
            avg_rating = sum(r.rating for r in ratings) / len(ratings)

        return jsonify({
            'success': True,
            'ratings': ratings_data,
            'avg_rating': round(avg_rating, 1),
            'count': len(ratings)
        })

    except Exception as e:
        logger.error(f"Derecelendirmeleri getirirken hata: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Derecelendirmeler getirilirken bir hata oluştu!',
            'error': str(e)
        }), 500

# Kullanıcının bir oyuna verdiği derecelendirmeyi getir
@app.route('/api/get-user-rating/<game_type>')
def get_user_rating(game_type):
    """Giriş yapmış kullanıcının belirli bir oyuna verdiği derecelendirmeyi getirir"""
    if 'user_id' not in session:
        return jsonify({
            'success': False,
            'message': 'Derecelendirme bilgisi için giriş yapmalısınız!',
            'guest': True
        })

    try:
        user_id = session['user_id']

        # Kullanıcının derecelendirmesini getir
        rating = GameRating.query.filter_by(user_id=user_id, game_type=game_type).first()

        if rating:
            return jsonify({
                'success': True,
                'has_rated': True,
                'rating': rating.rating,
                'comment': rating.comment,
                'timestamp': rating.timestamp.strftime("%d.%m.%Y %H:%M")
            })
        else:
            return jsonify({
                'success': True,
                'has_rated': False
            })

    except Exception as e:
        logger.error(f"Kullanıcı derecelendirmesini getirirken hata: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Derecelendirme bilgisi getirilirken bir hata oluştu!'
        }), 500

# Mevcut Kullanıcı API'si - hem /api/current-user hem de /api/get-current-user ile erişilebilir
@app.route('/api/current-user')
@app.route('/api/get-current-user')
def get_current_user_api():
    """Mevcut kullanıcı kimliğini döndür (API)"""
    try:
        if 'user_id' in session:
            user_id = session['user_id']
            user = User.query.get(user_id)

            if user:
                return jsonify({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'total_score': user.total_score,  # Toplam puanı ekle
                    'experience_points': user.experience_points,
                    'rank': user.rank,
                    'loggedIn': True
                })

        # Kullanıcı giriş yapmamış veya kullanıcı bulunamadı
        return jsonify({
            'id': None,
            'username': None,
            'email': None,
            'loggedIn': False
        })
    except Exception as e:
        logger.error(f"Kullanıcı bilgilerini alırken hata oluştu: {str(e)}")
        return jsonify({
            'id': None,
            'username': None,
            'email': None,
            'loggedIn': False,
            'error': 'Bir hata oluştu'
        }), 500

# Skor Listeleme API'si
@app.route('/api/scores/<game_type>')
def get_scores(game_type):
    try:
        if not game_type:
            return jsonify({'success': False, 'message': 'Oyun türü belirtilmedi!'})

        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # En yüksek skorları getir (her kullanıcı için en iyi skor)
        # adjusted_score'un null olması durumunda orijinal skoru kullan
        subquery = db.session.query(
            Score.user_id,
            Score.game_type,
            db.func.max(db.case(
                [(Score.adjusted_score.isnot(None), Score.adjusted_score)],
                else_=Score.score)
            ).label('max_score'),
            db.func.max(Score.score).label('original_score')
        ).filter(
            Score.game_type == game_type
        ).group_by(
            Score.user_id,
            Score.game_type
        ).subquery()

        scores = db.session.query(
            Score,
            User.username,
            User.avatar_url,
            User.rank,
            subquery.c.max_score.label('display_score')
        ).join(
            subquery,
            db.and_(
                Score.user_id == subquery.c.user_id,
                Score.game_type == subquery.c.game_type,
                db.or_(
                    db.and_(Score.adjusted_score.isnot(None), Score.adjusted_score == subquery.c.max_score),
                    db.and_(Score.adjusted_score.is_(None), Score.score == subquery.c.max_score)
                )
            )
        ).join(
            User,
            User.id == Score.user_id
        ).filter(
            Score.game_type == game_type
        ).order_by(
            Score.score.desc()
        ).all()  # Tüm kullanıcıları getirmek için limit kaldırıldı

        result = []
        for score, username, avatar_url, rank, display_score in scores:
            # Profil resminin URL'sini düzelt (static/ öneki kaldırılır)
            fixed_avatar_url = avatar_url
            if avatar_url and not avatar_url.startswith(('http://', 'https://')):
                # Resim yolu göreceli ise düzelt
                if avatar_url.startswith('static/'):
                    fixed_avatar_url = avatar_url
                # uploads/ ile başlıyorsa bunu da düzelt
                elif avatar_url.startswith('uploads/'):
                    fixed_avatar_url = 'static/' + avatar_url
                else:
                    fixed_avatar_url = avatar_url

            result.append({
                'user_id': score.user_id,
                'username': username,
                'score': display_score,  # Zorluk seviyesi ayarlanmış skoru göster
                'original_score': score.score,  # Orijinal skoru da gönder
                'difficulty': score.difficulty,  # Zorluk seviyesini de gönder
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M'),
                'avatar_url': fixed_avatar_url,
                'rank': rank,
                'is_current_user': score.user_id == current_user_id
            })

        return jsonify(result)
    except Exception as e:
        logger.error(f"Skor verileri getirilirken hata oluştu ({game_type}): {str(e)}")
        return jsonify([]), 500

# Alternatif Skor Listeleme (Performans sorunları için)
@app.route('/api/scores/alt/<game_type>')
def get_scores_alt(game_type):
    try:
        if not game_type:
            return jsonify({'success': False, 'message': 'Oyun türü belirtilmedi!'})

        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # SQL sorgusu ile skorları doğrudan getir
        result = db.session.execute(f"""
            SELECT s.user_id, u.username, s.score, s.timestamp, u.avatar_url, u.rank
            FROM (
                SELECT user_id, MAX(score) as max_score
                FROM scores
                WHERE game_type = '{game_type}'
                GROUP BY user_id
            ) max_scores
            JOIN scores s ON s.user_id = max_scores.user_id AND s.score = max_scores.max_score AND s.game_type = '{game_type}'
            JOIN users u ON u.id = s.user_id
            ORDER BY s.score DESC
        """)

        scores = []
        for row in result:
            # Profil resminin URL'sini düzelt
            fixed_avatar_url = row.avatar_url
            if row.avatar_url and not row.avatar_url.startswith(('http://', 'https://')):
                # Resim yolu göreceli ise düzelt
                if row.avatar_url.startswith('static/'):
                    fixed_avatar_url = row.avatar_url
                # uploads/ ile başlıyorsa bunu da düzelt
                elif row.avatar_url.startswith('uploads/'):
                    fixed_avatar_url = 'static/' + row.avatar_url
                else:
                    fixed_avatar_url = row.avatar_url

            scores.append({
                'user_id': row.user_id,
                'username': row.username,
                'score': row.score,
                'timestamp': row.timestamp.strftime('%Y-%m-%d %H:%M'),
                'avatar_url': fixed_avatar_url,
                'rank': row.rank,
                'is_current_user': row.user_id == current_user_id
            })

        return jsonify(scores)
    except Exception as e:
        logger.error(f"Alternatif skor verileri getirilirken hata oluştu ({game_type}): {str(e)}")
        return jsonify([]), 500

# Toplam Skor API'si
@app.route('/api/scores/aggregated')
def get_aggregated_scores():
    """Tüm oyunlardaki toplam skorları getiren API."""
    try:
        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # En yüksek 10 toplam skora sahip kullanıcıları getir
        # Artık her kullanıcının total_score alanını kullanabiliriz
        result = db.session.query(
            User.id,
            User.username,
            User.avatar_url,
            User.rank,
            User.total_score
        ).filter(
            User.total_score > 0  # Sadece skoru olan kullanıcıları göster
        ).order_by(
            User.total_score.desc()  # Toplam skora göre sırala
        ).limit(10).all()  # En yüksek 10 kullanıcı

        scores = []
        for user_id, username, avatar_url, rank, total_score in result:
            # Profil resminin URL'sini düzelt
            fixed_avatar_url = avatar_url
            if avatar_url and not avatar_url.startswith(('http://', 'https://')):
                # Resim yolu göreceli ise düzelt
                if avatar_url.startswith('static/'):
                    fixed_avatar_url = avatar_url
                # uploads/ ile başlıyorsa bunu da düzelt
                elif avatar_url.startswith('uploads/'):
                    fixed_avatar_url = 'static/' + avatar_url
                else:
                    fixed_avatar_url = avatar_url

            scores.append({
                'user_id': user_id,
                'username': username,
                'total_score': total_score,
                'avatar_url': fixed_avatar_url,
                'rank': rank,
                'is_current_user': user_id == current_user_id
            })

        return jsonify(scores)
    except Exception as e:
        logger.error(f"Skor verilerini getirirken hata oluştu: {str(e)}")
        # Boş bir skor listesi döndür
        return jsonify([]), 500

# Skor Tablosu API'si
@app.route('/api/leaderboard/<game_type>')
def get_leaderboard(game_type):
    try:
        if game_type == 'all':
            return get_aggregated_scores()
        else:
            return get_scores(game_type)
    except Exception as e:
        logger.error(f"Liderlik tablosu verileri getirilirken hata oluştu ({game_type}): {str(e)}")
        return jsonify([]), 500

# Kullanıcı Seviyeleri API'si
@app.route('/api/users/levels')
def get_users_levels():
    """En yüksek seviyeli kullanıcıları döndürür (limit parametresi ile sınırlandırılabilir)"""
    try:
        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # Limit parametresini al (varsayılan 10)
        limit = request.args.get('limit', 10, type=int)
        
        # Limit maksimum 100 olabilir
        if limit > 100:
            limit = 100
            
        # En yüksek seviyeye sahip kullanıcıları getir
        users = User.query.order_by(User.experience_points.desc()).limit(limit).all()

        result = []

        for user in users:
            # Kullanıcının seviyesini hesapla
            level = calculate_level(user.experience_points)

            # Bir sonraki seviyeye geçmek için gereken XP
            next_level_xp = xp_for_level(level + 1)
            current_level_xp = xp_for_level(level)
            xp_needed = next_level_xp - current_level_xp

            # Şu anki ilerleme
            progress = user.experience_points - current_level_xp

            # İlerleme yüzdesi
            progress_percent = int((progress / xp_needed) * 100) if xp_needed > 0 else 100

            # Avatar URL'i düzelt
            avatar_url = user.avatar_url
            if avatar_url and not avatar_url.startswith('http') and not avatar_url.startswith('/'):
                avatar_url = '/' + avatar_url

            result.append({
                'username': user.username,
                'level': level,
                'experience_points': user.experience_points,
                'total_xp': user.experience_points,
                'progress_percent': progress_percent,
                'games_played': user.total_games_played,
                'avatar_url': avatar_url,
                'rank': user.rank,
                'is_current_user': user.id == current_user_id
            })

        return jsonify(result)
    except Exception as e:
        logging.error(f"Kullanıcı seviyeleri getirilirken hata oluştu: {str(e)}")
        return jsonify([]), 500

# Alternatif Kullanıcılar API'si (Top Users)
@app.route('/api/scores/top-users')
def get_top_users():
    """En yüksek toplam skora sahip kullanıcıları döndürür"""
    try:
        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # En yüksek toplam skora sahip 10 kullanıcıyı getir
        top_users = User.query.filter(User.total_score > 0).order_by(User.total_score.desc()).limit(10).all()

        result = []

        for user in top_users:
            # Kullanıcının seviyesini hesapla
            level = calculate_level(user.experience_points)

            # Avatar URL'i düzelt
            avatar_url = user.avatar_url
            if avatar_url and not avatar_url.startswith('http') and not avatar_url.startswith('/'):
                avatar_url = '/' + avatar_url

            result.append({
                'username': user.username,
                'level': level,
                'experience_points': user.experience_points,
                'total_xp': user.experience_points,
                'progress_percent': 0,  # İlerleme yüzdesini burada hesaplamıyoruz
                'games_played': user.total_games_played,
                'avatar_url': avatar_url,
                'total_score': user.total_score,  # Toplam skoru kullan
                'rank': user.rank,
                'is_current_user': user.id == current_user_id
            })

        return jsonify(result)
    except Exception as e:
        logging.error(f"En iyi kullanıcılar getirilirken hata oluştu: {str(e)}")
        return jsonify([]), 500

# Skor Tablosu Verisi
@app.route('/api/leaderboard-data/<game_type>')
def get_leaderboard_data(game_type):
    # Oyun türü çevirisi
    game_names = {
        'all': 'Tüm Oyunlar',
        'wordPuzzle': 'Kelime Bulmaca',
        'memoryMatch': 'Hafıza Eşleştirme',
        'numberSequence': 'Sayı Dizisi',
        'memoryCards': 'Hafıza Kartları',
        'numberChain': 'Sayı Zinciri',
        'labyrinth': '3D Labirent',
        'puzzle': 'Bulmaca',
        'audioMemory': 'Sesli Hafıza',
        'nBack': 'N-Back',
        '2048': '2048',
        'wordle': 'Wordle',
        'chess': 'Satranç',
        'puzzle_slider': 'Resim Bulmaca',
        'snake_game': 'Yılan Oyunu',
        'minesweeper': 'Mayın Tarlası'  # Mayın Tarlası eklendi
    }

    return jsonify({
        'game_type': game_type,
        'game_name': game_names.get(game_type, game_type),
        'games': list(game_names.items())
    })

# Yardımcı fonksiyonlar

# Geri bildirim
@app.route('/api/send-feedback', methods=['POST'])
def send_feedback():
    """
    Geri bildirim formundan gelen verileri alıp e-posta olarak gönderir
    """
    try:
        data = request.json
        feedback_type = data.get('type', 'Belirtilmemiş')
        feedback_subject = data.get('subject', 'Geri Bildirim')
        feedback_content = data.get('content', '')
        
        # Kullanıcı bilgilerini ekle
        user_info = ""
        if session.get('user_id'):
            user_info = "\n\n--- Kullanıcı Bilgileri ---\n"
            user_info += f"Kullanıcı Adı: {session.get('username')}\n"
            user_info += f"E-posta: {session.get('email')}\n"
            user_info += f"Kullanıcı ID: {session.get('user_id')}"
        else:
            user_info = "\n\n--- Kullanıcı giriş yapmamış ---"
        
        # E-posta içeriği oluştur
        subject = f"OmGame Geri Bildirim: {feedback_type} - {feedback_subject}"
        
        # HTML içerik
        html_body = """
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4a67e8;">Yeni Geri Bildirim Alındı</h2>
                    <p><strong>Tür:</strong> """ + feedback_type + """</p>
                    <p><strong>Konu:</strong> """ + feedback_subject + """</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        """ + feedback_content.replace('\n', '<br>') + """
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <h4>Kullanıcı Bilgileri</h4>
                        <pre style="font-family: monospace; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">""" + user_info + """</pre>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-top: 30px;">
                        Bu e-posta OmGame web sitesinin geri bildirim formundan gönderilmiştir.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Var olan e-posta gönderme fonksiyonunu kullan
        result = send_email_in_background("omgameee@gmail.com", subject, html_body, from_name="OmGame Geri Bildirim")
        
        if result:
            return jsonify({"success": True, "message": "Geri bildiriminiz başarıyla gönderildi."})
        else:
            return jsonify({"success": False, "message": "Geri bildirim gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz."}), 500
            
    except Exception as e:
        app.logger.error(f"Geri bildirim gönderme hatası: {str(e)}")
        return jsonify({"success": False, "message": f"Geri bildirim gönderilirken bir hata oluştu: {str(e)}"}), 500

@app.route('/api/users/leaderboard')
def get_users_leaderboard():
    """
    Kullanıcıları seviye veya toplam puana göre sıralanmış şekilde döndürür
    sort parametresi 'level' veya 'score' olabilir
    """
    try:
        # Sıralama parametresini al
        sort_by = request.args.get('sort', 'level')

        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # Sıralamaya göre kullanıcıları getir
        if sort_by == 'level':
            # Seviyeye göre sırala (experience_points)
            users = User.query.order_by(User.experience_points.desc()).limit(10).all()
        else:
            # Toplam puana göre sırala (total_score) - artık total_score alanını kullanıyoruz
            users = User.query.filter(User.total_score > 0).order_by(User.total_score.desc()).limit(10).all()

        result = []

        for user in users:
            # Kullanıcının seviyesini hesapla
            level = calculate_level(user.experience_points)

            # Bir sonraki seviyeye geçmek için gereken XP
            next_level_xp = xp_for_level(level + 1)
            current_level_xp = xp_for_level(level)
            xp_needed = next_level_xp - current_level_xp

            # Şu anki ilerleme
            progress = user.experience_points - current_level_xp

            # İlerleme yüzdesi
            progress_percent = int((progress / xp_needed) * 100) if xp_needed > 0 else 100

            # Avatar URL'i düzelt
            avatar_url = user.avatar_url
            if avatar_url and not avatar_url.startswith('http') and not avatar_url.startswith('/'):
                avatar_url = '/' + avatar_url

            result.append({
                'username': user.username,
                'level': level,
                'experience_points': user.experience_points,
                'total_xp': user.experience_points,
                'progress_percent': progress_percent,
                'games_played': user.total_games_played,
                'avatar_url': avatar_url,
                'total_score': user.total_score,
                'rank': user.rank,
                'is_current_user': user.id == current_user_id
            })

        return jsonify(result)
    except Exception as e:
        logging.error(f"Kullanıcılar liderlik tablosu getirilirken hata oluştu: {str(e)}")
        return jsonify([]), 500

# Şifre sıfırlama blueprint'ini içe aktar
# Password reset functionality removed

# Blueprint'i kaydet
# Password reset blueprint removed

@app.route('/education-games')
def education_games():
    """Eğitim, eğlence ve oyun sayfası"""
    # Eğitici oyun listesi oluştur
    games = [
        # Dil ve Kelime Oyunları
        {
            "title": "Bayrak Tahmin Oyunu",
            "description": "Dünya bayraklarını tahmin ederek görsel hafızanızı ve coğrafi bilginizi geliştirin.",
            "icon": "fas fa-flag",
            "url": "/games/flag-quiz"
        },
        {
            "title": "Dil Öğrenme",
            "description": "Duolingo tarzı interaktif dil öğrenme egzersizleri ile yeni bir dil öğrenin.",
            "icon": "fas fa-language",
            "url": "/games/language-learning"
        },
        {
            "title": "Word Master",
            "description": "Çoktan seçmeli, yazım ve telaffuz aşamalarıyla İngilizce kelime haznenizi geliştirin.",
            "icon": "fas fa-spell-check",
            "url": "/word-master"
        },
        
        # Mantık ve Matematik Oyunları
        {
            "title": "Sudoku",
            "description": "Her satır, sütun ve blokta 1-9 rakamlarını doğru yerleştirerek mantıksal düşünme becerinizi geliştirin.",
            "icon": "fas fa-th",
            "url": "/games/sudoku"
        },
        {
            "title": "Mayın Tarlası",
            "description": "Mantık yürüterek mayınların yerlerini tespit edin ve güvenli alanları açın.",
            "icon": "fas fa-bomb",
            "url": "/games/minesweeper"
        },
        {
            "title": "Fotoğraf Yapboz",
            "description": "Ünlü kişilerin ve manzaraların resimlerini parçalara ayırıp birleştirerek görsel hafıza ve odaklanma becerilerinizi geliştirin.",
            "icon": "fas fa-puzzle-piece",
            "url": "/games/photo-puzzle"
        },
        
        # Bilim Temalı Oyunlar
        {
            "title": "Bilimsel Keşif Zaman Çizelgesi",
            "description": "Tarihi bilimsel keşifleri kronolojik sıraya dizme oyunu. Bilim tarihini öğrenin.",
            "icon": "fas fa-history",
            "url": "/games/science-timeline"
        },
        {
            "title": "Element Avı",
            "description": "Periyodik tabloda element bulma oyunu. Elementlerin sembollerini ve özelliklerini öğrenin.",
            "icon": "fas fa-flask",
            "url": "/games/element-hunt"
        },
        {
            "title": "Bilim İnsanı Bulmacası",
            "description": "Bilim insanlarını buluşlarıyla eşleştirin. Tarihe yön veren bilim insanlarını tanıyın.",
            "icon": "fas fa-microscope",
            "url": "/games/scientist-puzzle"
        },
        
        # Kültür ve Sanat Temalı Oyunlar
        {
            "title": "Kültür Mozaiği",
            "description": "Dünya kültürlerini keşfedin. Ülkelerin bayrak, gelenek ve kültürel öğelerini eşleştirin.",
            "icon": "fas fa-globe-americas",
            "url": "/games/culture-mosaic"
        },
        {
            "title": "Sanat Eseri Tahmini",
            "description": "Ünlü sanat eserlerini tanıma oyunu. Ressamları, tabloları ve sanat akımlarını öğrenin.",
            "icon": "fas fa-paint-brush",
            "url": "/games/art-guess"
        },
        {
            "title": "Dünya Harita Yarışması",
            "description": "Coğrafi konumları harita üzerinde bulun. Şehirler, dağlar, nehirler ve kültürel mirası keşfedin.",
            "icon": "fas fa-map-marked-alt",
            "url": "/games/world-map-quiz"
        }
    ]
    
    # Sayfa template'ini döndür
    return render_template('education_games.html', games=games)

@app.route('/language-learning')
@app.route('/games/language-learning')
def language_learning():
    """Duolingo tarzı dil öğrenme oyunu"""
    # Dil öğrenme oyunu için dersler ve ifadeler oluştur
    lessons = [
        # A1 Seviyesi (Başlangıç)
        {
            "id": 1,
            "title": "Temel İfadeler",
            "description": "Günlük hayatta kullanılan temel ifadeleri öğrenin",
            "difficulty": "Kolay",
            "progress": 0,
            "level": "A1",
            "xp": 10
        },
        {
            "id": 2,
            "title": "Selamlaşma",
            "description": "Farklı dillerde selamlaşma ve tanışma ifadeleri",
            "difficulty": "Kolay", 
            "progress": 0,
            "level": "A1",
            "xp": 10
        },
        {
            "id": 3,
            "title": "Sayılar",
            "description": "1'den 100'e kadar sayıları öğrenin",
            "difficulty": "Kolay",
            "progress": 0,
            "level": "A1",
            "xp": 15
        },
        {
            "id": 4,
            "title": "Renkler ve Şekiller",
            "description": "Temel renkler ve geometrik şekillerin adları",
            "difficulty": "Kolay",
            "progress": 0,
            "level": "A1",
            "xp": 15
        },
        # A2 Seviyesi (Orta Seviye)
        {
            "id": 5,
            "title": "Yemek ve İçecekler",
            "description": "Restoranlarda ve kafelerde kullanabileceğiniz ifadeler",
            "difficulty": "Orta",
            "progress": 0,
            "level": "A2",
            "xp": 20
        },
        {
            "id": 6,
            "title": "Seyahat Terimleri",
            "description": "Seyahat ederken ihtiyaç duyacağınız temel kelimeler",
            "difficulty": "Orta",
            "progress": 0,
            "level": "A2",
            "xp": 20
        },
        {
            "id": 7,
            "title": "Alışveriş Terimleri",
            "description": "Alışveriş yaparken kullanabileceğiniz ifadeler",
            "difficulty": "Orta",
            "progress": 0,
            "level": "A2",
            "xp": 25
        },
        {
            "id": 8,
            "title": "Günlük Rutinler",
            "description": "Günlük aktiviteleri anlatmak için gereken kelimeler",
            "difficulty": "Orta",
            "progress": 0,
            "level": "A2",
            "xp": 25
        },
        # B1 Seviyesi (İleri Seviye)
        {
            "id": 9,
            "title": "İş Hayatı",
            "description": "İş görüşmeleri ve profesyonel ortamlarda kullanabileceğiniz ifadeler",
            "difficulty": "Zor",
            "progress": 0,
            "level": "B1",
            "xp": 30
        },
        {
            "id": 10,
            "title": "Sağlık ve Hastalıklar",
            "description": "Hastane ve eczanede kullanabileceğiniz terimler",
            "difficulty": "Zor",
            "progress": 0,
            "level": "B1",
            "xp": 30
        }
    ]
    
    # Dil seçenekleri
    languages = [
        {"code": "en", "name": "İngilizce", "flag": "gb"},
        {"code": "de", "name": "Almanca", "flag": "de"},
        {"code": "fr", "name": "Fransızca", "flag": "fr"},
        {"code": "es", "name": "İspanyolca", "flag": "es"},
        {"code": "it", "name": "İtalyanca", "flag": "it"}
    ]
    
    # Kullanıcı giriş yapmış mı kontrol et
    user_id = session.get('user_id')
    user_streak = 0
    daily_xp = 0
    
    if user_id:
        # Kullanıcının streak (üst üste gün) bilgisini al
        user = User.query.get(user_id)
        if user:
            # Burada gerçek uygulamada veritabanından kullanıcı streak bilgisini alırsınız
            # Şimdilik rastgele değerler kullanıyoruz
            user_streak = random.randint(0, 10)
            daily_xp = random.randint(0, 50)
    
    # Şablonu döndür
    return render_template('language_learning.html', 
                          lessons=lessons, 
                          languages=languages, 
                          user_streak=user_streak,
                          daily_xp=daily_xp)

@app.route('/games/word-master')
@app.route('/word-master')
def word_master():
    """Word Master: İngilizce kelime eğitimi
    Çoktan seçmeli, yazım ve telaffuz egzersizleriyle İngilizce kelime haznenizi geliştirin!"""
    return render_template('word_master.html')

@app.route('/language-lesson/<int:lesson_id>')
def language_lesson(lesson_id):
    """Belirli bir dil öğrenme dersini gösterir"""
    # Örnek veri dizisi
    
    # Kullanıcının seçtiği dil (gerçek uygulamada session veya veritabanından alınır)
    selected_language = request.args.get('lang', 'en')

# Bilim ve Kültür Temalı Oyunlar için Rotalar
# Kaldırıldı: Bilimsel Keşif Zaman Çizelgesi, Element Avı, Bilim İnsanı Bulmacası, Kültür Mozaiği, Sanat Eseri Tahmini, Dünya Harita Yarışması

@app.route('/send-certificate', methods=['POST'])
def send_certificate():
    """Word Master oyunu için sertifika e-postası gönderir"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "Geçersiz istek verisi"}), 400
            
        user_email = data.get('userEmail')
        user_name = data.get('userName', 'Değerli Kullanıcı')
        score = data.get('score', 0)
        success_rate = data.get('successRate', '0%')
        level = data.get('level', 'A1')
        date = data.get('date', datetime.now().strftime('%d/%m/%Y'))
        
        # E-posta içeriği
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8a6fff;">İngilizce Dil Sertifikası</h1>
            <p style="font-size: 18px; color: #555;">English Word Quest</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #8a6fff; border-radius: 10px;">
            <h2 style="margin-bottom: 5px;">Bu belge</h2>
            <h1 style="margin: 10px 0; color: #333; font-size: 24px;">{user_name}</h1>
            <h2 style="margin-top: 5px;">adına düzenlenmiştir</h2>

            <p style="margin: 20px 0; font-size: 18px;">
              İngilizce dil seviyesi: <strong style="color: #8a6fff;">{level}</strong>
            </p>

            <p style="font-size: 16px; color: #555;">
              Başarı oranı: {success_rate}<br>
              Doğru cevap: {score}<br>
              Tarih: {date}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #777; font-size: 14px;">
            <p>Bu sertifika, Word Master uygulamasında tamamlanan final deneme sınavı sonucuna göre düzenlenmiştir.</p>
            <p>©️ {datetime.now().year} Word Master</p>
          </div>
        </div>
        """
        
        # E-posta gönderme işlemi
        result = send_email_in_background(
            to_email=user_email, 
            subject="İngilizce Dil Sertifikası - Word Master", 
            html_body=html_content,
            from_name="Word Master"
        )
        
        if result:
            logger.info(f"Sertifika e-postası gönderildi: {user_email}")
            return jsonify({"success": True})
        else:
            logger.error(f"Sertifika e-postası gönderilemedi: {user_email}")
            return jsonify({"success": False, "error": "E-posta gönderimi başarısız"})
            
    except Exception as e:
        logger.error(f"Sertifika gönderme hatası: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
    # Ders bilgisi
    lesson = None
    
    # Ders ID'sine göre içerik hazırla
    if lesson_id == 1:
        lesson = {
            "id": 1,
            "title": "Temel İfadeler",
            "description": "Günlük hayatta kullanılan temel ifadeleri öğrenin",
            "exercises": [
                {
                    "type": "translation",
                    "question": "Merhaba",
                    "options": ["Hello", "Goodbye", "Thank you", "Please"],
                    "correct": "Hello",
                    "language": "en"
                },
                {
                    "type": "multiple_choice",
                    "question": "Hangi kelime 'Teşekkür ederim' anlamına gelir?",
                    "options": ["Hello", "Sorry", "Thank you", "Goodbye"],
                    "correct": "Thank you"
                },
                {
                    "type": "matching",
                    "pairs": [
                        {"native": "Merhaba", "foreign": "Hello"},
                        {"native": "Hoşça kal", "foreign": "Goodbye"},
                        {"native": "Teşekkürler", "foreign": "Thank you"},
                        {"native": "Lütfen", "foreign": "Please"}
                    ]
                }
            ]
        }
    elif lesson_id == 2:
        lesson = {
            "id": 2,
            "title": "Selamlaşma",
            "description": "Farklı dillerde selamlaşma ve tanışma ifadeleri",
            "exercises": [
                {
                    "type": "translation",
                    "question": "İyi günler",
                    "options": ["Good day", "Good night", "Good evening", "Good morning"],
                    "correct": "Good day",
                    "language": "en"
                },
                {
                    "type": "multiple_choice",
                    "question": "Hangi kelime 'Nasılsın?' anlamına gelir?",
                    "options": ["What's up?", "How are you?", "Where are you?", "Who are you?"],
                    "correct": "How are you?"
                }
            ]
        }
    elif lesson_id == 3:
        lesson = {
            "id": 3,
            "title": "Sayılar",
            "description": "1'den 100'e kadar sayıları öğrenin",
            "exercises": [
                {
                    "type": "multiple_choice",
                    "question": "'Seven' hangi sayıya karşılık gelir?",
                    "options": ["6", "7", "8", "9"],
                    "correct": "7"
                },
                {
                    "type": "translation",
                    "question": "12",
                    "options": ["Ten", "Eleven", "Twelve", "Thirteen"],
                    "correct": "Twelve",
                    "language": "en"
                },
                {
                    "type": "matching",
                    "pairs": [
                        {"native": "1", "foreign": "One"},
                        {"native": "5", "foreign": "Five"},
                        {"native": "10", "foreign": "Ten"},
                        {"native": "20", "foreign": "Twenty"}
                    ]
                },
                {
                    "type": "multiple_choice",
                    "question": "Yirmiden sonraki sayı hangisidir?",
                    "options": ["Twenty-one", "Twenty-two", "Twelve", "Nineteen"],
                    "correct": "Twenty-one"
                }
            ]
        }
    else:
        # Diğer dersler için basit bir şablon
        lesson = {
            "id": lesson_id,
            "title": f"Ders {lesson_id}",
            "description": "Bu ders henüz hazırlanıyor...",
            "exercises": []
        }
    
    # Şablonu döndür
    return render_template('language_lesson.html', lesson=lesson, lesson_id=lesson_id, selected_language=selected_language)

# Bot sistemini başlatmak için yardımcı fonksiyon
def setup_bot_system():
    """Bot sistemini başlatır"""
    try:
        logger.info("Bot sistemi başlatılıyor...")
        from bot_system import initialize_bot_system
        # Bot sistemini başlat (15 bot oluşturarak)
        initialize_bot_system(initial_bot_count=15)
        logger.info("Bot sistemi başlatıldı!")
    except Exception as e:
        logger.error(f"Bot sistemi başlatılırken hata: {str(e)}")

# Bot sistemini başlatmak için route tanımla
@app.route('/admin/setup-bots', methods=['GET'])
def admin_setup_bots():
    """Bot sistemini manuel olarak başlatmak için yönetici sayfası"""
    setup_bot_system()
    return "Bot sistemi başlatıldı! Ana sayfaya dönmek için <a href='/'>buraya tıklayın</a>."

# Bot sistemini başlatmak için route'u çağıralım
try:
    # Uygulama başladığında bot sistemini aktifleştir
    from bot_system import initialize_bot_system
    # Doğrudan bot sistemini başlat
    with app.app_context():
        initialize_bot_system(initial_bot_count=15)
        print("Bot sistemi başlatıldı!")
except Exception as e:
    print(f"Bot sistemini başlatırken hata: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)