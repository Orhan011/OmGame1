import os
import re
import random
import string
import smtplib
import json
import logging
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_from_directory
from models import db, User, Score, Article, UserHomeScreen

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///brain_games.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)

# Upload folder configuration
UPLOAD_FOLDER = 'static/uploads/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Make sure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Utility functions
def allowed_file(filename):
    """Dosya uzantısının izin verilen uzantılardan olup olmadığını kontrol eder."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def send_verification_email(to_email, verification_code):
    """Verification email sending function"""
    try:
        subject = "Beyin Egzersizleri - E-posta Doğrulama Kodu"
        body = f"Doğrulama kodunuz: {verification_code}"
        
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = 'omgameee@gmail.com'
        msg['To'] = to_email
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('omgameee@gmail.com', 'apppassword')  # Use app password
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"E-posta gönderme hatası: {e}")
        return False

def calculate_level(xp):
    """Toplam XP'ye göre kullanıcı seviyesini hesaplar."""
    return int(1 + 0.1 * (xp ** 0.5))

def xp_for_level(level):
    """Belirli bir seviyeye ulaşmak için gereken toplam XP değerini hesaplar."""
    return (level - 1) ** 2 * 100

def get_user_avatar(user_id):
    """
    Kullanıcının profil fotoğrafının URL'sini döndürür.
    Profil fotoğrafı yoksa varsayılan avatar URL'sini döndürür.
    """
    user = User.query.get(user_id)
    if user and user.avatar_url:
        return user.avatar_url
    return 'img/default-avatar.png'

def get_game_info():
    """Tüm oyunların bilgilerini listeler"""
    games = [
        {
            "id": "word_puzzle",
            "name": "Kelime Bulmaca",
            "description": "Kelimeleri bul, sözcük hazineni genişlet.",
            "icon": "fas fa-font",
            "url": url_for('word_puzzle')
        },
        {
            "id": "memory_cards",
            "name": "Hafıza Kartları",
            "description": "Eşleşen kartları bul ve hafızanı test et.",
            "icon": "fas fa-clone",
            "url": url_for('memory_cards')
        },
        {
            "id": "labyrinth",
            "name": "Labirent",
            "description": "Çıkış yolunu bul ve stratejik düşün.",
            "icon": "fas fa-route",
            "url": url_for('labyrinth')
        },
        {
            "id": "puzzle",
            "name": "Yapboz",
            "description": "Parçaları birleştir ve görsel zekânı geliştir.",
            "icon": "fas fa-puzzle-piece",
            "url": url_for('puzzle')
        },
        {
            "id": "number_sequence",
            "name": "Sayı Dizisi",
            "description": "Sayı örüntülerini keşfet ve analitik düşün.",
            "icon": "fas fa-sort-numeric-up",
            "url": url_for('number_sequence')
        },
        {
            "id": "number_chain",
            "name": "Sayı Zinciri",
            "description": "Gördüğün sayıları doğru sırayla hatırla.",
            "icon": "fas fa-link",
            "url": url_for('number_chain')
        },
        {
            "id": "audio_memory",
            "name": "Sesli Hafıza",
            "description": "Duyduğun ses sıralamasını doğru tekrarla.",
            "icon": "fas fa-volume-up",
            "url": url_for('audio_memory')
        },
        {
            "id": "n_back",
            "name": "N-Back Test",
            "description": "Çalışma belleğini ve odaklanma gücünü test et.",
            "icon": "fas fa-brain",
            "url": url_for('n_back')
        },
        {
            "id": "chess",
            "name": "Satranç",
            "description": "Stratejik düşünme ve planlama becerilerinizi geliştirin.",
            "icon": "fas fa-chess",
            "url": url_for('chess')
        },
        {
            "id": "sudoku",
            "name": "Sudoku",
            "description": "Her satır, sütun ve bölgede 1-9 arası rakamları yerleştirerek mantık gücünüzü geliştirin.",
            "icon": "fas fa-th",
            "url": url_for('sudoku')
        },
        {
            "id": "three_d_rotation",
            "name": "3D Döndürme",
            "description": "3D şekilleri doğru açılarla döndürerek uzamsal algı yeteneklerinizi geliştirin.",
            "icon": "fas fa-cube",
            "url": url_for('three_d_rotation')
        },
        {
            "id": "game_2048",
            "name": "2048",
            "description": "Sayıları birleştirerek 2048'e ulaşın.",
            "icon": "fas fa-calculator",
            "url": url_for('game_2048')
        },
        {
            "id": "wordle",
            "name": "Kelime Tahmin",
            "description": "Gizli kelimeyi 6 denemede bulmaya çalışın.",
            "icon": "fas fa-spell-check",
            "url": url_for('wordle')
        }
    ]
    return games

