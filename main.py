from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, make_response
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import json
from werkzeug.utils import secure_filename
import logging
import uuid
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
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///beyin_egzersizi.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
app.secret_key = os.environ.get("SESSION_SECRET", "beyin_egzersizi_gizli_anahtar")

# Yükleme klasörü ayarları
UPLOAD_FOLDER = 'static/uploads/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB limit

# Logging ayarları
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Veritabanı
from models import db, User, Score, Article, Achievement, GameStat, AdminUser, Game, SiteSettings, Page, BlogPost, Category, MediaFile, AdminLog, GameRating

# Veritabanını uygulama ile ilişkilendir
db.init_app(app)

# Admin panel blueprint'ini içe aktar
from admin import admin_bp
# Admin blueprint'ini kaydet
app.register_blueprint(admin_bp, url_prefix='/admin')

# Veritabanı tabloları oluştur
with app.app_context():
    db.create_all()
    logger.info("Database tables created successfully")

def allowed_file(filename):
    """Dosya uzantısının izin verilen uzantılardan olup olmadığını kontrol eder."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def send_welcome_email(to_email, username):
    """
    Sends a welcome email to a newly registered user

    Uses the configured Gmail account (omgameee@gmail.com) to send welcome emails
    """
    try:
        from_email = "omgameee@gmail.com"
        password = "ithkbmqvkzuwosjv"  # App Password, not the actual Gmail password

        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = "OmGame - Hoş Geldiniz!"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4a67e8; text-align: center;">OmGame Dünyasına Hoş Geldiniz!</h2>
                <p>Merhaba {username},</p>
                <p>OmGame'e kaydolduğunuz için teşekkür ederiz! Artık beyin geliştirici oyunlarımıza erişebilir, 
                   skorlarınızı takip edebilir ve liderlik tablolarında yerinizi alabilirsiniz.</p>

                <h3 style="color: #4a67e8;">OmGame'de Neler Yapabilirsiniz?</h3>
                <ul>
                    <li>Farklı kategorilerde beyin geliştirici oyunlar oynayabilirsiniz</li>
                    <li>Oyunlardaki performansınızla XP kazanarak seviye atlayabilirsiniz</li>
                    <li>Diğer oyuncularla rekabet edebilirsiniz</li>
                    <li>Oynadıkça beyninizi geliştirebilirsiniz</li>
                </ul>

                <p>Hemen giriş yapın ve oyunları keşfetmeye başlayın: <a href="https://omgame.replit.app">OmGame</a></p>

                <p>Herhangi bir sorunuz veya öneriniz varsa, bize bildirmekten çekinmeyin.</p>

                <p>İyi oyunlar,<br>OmGame Ekibi</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"E-posta gönderirken hata oluştu: {e}")
        return False

def send_verification_email(to_email, verification_code):
    """
    Sends a verification email with the provided code

    Uses the configured Gmail account (omgameee@gmail.com) to send verification emails
    """
    try:
        from_email = "omgameee@gmail.com"
        password = "ithkbmqvkzuwosjv"  # App Password, not the actual Gmail password

        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = "OmGame - E-posta Doğrulama Kodu"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4a67e8; text-align: center;">OmGame'e Hoş Geldiniz!</h2>
                <p>Merhaba,</p>
                <p>OmGame hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
                <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0; font-size: 24px; letter-spacing: 5px;">{verification_code}</h3>
                </div>
                <p>Bu kod 30 dakika boyunca geçerlidir.</p>
                <p>Eğer böyle bir talepte bulunmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
                <p>Teşekkürler,<br>OmGame Ekibi</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        return False

def get_user_avatar(user_id):
    """
    Kullanıcının profil fotoğrafının URL'sini döndürür.
    Profil fotoğrafı yoksa varsayılan avatar URL'sini döndürür.

    URL'leri frontend'de kullanmak için hazır hale getirir.
    """
    user = User.query.get(user_id)
    if user and user.avatar_url:
        return user.avatar_url
    else:
        return "images/placeholder.jpg"  # Varsayılan profil fotoğrafı

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
                    title="Bilişsel Egzersizlere Yeni Başlayanlar İçin Rehber",
                    content="""
                    <h3>Beyin Egzersizi Yolculuğuna Başlamak</h3>
                    <p>Beyin egzersizleri yapmak ilk başta korkutucu olabilir, ama doğru yaklaşımla herkes için erişilebilir ve eğlenceli olabilir.</p>

                    <h4>Başlangıç seviyesi stratejileri:</h4>
                    <ol>
                        <li><strong>Basit Başlayın:</strong> Temel zorluk seviyelerinde kendinize güven kazanın ve aşırı zorlamadan ilerleme kaydedin.</li>
                        <li><strong>Düzenli, Kısa Seanslar:</strong> Her gün 10-15 dakikalık oturumlar, uzun ama seyrek oturumlardan daha etkilidir.</li>
                        <li><strong>Çeşitliliği Benimseyin:</strong> Farklı bilişsel becerileri hedefleyen çeşitli oyunlar deneyin.</li>
                        <li><strong>Gelişimi Takip Edin:</strong> İlerlemenizi izleyin, ancak kendiniziyle rekabet edin, başkalarıyla değil.</li>
                        <li><strong>Eğlenceyi Önceliklendirin:</strong> Keyif aldığınız zihinsel aktivitelerde daha iyi performans göstereceksiniz.</li>
                        <li><strong>Sabırlı Olun:</strong> Bilişsel gelişim zaman alır, sürekli küçük gelişmeleri hedefleyin.</li>
                        <li><strong>Gerçekçi Beklentiler Oluşturun:</strong> Herkes farklı başlangıç becerilerine ve ilerleme hızlarına sahiptir.</li>
                    </ol>
                    <p>Unutmayın, bilişsel egzersiz bir maraton, sprint değil. ZekaPark'ta, seviyeniz ne olursa olsun sizin için uygun zorluklar bulabilirsiniz.</p>
                    """,
                    category="tip"
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
            # Kullanıcının son aktif zamanını güncelle
            user.last_active = datetime.utcnow()
            db.session.commit()

            flash('Giriş başarılı!', 'success')

            # Yönlendirilecek sayfa varsa oraya git
            if redirect_url:
                return redirect(redirect_url)
            return redirect(url_for('index'))
        else:
            flash('Email veya şifre hatalı!', 'danger')

    return render_template('login.html')

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
def simon_says():
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
@login_required
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
        if User.query.filter_by(username=username).first():
            flash('Bu kullanıcı adı zaten kullanılıyor!', 'danger')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
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
        db.session.add(new_user)
        db.session.commit()

        # Hoş geldiniz e-postası gönder - her kayıt olana gönderilecek
        email_sent = send_welcome_email(email, username)
        if email_sent:
            flash('Hoş geldiniz! E-posta adresinize bir karşılama mesajı gönderdik.', 'success')
        else:
            flash('Kaydınız başarılı! Ancak karşılama e-postası gönderilirken bir hata oluştu.', 'warning')
            # E-posta gönderiminde hata olsa bile kullanıcı kaydını tamamla
            
        # Otomatik giriş yap
        session['user_id'] = new_user.id

        flash('Kayıt başarılı! OmGame dünyasına hoş geldiniz!', 'success')
        return redirect(url_for('index'))

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

# Avatar Güncelleme
@app.route('/profile/update/avatar', methods=['POST'])
def update_avatar():
    """Profil fotoğrafını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])

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

    # Tema tercihini al
    theme = request.form.get('theme', 'dark')

    # Tema tercihini doğrula
    if theme not in ['light', 'dark', 'system']:
        theme = 'dark'  # Varsayılan tema

    # Kullanıcı ayarını güncelle
    user.theme_preference = theme
    db.session.commit()

    return jsonify({'success': True, 'message': 'Tema tercihi güncellendi!'})

