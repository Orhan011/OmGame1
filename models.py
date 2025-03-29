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
    birth_year = db.Column(db.Integer)
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(2000))  # Daha büyük boyut için
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
