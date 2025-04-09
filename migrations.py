from main import app, db
from flask_migrate import Migrate, MigrateCommand, upgrade

migrate = Migrate(app, db)

if __name__ == '__main__':
    with app.app_context():
        upgrade()
