import os
import logging
import shutil
from datetime import datetime

from flask import Flask
from models import db

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///permanent/braintraining.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 60,      # Daha sık bağlantı yenileme (60 sn)
    "pool_pre_ping": True,   # Her sorguda bağlantı kontrolü
    "pool_timeout": 30,      # Bağlantı zaman aşımı
    "pool_size": 5,          # Bağlantı havuzu boyutu
    "max_overflow": 10,      # Maksimum ek bağlantı
    "connect_args": {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
}

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
db.init_app(app)

# Initialize database
with app.app_context():
    try:
        if not os.path.exists('permanent/braintraining.db'):
            db.create_all()
            app.logger.info("Database tables created successfully")
        backup_database()
    except Exception as e:
        app.logger.error(f"Error during initialization: {e}")