def get_user_home_games(user_id):
    """
    Kullanıcının ana sayfasına eklediği oyunları getirir.
    Eğer oyun eklemediyse varsayılan olarak ilk 4 oyunu döndürür.
    """
    if not user_id:
        return []
        
    # Kullanıcının ana sayfasına eklediği oyunları getir
    home_games = UserHomeScreen.query.filter_by(user_id=user_id).order_by(UserHomeScreen.display_order).all()
    
    # Eğer oyun eklemediyse varsayılan olarak ilk 4 oyunu göster
    if not home_games:
        # İlk kez ana sayfa özelleştirmesi yapıyorsa, varsayılan oyunları ekle
        default_games = ["word_puzzle", "memory_cards", "labyrinth", "puzzle"]
        for i, game_id in enumerate(default_games):
            home_game = UserHomeScreen(
                user_id=user_id,
                game_type=game_id,
                display_order=i
            )
            db.session.add(home_game)
        db.session.commit()
        
        # Yeni eklenen oyunları getir
        home_games = UserHomeScreen.query.filter_by(user_id=user_id).order_by(UserHomeScreen.display_order).all()
    
    # Oyun bilgilerini getir
    game_info = get_game_info()
    user_home_games = []
    
    for home_game in home_games:
        for game in game_info:
            if game["id"] == home_game.game_type:
                user_home_games.append(game)
                break
    
    return user_home_games

