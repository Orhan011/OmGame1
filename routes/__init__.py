# routes/__init__.py
from flask import Blueprint

# Import routes
from routes.avatars import avatars_bp
from routes.achievements import achievements_bp

def register_routes(app):
    """Ana uygulamaya tüm route blueprint'lerini kaydet"""
    app.register_blueprint(avatars_bp)
    app.register_blueprint(achievements_bp)