import os
import logging
import random
import secrets
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Add global template functions
app.jinja_env.globals.update(min=min, max=max)

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///braintraining.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

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
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Başarıyla giriş yaptınız!')
            return redirect(url_for('index'))
        else:
            flash('Geçersiz email veya şifre.')
            return redirect(url_for('login'))
    
    if session.get('user_id'):
        return redirect(url_for('index'))
            
    return render_template('login.html')

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
    return render_template('index.html', user=user)

# Game routes
@app.route('/games/word-puzzle')
def word_puzzle():
    return render_template('games/wordPuzzle.html')

@app.route('/games/memory-match')
def memory_match():
    return render_template('games/memoryMatch.html')

@app.route('/games/number-sequence')
def number_sequence():
    return render_template('games/numberSequence.html')

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
    number_sequence_scores = Score.query.filter_by(game_type='numberSequence').order_by(Score.score.desc()).limit(10).all()
    puzzle_scores = Score.query.filter_by(game_type='puzzle').order_by(Score.score.desc()).limit(10).all()
    rotation_3d_scores = Score.query.filter_by(game_type='3dRotation').order_by(Score.score.desc()).limit(10).all()
    
    return render_template('leaderboard.html', 
                          word_puzzle_scores=word_puzzle_scores,
                          memory_match_scores=memory_match_scores,
                          number_sequence_scores=number_sequence_scores,
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

@app.route('/profile')
def profile():
    user_id = session.get('user_id', 1)
    user = User.query.get(user_id)
    if not user:
        flash('Kullanıcı bulunamadı', 'error')
        return redirect(url_for('index'))
        
    recent_scores = Score.query.filter_by(user_id=user_id).order_by(Score.timestamp.desc()).limit(10).all()
    highest_score = db.session.query(db.func.max(Score.score)).filter_by(user_id=user_id).scalar() or 0
    total_games = Score.query.filter_by(user_id=user_id).count()
    
    stats = {
        'total_games': total_games,
        'high_score': highest_score,
        'achievements': len(recent_scores)
    }
    recent_scores = Score.query.filter_by(user_id=user_id).order_by(Score.timestamp.desc()).limit(5).all()
    return render_template('profile.html', user=user, stats=stats, recent_scores=recent_scores)

@app.route('/update-profile', methods=['POST'])
def update_profile():
    if not session.get('user_id'):
        flash('Lütfen önce giriş yapın.', 'error')
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    user.full_name = request.form.get('full_name')
    user.age = request.form.get('age', type=int)
    user.bio = request.form.get('bio')
    user.avatar_url = request.form.get('avatar_url')
    user.location = request.form.get('location')
    user.last_active = datetime.utcnow()
    
    # Skorları güncelle
    highest_score = db.session.query(db.func.max(Score.score)).filter_by(user_id=user.id).scalar() or 0
    user.highest_score = highest_score
    user.total_games_played = Score.query.filter_by(user_id=user.id).count()
    
    # Deneyim ve rütbe hesapla
    total_points = sum(score.score for score in user.scores)
    user.experience_points = total_points
    
    if total_points > 10000:
        user.rank = 'Uzman'
    elif total_points > 5000:
        user.rank = 'İleri Seviye'
    elif total_points > 1000:
        user.rank = 'Orta Seviye'
    else:
        user.rank = 'Başlangıç'
    
    db.session.commit()
    flash('Profil başarıyla güncellendi!', 'success')
    return redirect(url_for('profile'))
        
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
        
        # In a real application, send an email with the verification code
        # For this demo, we'll just log it and show it in a flash message
        logger.info(f"Password reset code for {email}: {verification_code}")
        flash(f'Doğrulama kodu email adresinize gönderildi: {verification_code}', 'success')
        
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
    
    new_score = Score(
        user_id=user_id,
        game_type=data['gameType'],
        score=data['score']
    )
    
    db.session.add(new_score)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Score saved successfully'})

@app.route('/api/get-scores/<game_type>')
def get_scores(game_type):
    game_type_map = {
        'word-puzzle': 'wordPuzzle',
        'memory-match': 'memoryMatch',
        'number-sequence': 'numberSequence',
        'puzzle': 'puzzle',
        '3d-rotation': '3dRotation'
    }
    
    internal_game_type = game_type_map.get(game_type)
    if not internal_game_type:
        return jsonify({'error': 'Invalid game type'}), 400
        
    scores = Score.query.filter_by(game_type=internal_game_type)\
                       .order_by(Score.score.desc())\
                       .limit(10)\
                       .all()
    
    score_list = []
    for score in scores:
        user = User.query.get(score.user_id)
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