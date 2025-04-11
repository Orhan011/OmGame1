from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy without binding to a specific app
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    full_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(2000))
    location = db.Column(db.String(100))
    experience_points = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default='Başlangıç')
    total_games_played = db.Column(db.Integer, default=0)
    highest_score = db.Column(db.Integer, default=0)
    theme_preference = db.Column(db.String(20), default='dark')
    account_status = db.Column(db.String(20), default='active')
    reset_token = db.Column(db.String(100))
    reset_token_expiry = db.Column(db.DateTime)
    suspended_until = db.Column(db.DateTime)
    # Oyun ve bonus istatistikleri
    streak_count = db.Column(db.Integer, default=0)  # Ardışık oynama günü sayısı
    # Notification preferences
    email_notifications = db.Column(db.Boolean, default=True)
    achievement_notifications = db.Column(db.Boolean, default=True)
    leaderboard_notifications = db.Column(db.Boolean, default=True)
    scores = db.relationship('Score', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Score(db.Model):
    __tablename__ = 'scores'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)  # wordPuzzle, memoryMatch, numberSequence, 3dRotation
    score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), default='medium')  # easy, medium, hard, expert
    adjusted_score = db.Column(db.Integer)  # Zorluk seviyesine göre ayarlanmış skor
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Score {self.game_type}: {self.score} (Difficulty: {self.difficulty})>'

class Article(db.Model):
    __tablename__ = 'articles'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # article or tip
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Article {self.title}>'


# Arkadaşlık ilişkisi tablosu
friendships = db.Table('friendships',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('friend_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('status', db.String(20), default='pending'),  # pending, accepted, blocked
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(2000))
    points = db.Column(db.Integer, default=0)
    requirement = db.Column(db.JSON)  # Başarı koşulları
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class GameRating(db.Model):
    __tablename__ = 'game_ratings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)  # Oyun tipi (slug)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 arası derecelendirme
    comment = db.Column(db.Text)  # Kullanıcının yorumu (opsiyonel)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # İlişkiler
    user = db.relationship('User', backref=db.backref('ratings', lazy=True))
    
    def __repr__(self):
        return f'<GameRating {self.game_type}: {self.rating}/5 by User {self.user_id}>'


class GameStat(db.Model):
    __tablename__ = 'game_stats'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)
    playtime = db.Column(db.Integer, default=0)  # Saniye cinsinden
    score = db.Column(db.Integer, default=0)
    date = db.Column(db.Date, nullable=False)
    achievements_earned = db.Column(db.JSON, default=lambda: [])
    detailed_stats = db.Column(db.JSON, default=lambda: {})

# Admin panel modelleri
class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='editor')  # admin, editor, viewer
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AdminUser {self.username}>'

class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(200))
    cover_image = db.Column(db.String(2000))
    template_path = db.Column(db.String(200))  # games/gameName.html
    categories = db.Column(db.String(200))  # Virgülle ayrılmış kategoriler
    tags = db.Column(db.String(200))  # Virgülle ayrılmış etiketler
    difficulty = db.Column(db.String(20))  # easy, medium, hard
    published = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)
    play_count = db.Column(db.Integer, default=0)
    avg_rating = db.Column(db.Float, default=0)
    avg_playtime = db.Column(db.Integer, default=0)  # Saniye cinsinden
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    
    # SEO alanları
    meta_title = db.Column(db.String(100))
    meta_description = db.Column(db.String(200))
    meta_keywords = db.Column(db.String(200))
    
    # Oyun özel ayarları
    settings = db.Column(db.JSON, default=lambda: {})
    
    def __repr__(self):
        return f'<Game {self.name}>'

class GameScreenshot(db.Model):
    __tablename__ = 'game_screenshots'
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    image_url = db.Column(db.String(2000), nullable=False)
    caption = db.Column(db.String(200))
    order = db.Column(db.Integer, default=0)
    
    game = db.relationship('Game', backref=db.backref('screenshots', lazy=True))
    
    def __repr__(self):
        return f'<GameScreenshot {self.id} for Game {self.game_id}>'

class SiteSettings(db.Model):
    __tablename__ = 'site_settings'
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text)
    setting_type = db.Column(db.String(20))  # text, number, boolean, json, color
    category = db.Column(db.String(50))  # general, theme, seo, etc.
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    
    def __repr__(self):
        return f'<SiteSettings {self.setting_key}>'

class Page(db.Model):
    __tablename__ = 'pages'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    content = db.Column(db.Text)
    published = db.Column(db.Boolean, default=True)
    show_in_menu = db.Column(db.Boolean, default=False)
    menu_order = db.Column(db.Integer, default=0)
    meta_title = db.Column(db.String(100))
    meta_description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    
    def __repr__(self):
        return f'<Page {self.title}>'

class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    content = db.Column(db.Text)
    excerpt = db.Column(db.String(300))
    featured_image = db.Column(db.String(2000))
    published = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)
    tags = db.Column(db.String(200))  # Virgülle ayrılmış etiketler
    meta_title = db.Column(db.String(100))
    meta_description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    
    def __repr__(self):
        return f'<BlogPost {self.title}>'

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    icon = db.Column(db.String(50))  # Font Awesome icon ismi
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]))
    
    def __repr__(self):
        return f'<Category {self.name}>'

class MediaFile(db.Model):
    __tablename__ = 'media_files'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(2000), nullable=False)
    file_type = db.Column(db.String(50))  # image, video, audio, document
    file_size = db.Column(db.Integer)  # Byte cinsinden
    width = db.Column(db.Integer)  # Resimler için
    height = db.Column(db.Integer)  # Resimler için
    title = db.Column(db.String(100))
    alt_text = db.Column(db.String(200))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    
    def __repr__(self):
        return f'<MediaFile {self.filename}>'

class AdminLog(db.Model):
    __tablename__ = 'admin_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    action = db.Column(db.String(50), nullable=False)  # create, update, delete, login, etc.
    entity_type = db.Column(db.String(50))  # user, game, page, etc.
    entity_id = db.Column(db.Integer)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    admin = db.relationship('AdminUser', backref=db.backref('logs', lazy=True))
    
    def __repr__(self):
        return f'<AdminLog {self.action} by {self.admin_id}>'
