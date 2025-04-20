from flask import url_for, render_template
from app import app, mail # app ve mail app.py'den import ediliyor
from flask_mail import Message
from functools import wraps # login_required için gerekli

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import session, flash, redirect, request
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız!', 'warning')
            return redirect(url_for('login', redirect=request.url))
        return f(*args, **kwargs)
    return decorated_function


# This route is now defined in main.py
# @app.route('/games/wordle')
# @login_required
# def game_wordle():
#     return render_template('games/wordle.html')

# This route is now defined in main.py using kebab-case convention (/games/word-puzzle)
# @app.route('/games/wordPuzzle')
# @login_required
# def game_wordPuzzle():
#     return render_template('games/wordPuzzle.html')

def send_welcome_email(email, username):
    msg = Message('OmGame Dünyasına Hoş Geldiniz!', sender='noreply@omgame.com', recipients=[email]) # Replace with your actual sender address
    msg.body = f"Merhaba {username},\nOmGame dünyasına hoş geldin!  Keyifli oyunlar dileriz."
    mail.send(msg)

# Mayın Tarlası oyunu kaldırıldı

# routes.py
# Bu dosya artık kullanılmıyor, yönlendirmeler main.py içerisinde.
# 2048 oyunu kaldırıldı
# 2048 API endpoint'i kaldırıldı

@app.route('/games/language-learning')
def language_learning():
    return render_template('games/languageLearning.html')

@app.route('/games/word-master')
def word_master():
    """Word Master oyunu: İngilizce kelime eğitimi
    Çoktan seçmeli, yazım ve telaffuz egzersizleriyle İngilizce kelime haznenizi geliştirin!"""
    return render_template('word_master.html')

@app.route('/education-games')
def education_games():
    # Eğitici oyun listesi oluştur
    games = [
        # Dil ve Kelime Oyunları
        {
            "title": "Bayrak Tahmin Oyunu",
            "description": "Dünya bayraklarını tahmin ederek görsel hafızanızı ve coğrafi bilginizi geliştirin.",
            "icon": "fas fa-flag",
            "url": "/games/flag-quiz"
        },
        {
            "title": "Dil Öğrenme",
            "description": "Duolingo tarzı interaktif dil öğrenme egzersizleri ile yeni bir dil öğrenin.",
            "icon": "fas fa-language",
            "url": "/games/language-learning"
        },
        {
            "title": "Word Master",
            "description": "Çoktan seçmeli, yazım ve telaffuz aşamalarıyla İngilizce kelime haznenizi geliştirin.",
            "icon": "fas fa-spell-check",
            "url": "/word-master"
        },

        # Mantık ve Matematik Oyunları
        {
            "title": "Sudoku",
            "description": "Her satır, sütun ve blokta 1-9 rakamlarını doğru yerleştirerek mantıksal düşünme becerinizi geliştirin.",
            "icon": "fas fa-th",
            "url": "/games/sudoku"
        },
        {
            "title": "Mayın Tarlası",
            "description": "Mantık yürüterek mayınların yerlerini tespit edin ve güvenli alanları açın.",
            "icon": "fas fa-bomb",
            "url": "/games/minesweeper"
        }
    ]

    return render_template('education_games.html', games=games)