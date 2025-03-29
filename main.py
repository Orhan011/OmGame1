import os
import re
import time
import uuid
import json
import random
import secrets
import logging
from datetime import datetime, timedelta

from flask import Flask, request, session, redirect, url_for, render_template, make_response, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

def check_achievements(user, game_type=None, score=None):
    """Kullanıcının başarılarını kontrol eder ve yeni başarılar kazanıldıysa ekler"""
    achievements = []
    
    # Toplam oyun sayısı başarıları
    total_games = user.total_games_played
    for level_idx, required_games in enumerate(ACHIEVEMENT_TYPES['GAMES_PLAYED']['levels']):
        if total_games >= required_games:
            achievement_id = f"GAMES_PLAYED_{level_idx + 1}"
            if achievement_id not in user.achievements:
                achievements.append({
                    'id': achievement_id,
                    'name': ACHIEVEMENT_TYPES['GAMES_PLAYED']['name'],
                    'description': ACHIEVEMENT_TYPES['GAMES_PLAYED']['description'].format(count=required_games),
                    'points': ACHIEVEMENT_TYPES['GAMES_PLAYED']['points'][level_idx]
                })
    
    # Yüksek skor başarıları
    if game_type and score:
        for level_idx, required_score in enumerate(ACHIEVEMENT_TYPES['HIGH_SCORE']['levels']):
            if score >= required_score:
                achievement_id = f"HIGH_SCORE_{game_type}_{level_idx + 1}"
                if achievement_id not in user.achievements:
                    achievements.append({
                        'id': achievement_id,
                        'name': ACHIEVEMENT_TYPES['HIGH_SCORE']['name'],
                        'description': ACHIEVEMENT_TYPES['HIGH_SCORE']['description'].format(
                            game=game_type, score=required_score
                        ),
                        'points': ACHIEVEMENT_TYPES['HIGH_SCORE']['points'][level_idx]
                    })
    
    # Başarıları kullanıcıya ekle
    for achievement in achievements:
        if achievement['id'] not in user.achievements:
            user.achievements.append(achievement['id'])
            user.achievement_points += achievement['points']
            
            # Başarı geçmişine ekle
            if not user.game_stats.get('achievement_history'):
                user.game_stats['achievement_history'] = []
            user.game_stats['achievement_history'].append({
                'achievement_id': achievement['id'],
                'name': achievement['name'],
                'description': achievement['description'],
                'points': achievement['points'],
                'date': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            })
    
    return achievements if achievements else None

def update_game_stats(user, game_type, score, playtime):
    """Oyun istatistiklerini günceller"""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Günlük istatistikler
    if 'daily_stats' not in user.game_stats:
        user.game_stats['daily_stats'] = {}
    if today not in user.game_stats['daily_stats']:
        user.game_stats['daily_stats'][today] = {
            'games_played': 0,
            'total_score': 0,
            'total_playtime': 0,
            'games': {}
        }
    
    daily_stats = user.game_stats['daily_stats'][today]
    daily_stats['games_played'] += 1
    daily_stats['total_score'] += score
    daily_stats['total_playtime'] += playtime
    
    if game_type not in daily_stats['games']:
        daily_stats['games'][game_type] = {
            'games_played': 0,
            'high_score': 0,
            'total_score': 0,
            'total_playtime': 0
        }
    
    game_stats = daily_stats['games'][game_type]
    game_stats['games_played'] += 1
    game_stats['total_score'] += score
    game_stats['total_playtime'] += playtime
    if score > game_stats['high_score']:
        game_stats['high_score'] = score
    
    # Favori oyunları güncelle
    if 'favorite_games' not in user.game_stats:
        user.game_stats['favorite_games'] = []
    
    favorite_games = user.game_stats['favorite_games']
    game_index = next((i for i, g in enumerate(favorite_games) if g['game_type'] == game_type), -1)
    
    if game_index == -1:
        favorite_games.append({
            'game_type': game_type,
            'games_played': 1,
            'high_score': score
        })
    else:
        favorite_games[game_index]['games_played'] += 1
        if score > favorite_games[game_index]['high_score']:
            favorite_games[game_index]['high_score'] = score
    
    # En çok oynanan oyunlara göre sırala
    favorite_games.sort(key=lambda x: x['games_played'], reverse=True)


from app import app, db
from models import User, Score, Article

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