# Flask template utility functions
@app.context_processor
def utility_processor():
    def get_current_user():
        """Session'daki kullanıcı ID'sini kullanarak kullanıcı verisini getirir"""
        user_id = session.get('user_id')
        if user_id:
            return User.query.get(user_id)
        return None

    def get_user_data():
        """Session'daki kullanıcı bilgilerini döndürür"""
        user = get_current_user()
        if user:
            current_level = calculate_level(user.experience_points)
            next_level = current_level + 1
            current_level_xp = xp_for_level(current_level)
            next_level_xp = xp_for_level(next_level)
            xp_progress = (user.experience_points - current_level_xp) / (next_level_xp - current_level_xp) * 100 if next_level_xp > current_level_xp else 0
            
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'avatar_url': user.avatar_url,
                'age': user.age,
                'bio': user.bio,
                'location': user.location,
                'rank': user.rank,
                'experience_points': user.experience_points,
                'level': current_level,
                'xp_progress': xp_progress,
                'next_level_xp': next_level_xp,
                'current_level_xp': current_level_xp,
                'total_games_played': user.total_games_played,
                'highest_score': user.highest_score,
                'theme_preference': user.theme_preference,
                'account_status': user.account_status,
                'email_notifications': user.email_notifications,
                'achievement_notifications': user.achievement_notifications,
                'leaderboard_notifications': user.leaderboard_notifications,
            }
        return None

    def get_avatar_url():
        """Kullanıcının avatar URL'sini döndürür"""
        user = get_current_user()
        if user and user.avatar_url:
            return user.avatar_url
        return None
    
    def get_user_scores():
        """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
        user_id = session.get('user_id')
        if not user_id:
            return {}
            
        result = {}
        scores = Score.query.filter_by(user_id=user_id).all()
        
        for score in scores:
            game_type = score.game_type
            if game_type not in result or score.score > result[game_type]:
                result[game_type] = score.score
                
        return result

    return dict(
        get_current_user=get_current_user,
        get_user_data=get_user_data,
        get_avatar_url=get_avatar_url,
        get_user_scores=get_user_scores
    )

# Database initialization
def initialize_database():
    """Initialize the database with sample data if needed"""
    with app.app_context():
        db.create_all()
        
        # Example data can be added here when needed
        if not User.query.first():
            # Admin user
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=generate_password_hash("admin123"),
                full_name="Admin User",
                rank="Yönetici",
                experience_points=1000
            )
            db.session.add(admin)
            db.session.commit()

# Initialize the database when the app starts
with app.app_context():
    initialize_database()

# Manual database initialization route (for development only)
@app.route('/init-db')
def init_db_route():
    initialize_database()
    return "Database initialized"

# Route handlers
@app.route('/')
def index():
    user_id = session.get('user_id')
    user_home_games = get_user_home_games(user_id)
    return render_template('index.html', user_home_games=user_home_games)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            
            # Update last active time
            user.last_active = datetime.utcnow()
            db.session.commit()
            
            flash('Başarıyla giriş yaptınız!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Geçersiz kullanıcı adı veya şifre!', 'danger')
    
    return render_template('login.html')

@app.route('/three-d-rotation')
def three_d_rotation():
    return render_template('games/three-d-rotation.html')

@app.route('/word-puzzle')
def word_puzzle():
    return render_template('games/word-puzzle.html')

@app.route('/memory-match')
def memory_match():
    return render_template('games/memory-match.html')

@app.route('/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

@app.route('/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

@app.route('/number-sequence')
def number_sequence():
    return render_template('games/number-sequence.html')

@app.route('/memory-cards')
def memory_cards():
    return render_template('games/memory-cards.html')

@app.route('/number-chain')
def number_chain():
    return render_template('games/number-chain.html')

@app.route('/audio-memory')
def audio_memory():
    """Sesli Hafıza: Melodi oyunu
    İşitsel hafızayı geliştirmek için tasarlanmış interaktif bir oyun.
    Doğa sesleri, enstrümanlar veya diğer sesler ile hafıza egzersizi."""
    return render_template('games/audio-memory.html')

@app.route('/n-back')
def n_back():
    return render_template('games/n-back.html')

@app.route('/sudoku')
def sudoku():
    return render_template('games/sudoku.html')

@app.route('/2048')
def game_2048():
    return render_template('games/2048.html')

@app.route('/wordle')
def wordle():
    """Wordle kelime tahmin oyunu"""
    return render_template('games/wordle.html')

@app.route('/chess')
def chess():
    """Satranç oyunu"""
    return render_template('games/chess.html')

@app.route('/all-games')
def all_games():
    """Tüm oyunlar sayfası"""
    games = get_game_info()
    user_id = session.get('user_id')
    
    # Kullanıcının ana sayfasındaki oyunları al
    user_home_game_types = []
    if user_id:
        home_games = UserHomeScreen.query.filter_by(user_id=user_id).all()
        user_home_game_types = [game.game_type for game in home_games]
    
    return render_template('all_games.html', 
                          games=games, 
                          user_home_games=user_home_game_types)

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/articles')
def articles():
    articles = Article.query.filter_by(category='article').all()
    return render_template('articles.html', articles=articles)

@app.route('/tips')
def tips():
    tips = Article.query.filter_by(category='tip').all()
    return render_template('tips.html', tips=tips)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor!', 'danger')
            return render_template('register.html')
        
        # Check if username exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Bu kullanıcı adı zaten kullanılıyor!', 'danger')
            return render_template('register.html')
            
        # Check if email exists
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            flash('Bu e-posta adresi zaten kullanılıyor!', 'danger')
            return render_template('register.html')
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log the user in
        session['user_id'] = new_user.id
        session['username'] = new_user.username
        
        flash('Hesabınız başarıyla oluşturuldu!', 'success')
        return redirect(url_for('index'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('Başarıyla çıkış yaptınız!', 'success')
    return redirect(url_for('index'))

def get_user_scores():
    """Kullanıcının oyun skorlarını bir sözlük olarak döndürür."""
    user_id = session.get('user_id')
    if not user_id:
        return {}
        
    result = {}
    scores = Score.query.filter_by(user_id=user_id).all()
    
    for score in scores:
        game_type = score.game_type
        if game_type not in result or score.score > result[game_type]:
            result[game_type] = score.score
            
    return result

@app.route('/profile')
def profile():
    """Mevcut profil sayfası."""
    if 'user_id' not in session:
        flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    scores = get_user_scores()
    
    return render_template('profile.html', user=user, scores=scores)

@app.route('/profile-v2')
def profile_v2():
    """Yeni tasarımlı profil sayfası."""
    if 'user_id' not in session:
        flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    scores = get_user_scores()
    
    # Level ve XP hesapla
    current_level = calculate_level(user.experience_points)
    next_level = current_level + 1
    current_level_xp = xp_for_level(current_level)
    next_level_xp = xp_for_level(next_level)
    xp_progress = (user.experience_points - current_level_xp) / (next_level_xp - current_level_xp) * 100 if next_level_xp > current_level_xp else 0
    
    return render_template('profile_v2.html', 
                           user=user, 
                           scores=scores, 
                           current_level=current_level,
                           next_level=next_level,
                           current_level_xp=current_level_xp,
                           next_level_xp=next_level_xp,
                           xp_progress=xp_progress)

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """Profil bilgilerini güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Form verilerini al ve güncelle
    user.full_name = request.form.get('full_name', user.full_name)
    user.bio = request.form.get('bio', user.bio)
    user.location = request.form.get('location', user.location)
    
    # Yaş alanını integer olarak dönüştür
    age = request.form.get('age')
    if age and age.isdigit():
        user.age = int(age)
    
    db.session.commit()
    flash('Profil bilgileriniz güncellendi!', 'success')
    return jsonify({'success': True})

