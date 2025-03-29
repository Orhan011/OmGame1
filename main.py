import os
import logging
import random
import secrets
import base64
import uuid
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session, make_response
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Email verification function
def send_verification_email(to_email, verification_code):
    """
    Sends a verification email with the provided code
    
    Uses the configured Gmail account (orhanmedia0@gmail.com) to send verification emails
    """
    # Gmail SMTP ayarları
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = "orhanmedia0@gmail.com"  # Gönderici email adresi
    
    # Normalde bu kısmı çevre değişkenlerinden alırız, ama şimdilik doğrudan kodda belirtiyoruz
    # Gerçek uygulamada bu bilgilerin güvenli bir şekilde saklanması önemlidir!
    smtp_password = os.environ.get('GMAIL_APP_PASSWORD')
    
    # Create email message
    msg = EmailMessage()
    msg['Subject'] = 'Beyin Oyunları - Şifre Sıfırlama Kodu'
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    
    # Email content
    email_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #2a3f5f; border-bottom: 2px solid #eee; padding-bottom: 10px;">Şifre Sıfırlama İsteği</h2>
            <p>Merhaba,</p>
            <p>Beyin Oyunları hesabınız için bir şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanın:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #2a3f5f;">
                {verification_code}
            </div>
            <p style="margin-top: 20px;">Bu kodu kimseyle paylaşmayın. Eğer bu işlemi siz başlatmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            <p>Doğrulama kodunun geçerlilik süresi 30 dakikadır.</p>
            <p style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                Bu otomatik bir e-postadır, lütfen yanıtlamayın.
            </p>
        </div>
    </body>
    </html>
    """
    
    msg.set_content("Şifre sıfırlama kodunuz: " + verification_code)
    msg.add_alternative(email_content, subtype='html')
    
    # Gmail App şifresi yoksa sadece loglama yap (geliştirme modunda)
    if app.debug and not smtp_password:
        logger.info(f"TEST MODU: {SENDER_EMAIL} adresinden {to_email} adresine email gönderilecekti. Kod: {verification_code}")
        return
    
    try:
        # Gmail SMTP sunucusuna bağlan ve email gönder
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # TLS güvenlik bağlantısı başlat
            
            # Gmail'e giriş yap (App Password kullanılmalı)
            if smtp_password:
                server.login(SENDER_EMAIL, smtp_password)
                server.send_message(msg)
                logger.info(f"Doğrulama kodu {to_email} adresine başarıyla gönderildi.")
            else:
                logger.warning("Gmail şifresi belirtilmemiş, email gönderimi atlanıyor.")
                
    except Exception as e:
        logger.error(f"Email gönderme hatası: {e}")
        raise

# Create the Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Add global template functions
app.jinja_env.globals.update(min=min, max=max, now=datetime.now)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///braintraining.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

@app.context_processor
def utility_processor():
    def get_current_user():
        if 'user_id' in session:
            return User.query.get(session['user_id'])
        return None
    return dict(current_user=get_current_user())

# Define models
class User(db.Model):
    __tablename__ = 'users'  # Explicit table name to avoid reserved word conflicts
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    full_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(200))
    location = db.Column(db.String(100))
    experience_points = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default='Başlangıç')
    total_games_played = db.Column(db.Integer, default=0)
    highest_score = db.Column(db.Integer, default=0)
    reset_token = db.Column(db.String(100))
    reset_token_expiry = db.Column(db.DateTime)
    scores = db.relationship('Score', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Score(db.Model):
    __tablename__ = 'scores'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)  # wordPuzzle, memoryMatch, numberSequence, 3dRotation
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Score {self.game_type}: {self.score}>'

class Article(db.Model):
    __tablename__ = 'articles'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # article or tip
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Article {self.title}>'

# Initialize the database - no decorator, just create the function
def initialize_database():
    try:
        logger.info("Creating database tables if they don't exist")
        db.drop_all()
        db.create_all()
        
        # Check if we need to add sample data
        if User.query.filter_by(username="Anonymous").first() is None:
            logger.info("Initializing database with default data")
            
            # Create a default user
            default_user = User(
                username="Anonymous",
                email="anonymous@example.com",
                password_hash=generate_password_hash("anonymous")
            )
            db.session.add(default_user)
            db.session.commit()  # Commit the user first to get a valid ID
            
            # Create some sample articles
            articles = [
                Article(
                    title="Understanding Cognitive Function",
                    content="Cognitive function encompasses several mental abilities including learning, thinking, reasoning, remembering, problem-solving, decision making, and attention. These processes are central to how we interact with the world around us. Regular brain training can help improve these functions over time, leading to better performance in daily tasks and academic or professional challenges.",
                    category="article"
                ),
                Article(
                    title="How Brain Training Works",
                    content="Beyin eğitimi, nöroplastisite prensibi üzerinde çalışır - beyninizin yeni sinirsel bağlantılar oluşturarak kendini yeniden düzenleme yeteneğidir. Beyin eğitimi egzersizleriyle uğraştığınızda, aslında beyninize bir antrenman yaptırıyorsunuz. Fiziksel egzersizin kaslarınızı güçlendirmesi gibi, bilişsel egzersizler de sinir yollarını güçlendirerek zihinsel yeteneklerinizi potansiyel olarak geliştirebilir. İyileşmeleri görmek için tutarlı pratik yapmak önemlidir.",
                    category="article"
                ),
                Article(
                    title="Hafızanın Bilimi",
                    content="Hafıza tek bir varlık değil, farklı türleri içeren karmaşık bir sistemdir: duyusal hafıza, kısa süreli (çalışma) hafıza ve uzun süreli hafıza. Hafıza oyunlarımız her türü hedefleyerek bilgi saklama ve hatırlama yeteneğinizi geliştirmenize yardımcı olur. Araştırmalar, düzenli hafıza egzersizlerinin yaşla ilgili gerilemeyi yavaşlatabileceğini ve çeşitli bilişsel görevlerde zihinsel performansı potansiyel olarak artırabileceğini gösteriyor.",
                    category="article"
                ),
                Article(
                    title="Hidrasyon ve Beyin Fonksiyonu",
                    content="İyi hidrate kalmak, optimal beyin fonksiyonu için çok önemlidir. Hafif dehidrasyon bile dikkat, hafıza ve ruh hali dahil olmak üzere bilişsel performansı bozabilir. Beyin eğitimi egzersizleri sırasında en yüksek zihinsel performans için günde en az 8 bardak su içmeyi hedefleyin.",
                    category="tip"
                ),
                Article(
                    title="Uyku Kalitesi ve Bilişsel Performans",
                    content="Kaliteli uyku, bilişsel işlem ve hafıza pekiştirmesi için gereklidir. Her gece kesintisiz 7-9 saat uyumayı hedefleyin. Düzenli bir uyku programı oluşturun ve yatmadan önce ekran süresini sınırlayarak, yatak odanızı serin ve karanlık tutarak huzurlu bir ortam yaratın.",
                    category="tip"
                ),
                Article(
                    title="Beyin Sağlığı için Beslenme",
                    content="Ne yediğiniz beyninizin nasıl çalıştığını etkiler. Omega-3 yağ asitleri (balık, ceviz ve keten tohumu gibi), antioksidanlar (renkli meyve ve sebzeler) ve B vitaminleri (tam tahıllar, yumurta) açısından zengin gıdalar beyin sağlığını destekler. Bu beyin güçlendirici gıdaları günlük diyetinize dahil etmeyi düşünün.",
                    category="tip"
                ),
                Article(
                    title="Fiziksel Egzersiz ve Bilişsel İşlev",
                    content="Düzenli fiziksel aktivite, beyne kan akışını artırır ve yeni beyin hücrelerinin oluşumunu teşvik eder. Günde sadece 30 dakikalık orta yoğunlukta egzersiz bile hafıza, dikkat ve problem çözme yeteneklerini geliştirebilir. Maksimum fayda için beyin eğitimini fiziksel egzersizle birleştirmeyi deneyin.",
                    category="tip"
                )
            ]
            
            for article in articles:
                db.session.add(article)
            
            db.session.commit()
            logger.info("Database initialized with default data")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Don't let initialization errors prevent the app from running
        pass

# Create a route to handle database initialization
@app.route('/initialize-db')
def init_db_route():
    initialize_database()
    return 'Database initialized'

# Home page with initialization
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            
            # Eğer "Beni hatırla" işaretlenmişse, email'i bir cookie'de saklayalım
            if remember:
                remember_cookie_duration = timedelta(days=30)  # 30 gün hatırla
                resp = make_response(redirect(url_for('index')))
                resp.set_cookie('remembered_email', email, max_age=remember_cookie_duration.total_seconds())
                flash('Başarıyla giriş yaptınız!')
                return resp
            else:
                # Eğer "Beni hatırla" işaretlenmemişse, varsa hatırlanan email'i silelim
                resp = make_response(redirect(url_for('index')))
                resp.delete_cookie('remembered_email')
                flash('Başarıyla giriş yaptınız!')
                return resp
        else:
            flash('Geçersiz email veya şifre.')
            return redirect(url_for('login'))
    
    if session.get('user_id'):
        return redirect(url_for('index'))
    
    # Hatırlanan bir email varsa login ekranında göster
    remembered_email = request.cookies.get('remembered_email')
            
    return render_template('login.html', remembered_email=remembered_email)

@app.route('/')
def index():
    # Check if user is logged in
    if not session.get('user_id'):
        return redirect(url_for('login'))
        
    try:
        db.create_all()
        if User.query.count() == 0:
            initialize_database()
    except Exception as e:
        logger.error(f"Error initializing on first request: {e}")
    
    user = User.query.get(session['user_id'])
    return render_template('index.html', user=user, current_user=user)

@app.route('/profile')
def profile():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    user = User.query.get(session['user_id'])
    return render_template('profile.html', user=user, current_user=user)

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
    theme_color = request.form.get('theme_color')
    
    # Update user's theme preference
    if hasattr(user, 'theme_preference') and theme_preference in ['dark', 'light', 'contrast']:
        user.theme_preference = theme_preference
    
    # In the future, we can add theme_color to the User model and update it here
    
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
    achievement_notifications = 'achievement_notifications' in request.form
    
    # You can update notification_settings in the future if you add this field to the User model
    # For now, we'll just show a success message
    
    flash('Bildirim ayarlarınız başarıyla güncellendi.', 'success')
    return redirect(url_for('profile'))

@app.route('/profile/deactivate', methods=['POST'])
def deactivate_account():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    
    # In a real app, you would set an account status field to 'inactive'
    # For now, we'll just show a message
    flash('Hesabınız geçici olarak devre dışı bırakıldı. Giriş yaparak tekrar aktive edebilirsiniz.', 'warning')
    return redirect(url_for('logout'))

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

@app.route('/games/3d-rotation')
def three_d_rotation():
    return render_template('games/3dRotation.html')

# Leaderboard
@app.route('/leaderboard')
def leaderboard():
    word_puzzle_scores = Score.query.filter_by(game_type='wordPuzzle').order_by(Score.score.desc()).limit(10).all()
    memory_match_scores = Score.query.filter_by(game_type='memoryMatch').order_by(Score.score.desc()).limit(10).all()
    labyrinth_scores = Score.query.filter_by(game_type='labyrinth').order_by(Score.score.desc()).limit(10).all()
    puzzle_scores = Score.query.filter_by(game_type='puzzle').order_by(Score.score.desc()).limit(10).all()
    rotation_3d_scores = Score.query.filter_by(game_type='3dRotation').order_by(Score.score.desc()).limit(10).all()
    
    return render_template('leaderboard.html', 
                          word_puzzle_scores=word_puzzle_scores,
                          memory_match_scores=memory_match_scores,
                          number_sequence_scores=labyrinth_scores, # Labirent oyunu skorları
                          pattern_recognition_scores=puzzle_scores,
                          rotation_3d_scores=rotation_3d_scores)

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
        
        if not user.reset_token or user.reset_token != verification_code:
            flash('Geçersiz doğrulama kodu.', 'danger')
            return render_template('reset_code.html', email=email)
        
        if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
            flash('Doğrulama kodunun süresi doldu. Lütfen yeni bir kod talep edin.', 'danger')
            return redirect(url_for('forgot_password'))
        
        # Generate a secure token for the password reset page
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)  # Token valid for 15 minutes
        db.session.commit()
        
        return redirect(url_for('reset_password', email=email, token=reset_token))
    
    return render_template('reset_code.html', email=email)

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email', '')
    token = request.args.get('token', '')
    
    if request.method == 'POST':
        email = request.form.get('email', '')
        token = request.form.get('token', '')
    
    if not email or not token:
        flash('Geçersiz istek.', 'danger')
        return redirect(url_for('login'))
    
    user = User.query.filter_by(email=email, reset_token=token).first()
    
    if not user:
        flash('Geçersiz link. Lütfen şifre sıfırlama sürecini tekrar başlatın.', 'danger')
        return redirect(url_for('forgot_password'))
    
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        flash('Şifre sıfırlama linkinin süresi doldu. Lütfen tekrar deneyin.', 'danger')
        return redirect(url_for('forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        if not password or len(password) < 6:
            flash('Şifre en az 6 karakter uzunluğunda olmalıdır.', 'danger')
            return render_template('reset_password.html', email=email, token=token)
        
        if password != password_confirm:
            flash('Şifreler eşleşmiyor.', 'danger')
            return render_template('reset_password.html', email=email, token=token)
        
        # Update password
        user.password_hash = generate_password_hash(password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        flash('Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))
    
    return render_template('reset_password.html', email=email, token=token)

# API routes for game scores
@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json
    
    # Use anonymous user or a session-based temporary user if not logged in
    user_id = session.get('user_id', 1)  # Default to user id 1 if not logged in
    
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
@app.route('/get_scores/<game_type>')  # Profil sayfası için eklenen alternatif endpoint
def get_scores(game_type):
    from sqlalchemy import func
    
    # "all" özellği eklenmiş - tüm oyunların verilerini getir
    if game_type == 'all':
        # Tüm oyun türleri için en yüksek skorları getir
        game_types = ['wordPuzzle', 'memoryMatch', 'labyrinth', 'puzzle', '3dRotation']
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
            'number-sequence': 'labyrinth',  # number-sequence da labyrinth'e yönlendiriliyor (geriye uyumluluk için)
            'puzzle': 'puzzle',
            '3d-rotation': '3dRotation'
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
        
        score_list = []
        for score, user in scores:
            score_list.append({
                'username': user.username if user else 'Anonymous',
                'score': score.score,
                'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify(score_list)

# Initialize the database at startup
with app.app_context():
    try:
        # Create tables
        db.create_all()
        logger.info("Tables created on startup")
        
        # Initialize data if needed
        try:
            if User.query.count() == 0:
                initialize_database()
        except Exception as e:
            logger.error(f"Error initializing data: {e}")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")

# Start the application
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)