# Email verification
def send_verification_email(to_email, verification_code):
    """
    Sends a verification email with the provided code
    
    Uses the configured Gmail account (orhanmedia0@gmail.com) to send verification emails
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    # Gmail hesap bilgileri
    sender_email = "orhanmedia0@gmail.com"
    sender_password = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not sender_password:
        logger.error("Gmail app password not found in environment variables")
        raise ValueError("Email sending failed: Missing GMAIL_APP_PASSWORD environment variable")
    
    # Email içeriği
    subject = "ZekaPark Şifre Sıfırlama Kodu"
    message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">ZekaPark Şifre Sıfırlama</h2>
            <p>Merhaba,</p>
            <p>Şifre sıfırlama talebiniz için doğrulama kodunuz aşağıdadır:</p>
            <div style="background-color: #3498db; color: white; font-size: 24px; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <strong>{verification_code}</strong>
            </div>
            <p>Bu kodu şifre sıfırlama ekranına giriniz. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">Bu otomatik bir email'dir, lütfen cevaplamayınız.</p>
        </div>
    </body>
    </html>
    """
    
    # Email oluştur
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email
    
    # HTML içeriğini ekle
    msg.attach(MIMEText(message, 'html'))
    
    try:
        # Gmail SMTP sunucusuna bağlan
        smtp_server = smtplib.SMTP('smtp.gmail.com', 587)
        smtp_server.starttls()
        
        # Giriş yap
        smtp_server.login(sender_email, sender_password)
        
        # Email'i gönder
        smtp_server.sendmail(sender_email, to_email, msg.as_string())
        
        # Bağlantıyı kapat
        smtp_server.quit()
        
        logger.info(f"Verification email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise

# Template utility function for getting current user
@app.template_filter('get_user_avatar')
def get_user_avatar(user_id):
    user = User.query.get(user_id)
    if user and user.avatar_url:
        return user.avatar_url
    return url_for('static', filename='images/default-avatar.png')

@app.context_processor
def utility_processor():
    def get_current_user():
        if 'user_id' in session:
            return User.query.get(session['user_id'])
        return None
    
    return dict(get_current_user=get_current_user)

# Database initialization function
def initialize_database():
    """Initialize the database with sample data"""
    
    # Create sample articles
    if Article.query.count() == 0:
        articles = [
            Article(
                title="ZekaPark'a Hoş Geldiniz",
                content="""
                <p>ZekaPark, beyninizi çalıştıracak ve bilişsel yeteneklerinizi geliştirecek bir platform olarak tasarlanmıştır.</p>
                <p>Burada bulacağınız mini oyunlar ve bulmacalar; hafıza, mantık, dikkat ve problem çözme yeteneklerinizi geliştirmenize yardımcı olacaktır.</p>
                <p>Yeni özellikler ve içerikler düzenli olarak eklenecektir, bizi takip etmeye devam edin!</p>
                """,
                category="article"
            ),
            Article(
                title="Beyin Egzersizlerinin Faydaları",
                content="""
                <p>Düzenli beyin egzersizleri yapmanın birçok faydası vardır:</p>
                <ul>
                    <li>Hafızanızı güçlendirir</li>
                    <li>Odaklanma yeteneğinizi artırır</li>
                    <li>Problem çözme becerilerinizi geliştirir</li>
                    <li>Yaratıcılığınızı tetikler</li>
                    <li>Yaşla birlikte oluşabilecek bilişsel gerilemeyi yavaşlatır</li>
                </ul>
                <p>ZekaPark'taki oyunları düzenli olarak oynayarak bu faydaları elde edebilirsiniz.</p>
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
                title="Kelime Bulmaca İpuçları",
                content="""
                <h3>Kelime Bulmaca oyununda başarılı olmak için ipuçları:</h3>
                <ol>
                    <li>İpucu metnini dikkatlice okuyun ve anahtar kelimelere odaklanın.</li>
                    <li>Harflerin sayısını dikkate alın ve buna göre muhtemel cevapları düşünün.</li>
                    <li>Bilemediğiniz sorularda "Pas Geç" seçeneğini kullanarak zaman kaybetmeyin.</li>
                    <li>Türkçe'de en sık kullanılan harfleri (e, a, i, n, r, s, t) düşünerek tahminlerde bulunun.</li>
                    <li>Zamanınızı akıllıca kullanın - hızlı ama dikkatlice düşünün.</li>
                </ol>
                <p>Düzenli pratik yaparak kelime haznenizi ve bulmaca çözme becerilerinizi geliştirebilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Etkili Hafıza Eşleştirme Stratejileri",
                content="""
                <h3>Hafıza Eşleştirme oyununda daha iyi performans için:</h3>
                <ul>
                    <li>Oyun başladığında, tüm kartlara kısaca göz atın ve konumlarını hafızanıza almaya çalışın.</li>
                    <li>Stratejik olarak ilerleyin - rastgele kart açmak yerine belirli bir düzen takip edin.</li>
                    <li>Açtığınız her kartın konumunu hafızanızda tutmaya çalışın.</li>
                    <li>İlk turdaki amacınız mümkün olduğunca çok kartı görüntülemek olmalıdır.</li>
                    <li>Görsel çağrışımlar yaratarak kartların konumlarını daha kolay hatırlayabilirsiniz.</li>
                </ul>
                <p>Beyin, desenler ve bağlantılar üzerinden daha kolay öğrenir. Bu stratejileri kullanarak hafıza kapasitenizi artırabilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Labirent Oyununda Başarılı Olma Taktikleri",
                content="""
                <h3>Labirent oyununda zorlanıyor musunuz? Bu taktikleri deneyin:</h3>
                <ol>
                    <li><strong>Sağ El Kuralı:</strong> Labirentte ilerlerken sürekli sağ (veya sol) duvarı takip edin.</li>
                    <li><strong>Zihinsel Harita:</strong> İlerledikçe labirentin zihinsel bir haritasını oluşturmaya çalışın.</li>
                    <li><strong>Çıkmaz Sokakları İşaretleyin:</strong> Zihinsel olarak, daha önce denediğiniz ve çıkmaz olan yolları işaretleyin.</li>
                    <li><strong>Sistematik Yaklaşın:</strong> Rastgele hareket etmek yerine, sistematik bir yaklaşım benimseyin.</li>
                    <li><strong>Sabırlı Olun:</strong> Labirent çözmek hız değil, strateji gerektirir.</li>
                </ol>
                <p>Bu taktikleri uygulayarak labirentleri daha hızlı ve etkili bir şekilde çözebilirsiniz.</p>
                """,
                category="tip"
            ),
            Article(
                title="Puzzle Oyunu İçin Etkili Stratejiler",
                content="""
                <h3>Puzzle oyununda daha başarılı olmak için ipuçları:</h3>
                <ul>
                    <li>Önce kenar ve köşe parçalarını bularak çerçeveyi oluşturun.</li>
                    <li>Parçaları renklere veya desenlere göre gruplandırın.</li>
                    <li>Bir bölümü tamamladıktan sonra diğerine geçin.</li>
                    <li>Zorlandığınız parçaları geçici olarak kenara ayırıp daha sonra tekrar deneyin.</li>
                    <li>Düzenli molalar verin - bazen uzaklaşıp sonra geri dönmek yeni perspektifler kazandırabilir.</li>
                </ul>
                <p>Puzzle çözmek, görsel-uzamsal zeka ve problem çözme becerilerinizi geliştirir.</p>
                """,
                category="tip"
            )
        ]
        
        for article in articles:
            db.session.add(article)
        
        db.session.commit()
        logger.info("Sample articles created")
    
    # Create admin user if no users exist
    if User.query.count() == 0:
        # Admin kullanıcısı
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=generate_password_hash("admin123"),
            full_name="Admin User",
            age=30,
            bio="Sistem yöneticisi",
            rank="Yönetici",
            experience_points=5000
        )
        
        # Ek test kullanıcıları
        user1 = User(
            username="mehmet",
            email="mehmet@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Mehmet Yılmaz",
            age=25,
            bio="Bilgisayar mühendisi",
            rank="İlerleyen",
            experience_points=12500
        )
        
        user2 = User(
            username="ayse",
            email="ayse@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Ayşe Demir",
            age=29,
            bio="Matematik öğretmeni",
            rank="Usta",
            experience_points=18700
        )
        
        user3 = User(
            username="emin",
            email="emin@example.com",
            password_hash=generate_password_hash("123456"),
            full_name="Emin Kaya",
            age=22,
            bio="Bilgisayar bilimi öğrencisi",
            rank="Acemi",
            experience_points=8200
        )
        
        db.session.add_all([admin, user1, user2, user3])
        db.session.commit()
        
        # Test kullanıcıları için örnek skorlar ekle
        scores = [
            # Mehmet'in skorları
            Score(user_id=2, game_type="wordPuzzle", score=1200),
            Score(user_id=2, game_type="memoryMatch", score=1800),
            Score(user_id=2, game_type="labyrinth", score=950),
            Score(user_id=2, game_type="puzzle", score=2200),
            
            # Ayşe'nin skorları
            Score(user_id=3, game_type="wordPuzzle", score=1500),
            Score(user_id=3, game_type="memoryMatch", score=2100),
            Score(user_id=3, game_type="labyrinth", score=1100),
            Score(user_id=3, game_type="puzzle", score=2500),
            
            # Emin'in skorları
            Score(user_id=4, game_type="wordPuzzle", score=900),
            Score(user_id=4, game_type="memoryMatch", score=1300),
            Score(user_id=4, game_type="labyrinth", score=700),
            Score(user_id=4, game_type="puzzle", score=1800),
        ]
        
        db.session.add_all(scores)
        db.session.commit()
        
        logger.info("Admin ve test kullanıcıları oluşturuldu")

# Init database route
@app.route('/init-db')
def init_db_route():
    initialize_database()
    return 'Database initialized'

# Routes for main pages
@app.route('/')
def index():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('index.html', user=user, current_user=user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Lütfen email ve şifrenizi girin.', 'danger')
            return redirect(url_for('login'))
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            flash('Geçersiz email veya şifre.', 'danger')
            return redirect(url_for('login'))
        
        session['user_id'] = user.id
        flash('Başarıyla giriş yaptınız!', 'success')
        return redirect(url_for('index'))
    
    if session.get('user_id'):
        return redirect(url_for('index'))
        
    return render_template('login.html')

@app.route('/profile')
def profile():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    current_user = User.query.get(session['user_id'])
    if not current_user:
        session.pop('user_id', None)
        return redirect(url_for('login'))
    
    try:
        # Kullanıcının en yüksek skorlarını bul
        word_puzzle_score = Score.query.filter_by(user_id=current_user.id, game_type='wordPuzzle').order_by(Score.score.desc()).first()
        memory_match_score = Score.query.filter_by(user_id=current_user.id, game_type='memoryMatch').order_by(Score.score.desc()).first()
        labyrinth_score = Score.query.filter_by(user_id=current_user.id, game_type='labyrinth').order_by(Score.score.desc()).first()
        puzzle_score = Score.query.filter_by(user_id=current_user.id, game_type='puzzle').order_by(Score.score.desc()).first()
        
        user_scores = {
            'wordPuzzle': word_puzzle_score.score if word_puzzle_score else 0,
            'memoryMatch': memory_match_score.score if memory_match_score else 0,
            'labyrinth': labyrinth_score.score if labyrinth_score else 0,
            'puzzle': puzzle_score.score if puzzle_score else 0
        }
        
        # Kullanıcı bilgilerini güncel tut
        if not current_user.experience_points:
            current_user.experience_points = 0
        if not current_user.rank:
            current_user.rank = 'Başlangıç'
        if not current_user.total_games_played:
            current_user.total_games_played = 0
        db.session.commit()
        
        return render_template('profile.html', current_user=current_user, user=current_user, user_scores=user_scores)
        
    except Exception as e:
        logger.error(f"Error in profile page: {e}")
        db.session.rollback()
        flash('Profil bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
        return redirect(url_for('index'))

# Game routes
@app.route('/games/word-puzzle')
def word_puzzle():
    return render_template('games/wordPuzzle.html')

@app.route('/games/memory-match')
def memory_match():
    return render_template('games/memoryMatch.html')

@app.route('/games/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

@app.route('/games/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

# Leaderboard
@app.route('/leaderboard')
def leaderboard():
    word_puzzle_scores = Score.query.filter_by(game_type='wordPuzzle').order_by(Score.score.desc()).limit(10).all()
    memory_match_scores = Score.query.filter_by(game_type='memoryMatch').order_by(Score.score.desc()).limit(10).all()
    labyrinth_scores = Score.query.filter_by(game_type='labyrinth').order_by(Score.score.desc()).limit(10).all()
    puzzle_scores = Score.query.filter_by(game_type='puzzle').order_by(Score.score.desc()).limit(10).all()
    
    return render_template('leaderboard.html', 
                          word_puzzle_scores=word_puzzle_scores,
                          memory_match_scores=memory_match_scores,
                          number_sequence_scores=labyrinth_scores, # Labirent oyunu skorları
                          pattern_recognition_scores=puzzle_scores)

# Articles
@app.route('/articles')
def articles():
    articles = Article.query.filter_by(category='article').all()
    return render_template('articles.html', articles=articles)

# Tips
@app.route('/tips')
def tips():
    tips = Article.query.filter_by(category='tip').all()
    return render_template('tips.html', tips=tips)

# User management routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not username or not email or not password:
            flash('Tüm alanları doldurunuz.')
            return redirect(url_for('register'))
            
        # Email validation
        if not '@' in email or not '.' in email:
            flash('Geçerli bir email adresi giriniz.')
            return redirect(url_for('register'))
            
        email_domain = email.split('@')[1]
        valid_domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com']
        if email_domain not in valid_domains:
            flash('Lütfen geçerli bir email servis sağlayıcısı kullanın (Gmail, Hotmail, Yahoo, Outlook).')
            return redirect(url_for('register'))
            
        if User.query.filter_by(username=username).first():
            flash('Bu kullanıcı adı zaten kullanılıyor.')
            return redirect(url_for('register'))
            
        if User.query.filter_by(email=email).first():
            flash('Bu email adresi zaten kullanılıyor.')
            return redirect(url_for('register'))
        
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        try:
            db.session.add(new_user)
            db.session.commit()
            
            session['user_id'] = new_user.id
            session['username'] = new_user.username
            flash('Kayıt başarılı! Hoş geldiniz!')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            flash('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.')
            return redirect(url_for('register'))
    
    if session.get('user_id'):
        return redirect(url_for('index'))
        
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Başarıyla çıkış yaptınız.')
    return redirect(url_for('login'))

# Profile management routes
@app.route('/profile/update', methods=['POST'])
def update_profile():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    
    # Get form data
    email = request.form.get('email')
    full_name = request.form.get('full_name')
    age = request.form.get('age')
    location = request.form.get('location')
    bio = request.form.get('bio')
    
    # Update user information
    if email and email != user.email:
        # Check if email already exists
        if User.query.filter_by(email=email).first() and User.query.filter_by(email=email).first().id != user.id:
            flash('Bu email adresi zaten kullanılıyor.', 'danger')
            return redirect(url_for('profile'))
        user.email = email
    
    if full_name is not None:
        user.full_name = full_name
    
    if age is not None and age != '':
        try:
            user.age = int(age)
        except ValueError:
            pass
        
    if location is not None:
        user.location = location
        
    if bio is not None:
        user.bio = bio
    
    try:
        db.session.commit()
        flash('Profil bilgileriniz başarıyla güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {e}")
        flash('Profil güncellenirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('profile'))

@app.route('/profile/password', methods=['POST'])
def update_password():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Validate inputs
    if not current_password or not new_password or not confirm_password:
        flash('Tüm şifre alanlarını doldurunuz.', 'danger')
        return redirect(url_for('profile'))
    
    # Check if current password is correct
    if not check_password_hash(user.password_hash, current_password):
        flash('Mevcut şifreniz hatalı.', 'danger')
        return redirect(url_for('profile'))
    
    # Check if new passwords match
    if new_password != confirm_password:
        flash('Yeni şifreler eşleşmiyor.', 'danger')
        return redirect(url_for('profile'))
    
    # Update password
    user.password_hash = generate_password_hash(new_password)
    
    try:
        db.session.commit()
        flash('Şifreniz başarıyla güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating password: {e}")
        flash('Şifre güncellenirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('profile'))

@app.route('/profile/theme', methods=['POST'])
def update_theme():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    theme_preference = request.form.get('theme_preference')
    
    # Update user's theme preference
    if theme_preference in ['dark', 'light', 'contrast']:
        user.theme_preference = theme_preference
    
    try:
        db.session.commit()
        flash('Tema ayarlarınız başarıyla güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating theme: {e}")
        flash('Tema ayarları güncellenirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('profile'))

@app.route('/profile/notifications', methods=['POST'])
def update_notifications():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    email_notifications = 'email_notifications' in request.form
    push_notifications = 'push_notifications' in request.form
    
    # Update notification settings
    user.notification_settings = {
        'email': email_notifications,
        'push': push_notifications
    }
    
    try:
        db.session.commit()
        flash('Bildirim ayarlarınız başarıyla güncellendi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating notifications: {e}")
        flash('Bildirim ayarları güncellenirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('profile'))

@app.route('/profile/deactivate', methods=['POST'])
def deactivate_account():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    
    user.account_status = 'deactivated'
    
    try:
        db.session.commit()
        session.pop('user_id', None)
        flash('Hesabınız başarıyla devre dışı bırakıldı.', 'success')
        return redirect(url_for('login'))
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deactivating account: {e}")
        flash('Hesap devre dışı bırakılırken bir hata oluştu.', 'danger')
        return redirect(url_for('profile'))

@app.route('/profile/delete', methods=['POST'])
def delete_account():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user_id = session.get('user_id')
    
    try:
        # Delete user's scores
        Score.query.filter_by(user_id=user_id).delete()
        
        # Delete the user
        User.query.filter_by(id=user_id).delete()
        
        db.session.commit()
        session.clear()
        flash('Hesabınız kalıcı olarak silindi.', 'success')
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting account: {e}")
        flash('Hesap silinirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('login'))

@app.route('/profile/avatar/update', methods=['POST'])
def update_avatar():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    
    # Check if user selected a preset avatar
    selected_avatar = request.form.get('selected_avatar')
    if selected_avatar:
        user.avatar_url = url_for('static', filename=f'images/avatars/{selected_avatar}')
        try:
            db.session.commit()
            flash('Profil fotoğrafınız başarıyla güncellendi.', 'success')
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating avatar: {e}")
            flash('Profil fotoğrafı güncellenirken bir hata oluştu.', 'danger')
        return redirect(url_for('profile'))
    
    # Check if user uploaded a file
    if 'avatar' not in request.files:
        flash('Dosya seçilmedi.', 'danger')
        return redirect(url_for('profile'))
    
    file = request.files['avatar']
    
    if file.filename == '':
        flash('Dosya seçilmedi.', 'danger')
        return redirect(url_for('profile'))
    
    if file:
        # Generate a secure filename
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        # Save to avatars directory
        file_path = os.path.join('static', 'images', 'avatars', filename)
        try:
            file.save(file_path)
            user.avatar_url = url_for('static', filename=f'images/avatars/{filename}')
            db.session.commit()
            flash('Profil fotoğrafınız başarıyla yüklendi.', 'success')
        except Exception as e:
            logger.error(f"Error saving avatar: {e}")
            flash('Profil fotoğrafı yüklenirken bir hata oluştu.', 'danger')
    
    return redirect(url_for('profile'))

# Password reset routes
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('Bu email adresi ile kayıtlı bir kullanıcı bulunamadı.', 'danger')
            return redirect(url_for('forgot_password'))
        
        # Generate a random 6-digit verification code
        verification_code = ''.join(random.choices('0123456789', k=6))
        token_expiry = datetime.utcnow() + timedelta(minutes=30)  # Token valid for 30 minutes
        
        # Save the verification code and expiry in the user's record
        user.reset_token = verification_code
        user.reset_token_expiry = token_expiry
        db.session.commit()
        
        # Try to send the verification code via email
        # For security purposes, we don't reveal if email exists or not
        try:
            # Even if we can't send email, show success message but log the code for testing
            logger.info(f"Password reset code for {email}: {verification_code}")
            
            # Try to send email
            send_verification_email(email, verification_code)
            
            # Always show success message to prevent email enumeration attacks
            flash('Doğrulama kodu email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')
            
            # In development mode, also show the code on screen
            if app.debug:
                flash(f'TEST MODU - Doğrulama kodunuz: {verification_code}', 'info')
        except Exception as e:
            # Still log the error but don't tell the user
            logger.error(f"Error sending email: {e}")
            
            # Show success message anyway for security
            flash('Doğrulama kodu email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.', 'success')
            
            # In development mode, show code and error
            if app.debug:
                flash(f'TEST MODU - Doğrulama kodunuz: {verification_code}', 'info')
                flash(f'E-posta gönderme hatası (yalnızca geliştirme): {str(e)}', 'warning')
        
        # Redirect to the verification code page
        return redirect(url_for('reset_code', email=email))
    
    email = request.args.get('email', '')
    return render_template('forgot_password.html', email=email)

@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    email = request.args.get('email', '')
    if not email and request.method == 'POST':
        email = request.form.get('email', '')
    
    if not email:
        flash('Email adresi belirtilmedi.', 'danger')
        return redirect(url_for('forgot_password'))
    
    if request.method == 'POST':
        # Debug: log form data
        logger.debug(f"Reset code form data: {request.form}")
        
        # İki farklı form parametresi kontrolü
        verification_code = request.form.get('verification_code', '')
        
        if not verification_code:
            # Try to get individual digits and combine them
            code_parts = []
            for i in range(1, 7):
                digit = request.form.get(f'code{i}', '')
                if not digit:
                    break
                code_parts.append(digit)
            
            if len(code_parts) == 6:
                verification_code = ''.join(code_parts)
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('Geçersiz email adresi.', 'danger')
            return redirect(url_for('forgot_password'))
        
        # Debug: log verification details
        logger.debug(f"Verification attempt: code={verification_code}, user_token={user.reset_token}")
        
        if not user.reset_token or user.reset_token != verification_code:
            flash('Geçersiz doğrulama kodu.', 'danger')
            return render_template('reset_code.html', email=email)
        
        if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
            flash('Doğrulama kodunun süresi doldu. Lütfen yeni bir kod talep edin.', 'danger')
            return redirect(url_for('forgot_password'))
        
        try:
            # Generate a secure token for the password reset page
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = reset_token
            user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)  # Token valid for 15 minutes
            db.session.commit()
            
            return redirect(url_for('reset_password', email=email, token=reset_token))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error generating reset token: {e}")
            flash('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
            return redirect(url_for('forgot_password'))
    
    return render_template('reset_code.html', email=email)

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email', '')
    token = request.args.get('token', '')
    
    if request.method == 'POST':
        email = request.form.get('email', '')
        token = request.form.get('token', '')
        
        # Debug: Print form data
        logger.debug(f"Reset password form data: {request.form}")
    
    if not email or not token:
        flash('Geçersiz istek. Email veya token eksik.', 'danger')
        logger.error(f"Invalid reset request: email={email}, token={token}")
        return redirect(url_for('login'))
    
    user = User.query.filter_by(email=email, reset_token=token).first()
    
    if not user:
        flash('Geçersiz link. Lütfen şifre sıfırlama sürecini tekrar başlatın.', 'danger')
        logger.error(f"User not found for reset: email={email}, token={token}")
        return redirect(url_for('forgot_password'))
    
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        flash('Şifre sıfırlama linkinin süresi doldu. Lütfen tekrar deneyin.', 'danger')
        logger.error(f"Token expired for user: {user.email}")
        return redirect(url_for('forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not password or len(password) < 6:
            flash('Şifre en az 6 karakter uzunluğunda olmalıdır.', 'danger')
            return render_template('reset_password.html', email=email, token=token)
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor.', 'danger')
            return render_template('reset_password.html', email=email, token=token)
        
        try:
            # Update password
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            
            flash('Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating password: {e}")
            flash('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
    
    return render_template('reset_password.html', email=email, token=token)

# API routes for game scores
@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({
            'success': False, 
            'message': 'Login required',
            'score': data.get('score', 0)
        })
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'})
    
    game_type = data['gameType']
    score = data['score']
    playtime = data.get('playtime', 0)  # Oyun süresi (saniye)
    
    # İstatistikleri güncelle
    update_game_stats(user, game_type, score, playtime)
    
    # Başarıları kontrol et
    new_achievements = check_achievements(user, game_type, score)
    
    # Skoru kaydet
    existing_score = Score.query.filter_by(
        user_id=user_id,
        game_type=game_type
    ).order_by(Score.score.desc()).first()
    
    is_high_score = False
    if existing_score:
        if score > existing_score.score:
            existing_score.score = score
            existing_score.timestamp = datetime.utcnow()
            is_high_score = True
    else:
        new_score = Score(
            user_id=user_id,
            game_type=game_type,
            score=score
        )
        db.session.add(new_score)
        is_high_score = True
    
    # XP ve seviye hesaplamaları
    original_level = user.experience_points // 1000 + 1
    xp_gain = min(score // 10, 100)
    
    if is_high_score:
        xp_gain += 20
    if new_achievements:
        xp_gain += sum(achievement['points'] for achievement in new_achievements)
    
    user.experience_points += xp_gain
    user.total_games_played += 1
    
    if score > user.highest_score:
        user.highest_score = score
    
    # Seviye kontrolü
    new_level = user.experience_points // 1000 + 1
    
    # Rank güncelleme
    if new_level <= 5:
        user.rank = 'Başlangıç'
    elif new_level <= 10:
        user.rank = 'Acemi'
    elif new_level <= 15:
        user.rank = 'İlerleyen'
    elif new_level <= 20:
        user.rank = 'Usta'
    elif new_level <= 30:
        user.rank = 'Uzman'
    else:
        user.rank = 'Efsane'
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    
    return jsonify({
        'success': True,
        'xp_gained': xp_gain,
        'new_total_xp': user.experience_points,
        'level': new_level,
        'is_level_up': new_level > original_level,
        'is_high_score': is_high_score,
        'rank': user.rank,
        'new_achievements': new_achievements
    })
    
    # Kullanıcı bilgilerini getir
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'})
    
    # XP ve seviye hesaplamaları için değerler
    original_level = user.experience_points // 1000 + 1
    xp_gain = min(data['score'] // 10, 100)  # Her 10 puan 1 XP, maksimum 100 XP
    
    is_high_score = False
    
    # Önce mevcut skoru kontrol et
    existing_score = Score.query.filter_by(
        user_id=user_id,
        game_type=data['gameType']
    ).first()
    
    if existing_score:
        # Eğer yeni skor daha yüksekse, mevcut skoru güncelle
        if data['score'] > existing_score.score:
            existing_score.score = data['score']
            existing_score.timestamp = datetime.utcnow()  # Ayrıca zaman damgasını da güncelle
            
            # Yeni rekor kırdığı için ekstra XP
            xp_gain += 20
            is_high_score = True
            
            # En yüksek skor güncelleme
            if data['score'] > user.highest_score:
                user.highest_score = data['score']
        else:
            # Yeni skor daha düşükse, XP kazancını azalt ama yine de ver
            xp_gain = xp_gain // 2
    else:
        # İlk kez oynuyorsa yeni skor kaydı oluştur
        new_score = Score(
            user_id=user_id,
            game_type=data['gameType'],
            score=data['score']
        )
        
        db.session.add(new_score)
        
        # İlk defa oynamak için bonus XP
        xp_gain += 10
        
        # En yüksek skor güncelleme
        if data['score'] > user.highest_score:
            user.highest_score = data['score']
    
    # XP ekle
    user.experience_points += xp_gain
    
    # Toplam oyun sayısını artır
    user.total_games_played += 1
    
    # Seviye yükseldi mi kontrol et
    new_level = user.experience_points // 1000 + 1
    
    # Rank güncelleme
    if new_level <= 5:
        user.rank = 'Başlangıç'
    elif new_level <= 10:
        user.rank = 'Acemi'
    elif new_level <= 15:
        user.rank = 'İlerleyen'
    elif new_level <= 20:
        user.rank = 'Usta'
    elif new_level <= 30:
        user.rank = 'Uzman'
    else:
        user.rank = 'Efsane'
    
    db.session.commit()
    
    # Kullanıcıya dönecek bilgileri hazırla
    response_data = {
        'success': True,
        'xp_gained': xp_gain,
        'new_total_xp': user.experience_points,
        'level': new_level,
        'is_level_up': new_level > original_level,
        'is_high_score': is_high_score,
        'rank': user.rank
    }
    
    return jsonify(response_data)

@app.route('/api/get-scores/<game_type>')
def get_scores(game_type):
    from sqlalchemy import func
    
    # "all" özelliği eklenmiş - tüm oyunların verilerini getir
    if game_type == 'all':
        # Tüm oyun türleri için en yüksek skorları getir
        game_types = ['wordPuzzle', 'memoryMatch', 'labyrinth', 'puzzle']
        all_scores = {}
        
        for internal_game_type in game_types:
            # Her oyun türü için kullanıcı başına en yüksek puanları bul
            max_scores_subquery = db.session.query(
                Score.user_id, 
                func.max(Score.score).label('max_score')
            ).filter_by(
                game_type=internal_game_type
            ).group_by(
                Score.user_id
            ).subquery()
            
            # Tam skor kayıtlarını ve kullanıcı bilgilerini getir
            scores = db.session.query(Score, User).join(
                max_scores_subquery, 
                db.and_(
                    Score.user_id == max_scores_subquery.c.user_id,
                    Score.score == max_scores_subquery.c.max_score,
                    Score.game_type == internal_game_type
                )
            ).join(
                User, 
                User.id == Score.user_id
            ).order_by(
                Score.score.desc()
            ).limit(10).all()
            
            # Skor listesini oyun türüne göre oluştur
            score_list = []
            for score, user in scores:
                score_list.append({
                    'username': user.username if user else 'Anonymous',
                    'score': score.score,
                    'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'game_type': internal_game_type
                })
            
            # Her oyun türü için skorları ekle
            all_scores[internal_game_type] = score_list
        
        return jsonify(all_scores)
    else:
        # Belirli bir oyun türü için skorları getir
        game_type_map = {
            'word-puzzle': 'wordPuzzle',
            'memory-match': 'memoryMatch',
            'labyrinth': 'labyrinth',
            'number-sequence': 'labyrinth',  # number-sequence de labyrinth'e yönlendiriliyor (geriye uyumluluk için)
            'puzzle': 'puzzle'
        }
        
        internal_game_type = game_type_map.get(game_type)
        if not internal_game_type:
            return jsonify({'error': 'Invalid game type'}), 400
            
        # Kullanıcı başına en yüksek skorları içeren bir sorgu oluştur
        # SQLAlchemy ile subquery kullanarak her kullanıcı için en yüksek puanı alalım
        
        # Önce her kullanıcı için maksimum skoru bulalım
        max_scores_subquery = db.session.query(
            Score.user_id, 
            func.max(Score.score).label('max_score')
        ).filter_by(
            game_type=internal_game_type
        ).group_by(
            Score.user_id
        ).subquery()
        
        # Sonra tam skor kayıtlarını ve kullanıcı bilgilerini alalım
        scores = db.session.query(Score, User).join(
            max_scores_subquery, 
            db.and_(
                Score.user_id == max_scores_subquery.c.user_id,
                Score.score == max_scores_subquery.c.max_score,
                Score.game_type == internal_game_type
            )
        ).join(
            User, 
            User.id == Score.user_id
        ).order_by(
            Score.score.desc()
        ).limit(10).all()
        
        # Skor listesini hazırla
        score_list = []
        for score, user in scores:
            score_list.append({
                'username': user.username if user else 'Anonymous',
                'score': score.score,
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'rank': user.rank
            })
        
        return jsonify(score_list)

@app.route('/get_scores/<game_type>')  # Profil sayfası için eklenen alternatif endpoint
def get_scores_alt(game_type):
    return get_scores(game_type)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)