@app.route('/update-avatar', methods=['POST'])
def update_avatar():
    """Profil fotoğrafını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Dosya kontrolü
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'error': 'Dosya yüklenemedi!'})
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Dosya seçilmedi!'})
    
    if file and allowed_file(file.filename):
        # Dosya adını güvenli hale getir ve kullanıcı ID'si ile kaydet
        filename = secure_filename(file.filename)
        user_filename = f"{user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], user_filename)
        
        # Dosyayı kaydet
        file.save(filepath)
        
        # Kullanıcı kaydını güncelle
        user.avatar_url = f"uploads/avatars/{user_filename}"
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'avatar_url': url_for('static', filename=f"uploads/avatars/{user_filename}")
        })
    
    return jsonify({'success': False, 'error': 'Geçersiz dosya formatı!'})

@app.route('/change-password', methods=['POST'])
def change_password():
    """Şifre değiştirme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    # Mevcut şifreyi kontrol et
    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'success': False, 'error': 'Mevcut şifre yanlış!'})
    
    # Yeni şifre ve onay şifresinin eşleştiğini kontrol et
    if new_password != confirm_password:
        return jsonify({'success': False, 'error': 'Yeni şifreler eşleşmiyor!'})
    
    # Şifreyi güncelle
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Şifreniz başarıyla güncellendi!'})

@app.route('/update-security-settings', methods=['POST'])
def update_security_settings():
    """Güvenlik ayarlarını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # İki faktörlü doğrulama ayarını güncelle
    # Şimdilik sadece şifre güncellemesine izin ver
    
    return jsonify({'success': True, 'message': 'Güvenlik ayarlarınız güncellendi!'})

@app.route('/update-notification-settings', methods=['POST'])
def update_notification_settings():
    """Bildirim ayarlarını güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Bildirim ayarlarını güncelle
    user.email_notifications = 'email_notifications' in request.form
    user.achievement_notifications = 'achievement_notifications' in request.form
    user.leaderboard_notifications = 'leaderboard_notifications' in request.form
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Bildirim ayarlarınız güncellendi!'})

