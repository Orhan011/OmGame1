from main import app, db
from alembic import op
import sqlalchemy as sa
from flask import Flask
from flask_migrate import Migrate, migrate

# Veritabanına migration uygulamak için bu dosyayı çalıştırın
# Bu dosya, User tablosuna reset_verification_code sütunu ekler

def upgrade():
    # SQLite veritabanı için ALTER TABLE komutu
    # SQLite, sütun eklerken DEFAULT ve NOT NULL kısıtlamalarını desteklemez
    with app.app_context():
        with db.engine.connect() as conn:
            conn.execute(sa.text('ALTER TABLE users ADD COLUMN reset_verification_code VARCHAR(10)'))
            conn.commit()
        print("reset_verification_code sütunu başarıyla eklendi.")

if __name__ == '__main__':
    # Bu dosyayı doğrudan çalıştırırsanız, migration uygulanır
    with app.app_context():
        upgrade()
        print("Migration tamamlandı.")