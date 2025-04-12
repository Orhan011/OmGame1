"""
Reset verification code sütununu eklemek için migration script
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
import sys

# Proje kök dizinini ekleyin
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/../'))

from main import app, db
from models import User

def run_migration():
    with app.app_context():
        # SQLite veritabanı için ALTER TABLE komutu
        try:
            # SQLite için ALTER TABLE komutu
            db.session.execute('ALTER TABLE users ADD COLUMN reset_verification_code VARCHAR(10)')
            db.session.commit()
            print("Migration başarıyla tamamlandı: 'reset_verification_code' sütunu eklendi.")
        except Exception as e:
            print(f"Migration hatası: {e}")
            db.session.rollback()

if __name__ == "__main__":
    # Migration'ı çalıştır
    run_migration()