@app.route('/update-theme', methods=['POST'])
def update_theme():
    """Tema tercihini güncelleme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Tema tercihini güncelle
    theme = request.form.get('theme', 'dark')
    user.theme_preference = theme
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Tema tercihiniz güncellendi!'})

@app.route('/delete-account', methods=['POST'])
def delete_account():
    """Hesabı silme."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Kullanıcının şifresini kontrol et
    password = request.form.get('password')
    if not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'error': 'Geçersiz şifre!'})
    
    # Kullanıcıyı veritabanından sil
    db.session.delete(user)
    db.session.commit()
    
    # Oturumu sonlandır
    session.pop('user_id', None)
    session.pop('username', None)
    
    return jsonify({'success': True, 'message': 'Hesabınız başarıyla silindi!'})

@app.route('/suspend-account', methods=['POST'])
def suspend_account():
    """Hesabı dondurma."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'})
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'error': 'Kullanıcı bulunamadı!'})
    
    # Hesabı dondurma süresini belirle (30 gün)
    suspension_period = request.form.get('suspension_period', '30')
    try:
        days = int(suspension_period)
        user.suspended_until = datetime.utcnow() + timedelta(days=days)
        user.account_status = 'suspended'
        
        db.session.commit()
        
        # Oturumu sonlandır
        session.pop('user_id', None)
        session.pop('username', None)
        
        return jsonify({'success': True, 'message': f'Hesabınız {days} gün süreyle donduruldu!'})
    except ValueError:
        return jsonify({'success': False, 'error': 'Geçersiz dondurma süresi!'})

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Reset token oluştur
            reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
            user.reset_token = reset_token
            user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
            db.session.commit()
            
            # E-posta gönder (Demo için sadece token'ı göster)
            flash(f'Parola sıfırlama bağlantınız e-posta adresinize gönderildi. Token: {reset_token}', 'info')
            return redirect(url_for('login'))
        else:
            flash('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı!', 'danger')
    
    return render_template('forgot_password.html')

@app.route('/reset-code', methods=['GET', 'POST'])
def reset_code():
    if request.method == 'POST':
        token = request.form.get('token')
        user = User.query.filter_by(reset_token=token).first()
        
        if user and user.reset_token_expiry > datetime.utcnow():
            session['reset_user_id'] = user.id
            return redirect(url_for('reset_password'))
        else:
            flash('Geçersiz veya süresi dolmuş token!', 'danger')
    
    return render_template('reset_code.html')

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if 'reset_user_id' not in session:
        flash('Şifre sıfırlama süresi dolmuş!', 'danger')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor!', 'danger')
            return render_template('reset_password.html')
        
        user = User.query.get(session['reset_user_id'])
        if user:
            user.password_hash = generate_password_hash(password)
            user.reset_token = None
            user.reset_token_expiry = None
            db.session.commit()
            
            session.pop('reset_user_id', None)
            flash('Şifreniz başarıyla sıfırlandı!', 'success')
            return redirect(url_for('login'))
    
    return render_template('reset_password.html')

@app.route('/api/save-score', methods=['POST'])
def save_score():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Kullanıcı girişi yapılmamış'}), 401
    
    data = request.get_json()
    game_type = data.get('game_type')
    score_value = data.get('score')
    
    if not game_type or score_value is None:
        return jsonify({'success': False, 'message': 'Eksik veya geçersiz veriler'}), 400
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'Kullanıcı bulunamadı'}), 404
    
    # Skoru kaydet
    new_score = Score(
        user_id=user_id,
        game_type=game_type,
        score=score_value
    )
    db.session.add(new_score)
    
    # Kullanıcı istatistiklerini güncelle
    user.total_games_played += 1
    user.experience_points += min(score_value, 100)  # XP sınırla
    
    if score_value > user.highest_score:
        user.highest_score = score_value
    
    db.session.commit()
    
    # Kullanıcının yeni seviyesini hesapla
    current_level = calculate_level(user.experience_points)
    
    return jsonify({
        'success': True, 
        'message': 'Skor başarıyla kaydedildi',
        'new_xp': user.experience_points,
        'level': current_level
    })

@app.route('/api/user/current')
def get_current_user_api():
    """Mevcut kullanıcı kimliğini döndür (API)"""
    user_id = session.get('user_id')
    if user_id:
        return jsonify({'user_id': user_id})
    return jsonify({'user_id': None})

@app.route('/api/scores/<game_type>')
def get_scores(game_type):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify([])
    
    scores = Score.query.filter_by(user_id=user_id, game_type=game_type).order_by(Score.score.desc()).limit(10).all()
    
    result = [{
        'score': score.score,
        'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for score in scores]
    
    return jsonify(result)

@app.route('/api/scores/v2/<game_type>')
def get_scores_alt(game_type):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'scores': [], 'max_score': 0})
    
    scores = Score.query.filter_by(user_id=user_id, game_type=game_type).order_by(Score.timestamp.desc()).limit(10).all()
    
    score_data = [{
        'score': score.score,
        'date': score.timestamp.strftime('%d.%m.%Y'),
        'time': score.timestamp.strftime('%H:%M')
    } for score in scores]
    
    # En yüksek skoru bul
    max_score = 0
    if scores:
        max_score = max(score.score for score in scores)
    
    return jsonify({
        'scores': score_data,
        'max_score': max_score
    })

@app.route('/api/scores/aggregate')
def get_aggregated_scores():
    """Tüm oyunlardaki toplam skorları getiren API."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Kullanıcı girişi yapılmamış'}), 401
    
    # Her oyun için en yüksek skoru bul
    scores = db.session.query(Score.game_type, db.func.max(Score.score).label('max_score')) \
                     .filter(Score.user_id == user_id) \
                     .group_by(Score.game_type) \
                     .all()
    
    result = {score.game_type: score.max_score for score in scores}
    
    return jsonify(result)