# Hesap Silme
@app.route('/profile/delete', methods=['POST'])
def delete_account():
    """Hesabı silme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])
    password = request.form.get('password')

    # Şifre doğrulama
    if not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'message': 'Şifre doğrulaması başarısız!'})

    # Kullanıcının skorlarını sil
    Score.query.filter_by(user_id=user.id).delete()

    # Kullanıcıyı sil
    db.session.delete(user)
    db.session.commit()

    # Oturumu sonlandır
    session.pop('user_id', None)

    return jsonify({'success': True, 'message': 'Hesabınız başarıyla silindi!'})

# Hesap Dondurma
@app.route('/profile/suspend', methods=['POST'])
def suspend_account():
    """Hesabı dondurma."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Oturum açık değil!'})

    user = User.query.get(session['user_id'])
    password = request.form.get('password')
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

    # Hesabı dondur
    user.account_status = 'suspended'
    user.suspended_until = datetime.utcnow() + timedelta(days=duration)
    db.session.commit()

    # Oturumu sonlandır
    session.pop('user_id', None)

    return jsonify({'success': True, 'message': f'Hesabınız {duration} gün boyunca donduruldu!'})

# Şifremi Unuttum
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')

        # E-posta ile kullanıcıyı bul
        user = User.query.filter_by(email=email).first()

        if user:
            # Rastgele 6 haneli kod oluştur
            reset_code = str(random.randint(100000, 999999))

            # Token ve son kullanma tarihi kaydet
            user.reset_token = reset_code
            user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=30)
            db.session.commit()

            # E-posta gönder
            if send_verification_email(email, reset_code):
                flash('Şifre sıfırlama kodunuz e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')
                return redirect(url_for('reset_code', email=email))
            else:
                flash('E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        else:
            # Güvenlik için kullanıcının bulunup bulunmadığını belirtme
            flash('Şifre sıfırlama talimatları e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')

    return render_template('forgot_password.html')

# Şifre Sıfırlama Kodu
@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    email = request.args.get('email', '')

    if request.method == 'POST':
        code = request.form.get('code')
        email = request.form.get('email')

        # Kod ve e-posta ile kullanıcıyı bul
        user = User.query.filter_by(email=email, reset_token=code).first()

        if user and user.reset_token_expiry > datetime.utcnow():
            # Kodu doğrula ve şifre sıfırlama sayfasına yönlendir
            return redirect(url_for('reset_password', email=email, token=code))
        else:
            flash('Geçersiz veya süresi dolmuş kod!', 'danger')

    return render_template('reset_code.html', email=email)

# Şifre Sıfırlama
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email', '')
    token = request.args.get('token', '')

    # Token ve e-posta ile kullanıcıyı bul
    user = User.query.filter_by(email=email, reset_token=token).first()

    if not user or user.reset_token_expiry < datetime.utcnow():
        flash('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı!', 'danger')
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            flash('Şifreler eşleşmiyor!', 'danger')
        elif len(password) < 8:
            flash('Şifre en az 8 karakter olmalıdır!')
        else:
                        # Şifreyi güncelle ve token'ı temizle
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()

            flash('Şifreniz başarıyla sıfırlandı! Şimdi giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))

    return render_template('reset_password.html', email=email, token=token)

# Oyun zorluğuna göre puan ve XP çarpanı hesaplama fonksiyonu
def calculate_multipliers(game_type, difficulty=None, game_stats=None):
    """
    Oyun türüne, zorluğuna ve oyun istatistiklerine göre puan ve XP çarpanlarını hesaplar

    Args:
        game_type (str): Oyun türü
        difficulty (str, optional): Zorluk seviyesi (easy, medium, hard)
        game_stats (dict, optional): Oyun istatistikleri (süre, hamle sayısı, ipucu sayısı, vb.)

    Returns:
        dict: Puan ve XP çarpanları
    """
    # Varsayılan çarpanlar
    multipliers = {
        'point_base': 50,  # Temel puan
        'score_multiplier': 0.5,  # Skor çarpanı
        'xp_base': 30,  # Temel XP
        'xp_score_multiplier': 0.25,  # Skor başına XP - arttırıldı
        'difficulty_multiplier': 1.0,  # Zorluk çarpanı
        'final_score': None  # Hesaplanacak nihai skor
    }

    # Oyun türüne göre özel çarpanlar
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
        'memoryMatch': {'point_base': 60, 'score_multiplier': 0.7} # Memory Match için çarpanlar eklendi

    }

    # Oyun türüne göre çarpanları güncelle
    if game_type in game_multipliers:
        multipliers.update(game_multipliers[game_type])

    # Zorluk seviyesine göre çarpanı ayarla - daha belirgin farklar yaratılıyor
    if difficulty:
        if difficulty == 'easy':
            multipliers['difficulty_multiplier'] = 1.0  # Kolay seviye temel puan
            multipliers['xp_base'] = 20  # Kolay seviye temel XP
        elif difficulty == 'medium':
            multipliers['difficulty_multiplier'] = 1.5  # Orta seviye %50 daha fazla puan
            multipliers['xp_base'] = 30  # Orta seviye temel XP
        elif difficulty == 'hard':
            multipliers['difficulty_multiplier'] = 2.5  # Zor seviye %150 daha fazla puan
            multipliers['xp_base'] = 45  # Zor seviye temel XP
        elif difficulty == 'expert':
            multipliers['difficulty_multiplier'] = 4.0  # Uzman seviye %300 daha fazla puan
            multipliers['xp_base'] = 70  # Uzman seviye temel XP

    # Eğer oyun istatistikleri verildiyse, daha gerçekçi bir puan hesapla
    if game_stats:
        # Başlangıç puanı
        base_score = 50

        # Oyun süresini puan hesaplamasına kat
        duration_seconds = game_stats.get('duration_seconds', 0)
        duration_minutes = duration_seconds / 60.0

        # Süreye bağlı puanlama (oyuna göre değişebilir)
        duration_score = 0
        if game_type in ['tetris', 'snake_game']:
            # Bu oyunlarda uzun süre dayanmak iyidir
            duration_score = min(30, int(duration_minutes * 5))
        else:
            # Bu oyunlarda hızlı bitirmek iyidir
            # Oyun tipine göre optimal süre değişir (dakika cinsinden)
            optimal_duration_dict = {
                'memoryCards': 2.5,  # 2.5 dakika
                'wordPuzzle': 3.0,  # 3 dakika
                'wordle': 2.0,  # 2 dakika
                '2048': 3.0,  # 3 dakika
                'simon_says': 2.0,  # 2 dakika
                'audioMemory': 2.0,  # 2 dakika
                'nBack': 3.0,  # 3 dakika
                'numberSequence': 2.5,  # 2.5 dakika
                'labyrinth': 4.0,  # 4 dakika
                'puzzle': 3.0,  # 3 dakika
                'color_match': 1.5,  # 1.5 dakika
                'math_challenge': 2.0,  # 2 dakika
                'iq_test': 10.0,  # 10 dakika
                'numberChain': 2.5,  # 2.5 dakika
                'minesweeper': 5.0,  # Mayın Tarlası için optimal süre
                'memoryMatch': 2.0  # Memory Match için optimal süre eklendi
            }
            optimal_duration = game_stats.get('optimal_duration', optimal_duration_dict.get(game_type, 3.0))
            if duration_minutes <= optimal_duration:
                duration_score = int(30 * (optimal_duration - duration_minutes) / optimal_duration)
            else:
                duration_score = max(0, int(30 * (1 - (duration_minutes - optimal_duration) / (optimal_duration * 2))))

        # Hamle sayısına bağlı puanlama
        move_count = game_stats.get('move_count', 0)
        move_score = 0
        if move_count > 0:
            # Oyun tipine göre optimal hamle sayısı değişir
            optimal_moves = {
                'memoryCards': 30,
                'wordPuzzle': 25,
                'puzzle_slider': 40,
                'tetris': 100,
                'chess': 40,
                'wordle': 20,
                '2048': 80,
                'snake_game': 120,
                'simon_says': 25,
                'audioMemory': 35,
                'nBack': 40,
                'numberSequence': 45,
                'labyrinth': 50,
                'puzzle': 35,
                'color_match': 60,
                'math_challenge': 30,
                'typing_speed': 200,  # Yazmada daha fazla hamle normal
                'iq_test': 20,
                'numberChain': 40,
                'minesweeper': 50,  # Mayın Tarlası için optimal hamle sayısı
                'memoryMatch': 25 # Memory Match için optimal hamle sayısı eklendi
            }.get(game_type, 50)

            # Optimal hamlelerden daha fazla yapıldıysa puan düşer
            if move_count <= optimal_moves:
                move_score = 20
            else:
                move_score = max(0, int(20 * (1 - (move_count - optimal_moves) / optimal_moves)))

        # İpucu kullanımına bağlı puanlama
        hint_count = game_stats.get('hint_count', 0)
        hint_penalty = min(20, hint_count * 5)  # Her ipucu 5 puan düşürür, max 20 puan

        # Doğruluk oranına bağlı puanlama
        accuracy = game_stats.get('accuracy', 0)  # 0-100 arası
        accuracy_score = int(accuracy * 0.2)  # Max 20 puan

        # Brüt puanı hesapla
        raw_score = base_score + duration_score + move_score + accuracy_score - hint_penalty

        # Zorluk seviyesi katsayısını uygula
        adjusted_score = raw_score * multipliers['difficulty_multiplier']

        # Sınırları uygula (10-100 arası)
        final_score = max(10, min(100, int(adjusted_score)))

        # Nihai puanı ayarla
        multipliers['final_score'] = final_score

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
    """Oyun skorlarını kaydetme ve kullanıcı XP'sini güncelleme API'si"""
    # Gelen veriyi al ve doğrula
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Geçersiz JSON verisi!'})

    game_type = data.get('game_type')
    score = data.get('score')
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
        logger.debug(f"Skor dönüşümü: {score}, Süre dönüşümü: {playtime}")
    except (ValueError, TypeError) as e:
        logger.error(f"Skor veya süre dönüşüm hatası: {str(e)}, Değerler: score={score}, playtime={playtime}")
        return jsonify({'success': False, 'message': 'Geçersiz skor veya süre değeri!'})

    # Çarpanları hesapla 
    logger.debug(f"Çarpanlar hesaplanıyor: game_type={game_type}, difficulty={difficulty}")
    multipliers = calculate_multipliers(game_type, difficulty, game_stats)
    logger.debug(f"Hesaplanan çarpanlar: {multipliers}")

    # Performansa dayalı puanlama
    if multipliers.get('final_score'):
        # Yeni puanlama sisteminden gelen nihai puan
        final_score = multipliers['final_score']
        base_points = final_score * 0.5
        score_points = final_score * 0.5
        total_points = final_score

        # Puan bilgisini multipliers'a ekle
        multipliers['total_score'] = int(total_points)
        logger.debug(f"Final skor hesaplaması: {final_score}")
    else:
        # Temel puanlama sistemi
        # Zorluk seviyesine dayalı taban puan
        base_points = multipliers['point_base'] * multipliers['difficulty_multiplier']

        # Oyun skoruna dayalı ek puan (bu gerçek oyun performansını yansıtır)
        score_points = score * multipliers['score_multiplier']

        # Oyun süresine dayalı ek puan
        playtime_minutes = playtime / 60.0
        duration_points = min(20, int(playtime_minutes * 2))  # En fazla 20 puan

        # Toplam puanı hesapla
        total_points = base_points + score_points + duration_points

        # Sınırları uygula (10-100 arası)
        total_points = max(10, min(100, int(total_points)))

        multipliers['total_score'] = int(total_points)
        logger.debug(f"Standart skor hesaplaması: base={base_points}, score={score_points}, time={duration_points}, total={total_points}")

    # Kullanıcı giriş yapmış mı kontrol et
    if 'user_id' in session:
        user_id = session['user_id']
        user = User.query.get(user_id)
        now = datetime.utcnow()

        # Günlük bonus kontrolü
        daily_bonus = 0
        streak_bonus = 0

        if check_daily_bonus(user_id):
            daily_bonus = 20  # Günlük ilk oyun bonusu

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
                streak_bonus = min(streak_count * 5, 50)  # Maximum 50 bonus
            else:
                # Ardışık oynama bozulmuşsa sıfırla
                if hasattr(user, 'streak_count'):
                    user.streak_count = 1
                else:
                    user.streak_count = 1

        # Toplam puanı hesapla
        total_points = base_points + score_points + daily_bonus + streak_bonus

        # Geliştirilmiş XP hesaplama sistemi
        # Temel XP değeri (oyun türü ve zorluğa göre)
        xp_base = multipliers['xp_base']

        # Oyun performansına bağlı XP (skor ne kadar yüksekse o kadar çok XP)
        xp_from_score = score * multipliers['xp_score_multiplier']

        # Oyunda harcanan zamanına bağlı XP - her dakika için 5 XP, 
        # ama çok uzun oyunlarda azalan getiri
        playtime_minutes = playtime / 60
        if playtime_minutes <= 5:
            # 5 dakikaya kadar tam XP
            xp_from_time = playtime_minutes * 5
        else:
            # 5 dakikadan sonra azalan XP
            xp_from_time = 5 * 5 + (playtime_minutes - 5) * 3

        # Zorluk seviyesine göre ek XP bonusu - değerleri arttırdık
        difficulty_bonus = 1.0
        if difficulty == "easy":
            difficulty_bonus = 1.0  # Temel değer
        elif difficulty == "medium":
            difficulty_bonus = 1.5  # %50 bonus
        elif difficulty == "hard":
            difficulty_bonus = 2.5  # %150 bonus
        elif difficulty == "expert":
            difficulty_bonus = 4.0  # %300 bonus
        # Tamamlama başarısına göre bonus
        completion_bonus = 0
        if game_stats.get('completed', False):
            completion_bonus = int(xp_base * 0.3)  # Oyunu tamamlamak için %30 bonus

        # Ard arda kazanma (streak) bonusu
        streak_xp_bonus = 0
        if hasattr(user, 'streak_count') and user.streak_count > 1:
            streak_xp_bonus = min(user.streak_count * 2, 30)  # Maksimum 30 XP bonus

        # Toplam XP hesaplama
        xp_gain = int((xp_base + xp_from_score + xp_from_time) * difficulty_bonus + completion_bonus + streak_xp_bonus)

        # Yeni skoru kaydet (orijinal oyun skorunu ve zorluk seviyesini kullanarak)
        # Zorluk seviyesine göre düzenlenmiş skoru hesapla
        adjusted_score = int(score * multipliers['difficulty_multiplier'])

        new_score = Score(
            user_id=user_id,
            game_type=game_type,
            score=score,  # Orijinal oyun skorunu kaydediyoruz
            difficulty=difficulty,  # Zorluk seviyesini kaydediyoruz
            adjusted_score=adjusted_score  # Zorluk seviyesine göre düzenlenmiş skoru kaydediyoruz
        )

        db.session.add(new_score)

        # Kullanıcı bilgilerini güncelle
        user.experience_points += xp_gain
        user.total_games_played += 1
        user.last_active = now

        # Kullanıcının en yüksek skorunu güncelle (gerekirse)
        if score > user.highest_score:
            user.highest_score = score

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

        # Ödül detayları
        rewards = {
            'base_points': int(base_points),
            'score_points': int(score_points),
            'daily_bonus': daily_bonus,
            'streak_bonus': streak_bonus,
            'difficulty_multiplier': multipliers['difficulty_multiplier']
        }

        return jsonify({
            'success': True, 
            'message': 'Skor kaydedildi!',
            'points': {
                'total': int(total_points),
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
                'total_score': multipliers.get('total_score', int(total_points)),
                'difficulty': difficulty,
                'game_type': game_type
            },
            'redirect_params': {
                'levelUp': True,
                'newLevel': new_level
            } if level_up else {}
        })
    else:
        # Kullanıcı giriş yapmamış - skorunu kaydetmiyoruz
        # Ödül detayları (gösterge amaçlı)
        rewards = {
            'base_points': int(base_points),
            'score_points': int(score_points),
            'daily_bonus': 0,
            'streak_bonus': 0,
            'difficulty_multiplier': multipliers['difficulty_multiplier']
        }

        # Misafir kullanıcılar için tahmini XP hesaplama (gösterge amaçlı)
        # Geliştirilmiş XP hesaplama sistemi (misafir kullanıcılar için)
        xp_base = multipliers['xp_base']
        xp_from_score = score * multipliers['xp_score_multiplier']
        # Zorluk seviyesine göre ek XP bonusu - değerleri arttırdık
        difficulty_bonus = 1.0
        if difficulty == "easy":
            difficulty_bonus = 1.0  # Temel değer
        elif difficulty == "medium":
            difficulty_bonus = 1.5  # %50 bonus
        elif difficulty == "hard":
            difficulty_bonus = 2.5  # %150 bonus
        elif difficulty == "expert":
            difficulty_bonus = 4.0  # %300 bonus

        # Oyun süresine göre hesaplama
        playtime_minutes = playtime / 60
        if playtime_minutes <= 5:
            xp_from_time = playtime_minutes * 5
        else:
            xp_from_time = 5 * 5 + (playtime_minutes - 5) * 3

        # Misafir kullanıcıya göstermek için toplam XP - giriş yapınca alabilecekleri miktar
        xp_gain = int((xp_base + xp_from_score + xp_from_time) * difficulty_bonus)
        total_points = base_points + score_points

        # Misafir kullanıcılara bilgi mesajı
        guest_message = "Skorunuz kaydedilmedi! Skorlarınızı kaydetmek ve XP kazanmak için giriş yapın veya kayıt olun."

        return jsonify({
            'success': False, 
            'message': guest_message,
            'guest': True,  # Misafir kullanıcı olduğunu belirt
            'login_required': True,  # Giriş gerektiğini belirt
            'points': {
                'total': int(total_points),
                'rewards': rewards
            },
            'xp': {
                'gain': xp_gain,
                'level': 1,
                'progress_percent': 0
            },
            'score_info': {
                'total_score': multipliers.get('total_score', int(total_points)),
                'difficulty': difficulty,
                'game_type': game_type
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

        # Her kullanıcının tüm oyunlardaki en yüksek skorlarını topla
        subquery = db.session.query(
            Score.user_id,
            Score.game_type,
            db.func.max(Score.score).label('max_score')
        ).group_by(
            Score.user_id,
            Score.game_type
        ).subquery()

        # Alt sorgudan gelen sonuçları topla
        aggregated = db.session.query(
            subquery.c.user_id,
            db.func.sum(subquery.c.max_score).label('total_score')
        ).group_by(
            subquery.c.user_id
        ).subquery()

        # Kullanıcı bilgileriyle birleştir
        result = db.session.query(
            User.id,
            User.username,
            User.avatar_url,
            User.rank,
            aggregated.c.total_score
        ).join(
            aggregated,
            User.id == aggregated.c.user_id
        ).order_by(
            aggregated.c.total_score.desc()
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
    """En yüksek seviyeli ilk 10 kullanıcıyı döndürür"""
    try:
        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # En yüksek 10 seviyeye sahip kullanıcıları getir
        users = User.query.order_by(User.experience_points.desc()).limit(10).all()

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
    """En yüksek skora sahip kullanıcıları döndürür"""
    try:
        # Kullanıcı giriş yapmışsa kullanıcı ID'sini al
        current_user_id = session.get('user_id')

        # En yüksek toplam skora sahip 10 kullanıcıyı getir
        top_users = User.query.order_by(User.highest_score.desc()).limit(10).all()

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
                'total_score': user.highest_score,
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

# Kullanıcılar Liderlik Tablosu (Seviye veya Puan bazlı)
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
            # Toplam puana göre sırala (highest_score)
            users = User.query.order_by(User.highest_score.desc()).limit(10).all()

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
                'total_score': user.highest_score,
                'rank': user.rank,
                'is_current_user': user.id == current_user_id
            })

        return jsonify(result)
    except Exception as e:
        logging.error(f"Kullanıcılar liderlik tablosu getirilirken hata oluştu: {str(e)}")
        return jsonify([]), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)