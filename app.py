import os
import logging

from flask import Flask
from models import db

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///permanent/braintraining.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {

import shutil
from datetime import datetime
import os

# Veritabanı dizinini oluştur
os.makedirs('permanent', exist_ok=True)
os.makedirs('backups', exist_ok=True)

def backup_database():
    """Veritabanının yedeğini al"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'backups/braintraining_{timestamp}.db'
    
    if os.path.exists('permanent/braintraining.db'):
        shutil.copy2('permanent/braintraining.db', backup_path)
        app.logger.info(f"Database backed up to {backup_path}")

# Her gün otomatik yedek al
@app.before_first_request
def setup_backup():
    backup_database()

    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with SQLAlchemy
db.init_app(app)

# Initialize database
with app.app_context():
    try:
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        app.logger.info("Database tables recreated successfully")
        
        # Main.py artık tüm route'ları içeriyor, routes.py kullanılmıyor
    except Exception as e:
        app.logger.error(f"Error during initialization: {e}")
        # Log the error but continue with app initialization