@app.route('/api/leaderboard/<game_type>')
def get_leaderboard(game_type):
    # Her kullanıcı için en yüksek skoru bul
    top_scores = db.session.query(Score.user_id, db.func.max(Score.score).label('max_score')) \
                         .filter(Score.game_type == game_type) \
                         .group_by(Score.user_id) \
                         .order_by(db.desc('max_score')) \
                         .limit(10) \
                         .all()
    
    # Kullanıcı bilgilerini ekle
    result = []
    for user_id, max_score in top_scores:
        user = User.query.get(user_id)
        if user:
            avatar_url = user.avatar_url if user.avatar_url else url_for('static', filename='img/default-avatar.png')
            result.append({
                'username': user.username,
                'score': max_score,
                'avatar_url': avatar_url,
                'rank': calculate_rank(max_score),
                'level': calculate_level(user.experience_points)
            })
    
    return jsonify(result)

@app.route('/api/home-screen/add-game', methods=['POST'])
def add_game_to_home():
    """Ana ekrana oyun ekleme API'si"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'}), 401
    
    user_id = session['user_id']
    data = request.get_json()
    game_id = data.get('game_id')
    
    if not game_id:
        return jsonify({'success': False, 'error': 'Oyun ID eksik!'}), 400
    
    # Kullanıcının ana sayfasında zaten kaç oyun var?
    existing_count = UserHomeScreen.query.filter_by(user_id=user_id).count()
    if existing_count >= 4:
        return jsonify({'success': False, 'error': 'Ana sayfanıza en fazla 4 oyun ekleyebilirsiniz!'}), 400
    
    # Oyun zaten ana sayfada mı?
    existing_game = UserHomeScreen.query.filter_by(user_id=user_id, game_type=game_id).first()
    if existing_game:
        return jsonify({'success': False, 'error': 'Bu oyun zaten ana sayfanızda!'}), 400
    
    # Yeni sıra numarası belirle
    display_order = existing_count
    
    # Oyunu ana sayfaya ekle
    new_home_game = UserHomeScreen(
        user_id=user_id,
        game_type=game_id,
        display_order=display_order
    )
    db.session.add(new_home_game)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Oyun ana sayfanıza eklendi!'})

@app.route('/api/home-screen/remove-game', methods=['POST'])
def remove_game_from_home():
    """Ana ekrandan oyun kaldırma API'si"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'}), 401
    
    user_id = session['user_id']
    data = request.get_json()
    game_id = data.get('game_id')
    
    if not game_id:
        return jsonify({'success': False, 'error': 'Oyun ID eksik!'}), 400
    
    # Oyun ana sayfada mı?
    home_game = UserHomeScreen.query.filter_by(user_id=user_id, game_type=game_id).first()
    if not home_game:
        return jsonify({'success': False, 'error': 'Bu oyun ana sayfanızda bulunamadı!'}), 404
    
    # Oyunu ana sayfadan kaldır
    db.session.delete(home_game)
    
    # Sıralama numaralarını güncelle
    remaining_games = UserHomeScreen.query.filter_by(user_id=user_id).order_by(UserHomeScreen.display_order).all()
    for i, game in enumerate(remaining_games):
        game.display_order = i
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Oyun ana sayfanızdan kaldırıldı!'})

