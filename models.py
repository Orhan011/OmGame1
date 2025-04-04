from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy without binding to a specific app
db = SQLAlchemy()

# Favori oyunlar tablosu (many-to-many ilişki için ara tablo)
favorites = db.Table('favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('game_id', db.Integer, db.ForeignKey('games.id'), primary_key=True),
    db.Column('added_at', db.DateTime, default=datetime.utcnow)
)

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
    # Notification preferences
    email_notifications = db.Column(db.Boolean, default=True)
    achievement_notifications = db.Column(db.Boolean, default=True)
    leaderboard_notifications = db.Column(db.Boolean, default=True)
    scores = db.relationship('Score', backref='user', lazy=True)
    # Favori oyunlar ilişkisi
    favorite_games = db.relationship('Game', secondary=favorites, 
                                    lazy='subquery', backref=db.backref('favorited_by', lazy=True))

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


class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Oyun türü: wordPuzzle, memoryMatch, vb.
    url = db.Column(db.String(500), nullable=False)  # Oyun URL'i
    description = db.Column(db.Text)
    icon = db.Column(db.String(500))  # İkon (FontAwesome class veya URL)
    difficulty = db.Column(db.String(20), default='medium')  # easy, medium, hard
    active = db.Column(db.Boolean, default=True)
    play_count = db.Column(db.Integer, default=0)  # Oynama sayısı
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Game {self.name}>'

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