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
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///braintraining.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the app with SQLAlchemy
db.init_app(app)

# Import routes (which uses models)
with app.app_context():
    try:
        # Create all database tables
        db.create_all()
        app.logger.info("Database tables created successfully")
        
        # Import routes after tables are created
        import routes
    except Exception as e:
        app.logger.error(f"Error during initialization: {e}")
        # Log the error but continue with app initialization