@app.route('/api/home-screen/reorder', methods=['POST'])
def reorder_home_games():
    """Ana ekrandaki oyunları yeniden sıralama API'si"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Oturum süresi dolmuş!'}), 401
    
    user_id = session['user_id']
    data = request.get_json()
    game_order = data.get('game_order', [])
    
    if not game_order:
        return jsonify({'success': False, 'error': 'Sıralama bilgisi eksik!'}), 400
    
    # Her oyun için display_order güncelle
    for i, game_id in enumerate(game_order):
        home_game = UserHomeScreen.query.filter_by(user_id=user_id, game_type=game_id).first()
        if home_game:
            home_game.display_order = i
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Oyun sıralaması güncellendi!'})

# Helper Functions
def get_leaderboard_data(game_type):
    # Her kullanıcı için en yüksek skoru bul
    top_scores = db.session.query(Score.user_id, db.func.max(Score.score).label('max_score')) \
                         .filter(Score.game_type == game_type) \
                         .group_by(Score.user_id) \
                         .order_by(db.desc('max_score')) \
                         .limit(10) \
                         .all()
    
    # Kullanıcı bilgilerini ekle
    result = []
    for user_id, max_score in top_scores:
        user = User.query.get(user_id)
        if user:
            result.append({
                'username': user.username,
                'score': max_score,
                'level': calculate_level(user.experience_points)
            })
    
    return result

def calculate_rank(score):
    """Skora göre rütbe hesapla"""
    if score >= 5000:
        return "Efsanevi Deha"
    elif score >= 3000:
        return "Üstün Deha"
    elif score >= 2000:
        return "Deha"
    elif score >= 1500:
        return "Uzman"
    elif score >= 1000:
        return "Usta"
    elif score >= 500:
        return "Yetenekli"
    elif score >= 300:
        return "Gelişmiş"
    elif score >= 100:
        return "Orta"
    else:
        return "Başlangıç"

# Önemli: iOS-benzeri kaydırma navigasyonu JavaScript kodu
@app.route('/static/js/swipeNavigation.js')
def serve_swipe_navigation_js():
    return '''
// Sayfa geçmişini ve geçmişin durumunu izlemek için değişkenler
let pageHistory = [];
let currentHistoryIndex = -1;

// Sayfa yüklendiğinde geçmiş bilgisi varsa al
document.addEventListener('DOMContentLoaded', function() {
    initializePageHistory();
    setupSwipeNavigation();
});

// Sayfa geçmişini başlat ve mevcut sayfayı ekle
function initializePageHistory() {
    // sessionStorage'dan geçmiş bilgisini al
    const storedHistory = sessionStorage.getItem('pageHistory');
    const storedIndex = sessionStorage.getItem('currentHistoryIndex');
    
    if (storedHistory) {
        pageHistory = JSON.parse(storedHistory);
        currentHistoryIndex = parseInt(storedIndex || '0');
        
        // Mevcut URL geçmişte varsa, o indekse ilerle
        const currentPath = window.location.pathname;
        const existingIndex = pageHistory.indexOf(currentPath);
        
        if (existingIndex !== -1) {
            // Eğer geri gittiysek, geçmişteki konumumuza ayarla
            currentHistoryIndex = existingIndex;
        } else {
            // Eğer yeni bir sayfaya geldiyse ve geçmişte bir konumdaysak
            // geçmişteki o konumdan sonraki tüm sayfaları temizle ve yeni sayfayı ekle
            if (currentHistoryIndex < pageHistory.length - 1) {
                pageHistory = pageHistory.slice(0, currentHistoryIndex + 1);
            }
            
            // Yeni sayfayı geçmişe ekle
            pageHistory.push(currentPath);
            currentHistoryIndex = pageHistory.length - 1;
        }
    } else {
        // İlk kez sayfa yükleniyorsa, geçmişi başlat
        pageHistory = [window.location.pathname];
        currentHistoryIndex = 0;
    }
    
    // Geçmiş bilgisini sessionStorage'a kaydet
    sessionStorage.setItem('pageHistory', JSON.stringify(pageHistory));
    sessionStorage.setItem('currentHistoryIndex', currentHistoryIndex.toString());
    
    console.log('Sayfa geçmişi:', pageHistory);
    console.log('Geçerli indeks:', currentHistoryIndex);
}

// Kaydırma navigasyonunu ayarla
function setupSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 100; // Minimum kaydırma mesafesi
    const edgeThreshold = 50;   // Ekranın kenarından başlama mesafesi
    
    // Dokunma olaylarını takip et
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    // Kaydırma işlemini yönet
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        // Sağdan sola kaydırma için yeterli mesafe var mı?
        if (swipeDistance > swipeThreshold && touchStartX < edgeThreshold) {
            navigateBack();
        }
    }
    
    // Geri gitme düğmesini ayarla (varsa)
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', navigateBack);
    }
}

// Bir önceki sayfaya git
function navigateBack() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const previousPage = pageHistory[currentHistoryIndex];
        
        // Geçmiş bilgisini güncelle
        sessionStorage.setItem('currentHistoryIndex', currentHistoryIndex.toString());
        
        // Önceki sayfaya git
        window.location.href = previousPage;
    }
}

// Sayfa bağlantılarının davranışını ayarla
document.addEventListener('click', function(e) {
    // Tıklanan eleman bir bağlantı mı?
    const link = e.target.closest('a');
    
    if (link && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && 
        !link.getAttribute('target') && !e.ctrlKey && !e.metaKey) {
        
        const url = new URL(link.href);
        
        // Aynı site içinde bir bağlantı mı?
        if (url.origin === window.location.origin) {
            // Geçmiş durumunu güncelle (yeni sayfaya git)
            const newPath = url.pathname;
            
            // Eğer geçmişte bir konumdaysak, o konumdan sonraki tüm sayfaları temizle
            if (currentHistoryIndex < pageHistory.length - 1) {
                pageHistory = pageHistory.slice(0, currentHistoryIndex + 1);
            }
            
            // Yeni sayfayı geçmişe ekle
            pageHistory.push(newPath);
            currentHistoryIndex = pageHistory.length - 1;
            
            // Geçmiş bilgisini sessionStorage'a kaydet
            sessionStorage.setItem('pageHistory', JSON.stringify(pageHistory));
            sessionStorage.setItem('currentHistoryIndex', currentHistoryIndex.toString());
        }
    }
});
''', 200, {'Content-Type': 'application/javascript'}

@app.route('/static/css/swipe-navigation.css')
def serve_swipe_navigation_css():
    return '''
/* Kaydırma navigasyonu için CSS */
.page-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
}

.back-indicator {
    position: fixed;
    top: 50%;
    left: 0;
    width: 3px;
    height: 100px;
    margin-top: -50px;
    background-color: rgba(0, 123, 255, 0.5);
    border-radius: 0 3px 3px 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1000;
    pointer-events: none;
}

.back-button {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
}

.back-button:hover {
    background-color: rgba(245, 245, 245, 1);
}

.back-button i {
    color: #333;
    font-size: 18px;
}

@media (max-width: 768px) {
    .back-button {
        top: 10px;
        left: 10px;
        width: 36px;
        height: 36px;
    }
}
''', 200, {'Content-Type': 'text/css'}

# App run
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)