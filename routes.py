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

# Bu rota main.py'de tanımlandı

def update_game_play_count(game_id):
    #  Bu fonksiyonun gerçek implementasyonu burada olmalı.
    #  Örneğin, bir veritabanına oyun oynama sayısını güncelleyebilir.
    pass


@app.route('/games/memoryMatch3D')
def memory_match_3d():
    game_name = "Memory Match 3D"
    update_game_play_count("memoryMatch3D")
    return render_template('games/memoryMatch3D.html', title=game_name)

# Ana sayfaya alternatif rota
@app.route('/game/memoryMatch3D')
def memory_match_3d_alt():
    return memory_match_3d()
    
# Alternatif rotalar ekleniyor
@app.route('/games/memory-match-3d')
def memory_match_3d_kebab():
    return memory_match_3d()
    
@app.route('/memory-match-3d')
def memory_match_3d_root():
    return memory_match_3d()
    
@app.route('/memoryMatch3D')
def memory_match_3d_short():
    return memory_match_3d()

# Diğer URL biçimleri için rotalar
@app.route('/games/memorymatch3d')
def memory_match_3d_lowercase():
    return memory_match_3d()
    
@app.route('/memorymatch3d')
def memory_match_3d_all_lowercase():
    return memory_match_3d()
    
@app.route('/memory_match_3d')
def memory_match_3d_underscore():
    return memory_match_3d()
    
@app.route('/games/memory_match_3d')
def memory_match_3d_games_underscore():
    return memory_match_3d()

# Daha fazla alternatif rotalar
@app.route('/memory-match-3d.html')
def memory_match_3d_html():
    return memory_match_3d()

@app.route('/game/memory-match-3d')
def memory_match_3d_game_kebab():
    return memory_match_3d()

@app.route('/game/memoryMatch3D.html')
def memory_match_3d_game_html():
    return memory_match_3d()

# Oyun rotası için genel catch-all (Memory Match 3D için de çalışacak)
@app.route('/<path:game_path>.html')
def game_html_handler(game_path):
    # game_path'i normalize et
    normalized_path = game_path.replace('-', '').replace('_', '').lower()
    
    # memoryMatch3D kontrolü
    if normalized_path in ['memorymatch3d', 'memory3dmatch', '3dmemorymatch']:
        return memory_match_3d()
    
    # Diğer oyunlar için
    try:
        # Orjinal game_path ile template yüklemeyi dene
        return render_template(f'games/{game_path}.html')
    except:
        # Bulunamazsa 404 hatası döndür
        from flask import abort
        abort(404)

# Diğer oyunlar için eksik olabilecek rotalar
@app.route('/games/tetris')
def tetris_game():
    game_name = "Tetris"
    update_game_play_count("tetris")
    return render_template('games/tetris.html', title=game_name)

@app.route('/games/chess')
def chess_game():
    game_name = "Satranç"
    update_game_play_count("chess")
    return render_template('games/chess.html', title=game_name)

@app.route('/games/snake')
def snake_game():
    game_name = "Yılan Oyunu"
    update_game_play_count("snake")
    return render_template('games/snake.html', title=game_name)

@app.route('/games/memory-match')
def memory_match_game():
    game_name = "Hafıza Eşleştirme"
    update_game_play_count("memory-match")
    return render_template('games/memoryMatch.html', title=game_name)

@app.route('/games/hangman')
def hangman_game():
    game_name = "Adam Asmaca"
    update_game_play_count("hangman")
    return render_template('games/hangman.html', title=game_name)

# Tüm genel rota yönlendirmeleri için catch-all
@app.route('/<path:game_path>')
def game_route_handler(game_path):
    if game_path.startswith('games/'):
        game_name = game_path.split('/')[-1]
        template_path = f"games/{game_name}.html"
        try:
            update_game_play_count(game_name)
            return render_template(template_path, title=game_name.replace('_', ' ').title())
        except:
            from flask import abort
            # Template bulunamazsa 404 hatası döndür
            abort(404)
    from flask import abort
    abort(404)