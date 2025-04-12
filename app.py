import os
import logging
import shutil
from datetime import datetime

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail, Message

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///permanent/braintraining.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 30,      # Daha sık bağlantı yenileme (30 sn)
    "pool_pre_ping": True,   # Her sorguda bağlantı kontrolü
    "pool_timeout": 10,      # Daha kısa bağlantı zaman aşımı
    "pool_size": 10,         # Daha büyük bağlantı havuzu
    "max_overflow": 20       # Daha fazla ek bağlantı
}

# E-posta yapılandırması - Gmail SMTP ayarları
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465  # SSL bağlantısı için 465 portu kullanılıyor
app.config['MAIL_USE_SSL'] = True  # SSL kullanarak daha güvenli bağlantı
app.config['MAIL_USE_TLS'] = False  # SSL kullanıldığında TLS kapalı olmalı
app.config['MAIL_USERNAME'] = 'omgameee@gmail.com'  # OmGame email adresi
app.config['MAIL_PASSWORD'] = os.environ.get('GMAIL_APP_PASSWORD')  # Çevresel değişkenden alınan uygulama şifresi
app.config['MAIL_DEFAULT_SENDER'] = ('OmGame', 'omgameee@gmail.com')
app.config['MAIL_MAX_EMAILS'] = 10  # Bir bağlantıda gönderilebilecek maksimum e-posta sayısı
app.config['MAIL_ASCII_ATTACHMENTS'] = False  # UTF-8 destekli ekler için
app.config['MAIL_DEBUG'] = True  # Mail gönderim hatalarını detaylı görmek için
app.config['MAIL_SUPPRESS_SEND'] = False  # Test modunda mail gönderimini devre dışı bırakmak için


# Veritabanı dizinlerini oluştur
os.makedirs('permanent', exist_ok=True)
os.makedirs('backups', exist_ok=True)

def backup_database():
    """Veritabanının yedeğini al"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'backups/braintraining_{timestamp}.db'

    if os.path.exists('permanent/braintraining.db'):
        shutil.copy2('permanent/braintraining.db', backup_path)
        app.logger.info(f"Database backed up to {backup_path}")

# Initialize the app with SQLAlchemy
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
mail = Mail(app)

# Initialize database
with app.app_context():
    try:
        if not os.path.exists('permanent/braintraining.db'):
            db.create_all()
            app.logger.info("Database tables created successfully")
        backup_database()
    except Exception as e:
        app.logger.error(f"Error during initialization: {e}")