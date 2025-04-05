from flask import url_for, render_template, login_required
from app import app # Assuming app is defined elsewhere

# Wordle rota tanımını ekleyin
@app.route('/games/wordle')
@login_required # Added login_required decorator as suggested by the context
def game_wordle():
    return render_template('games/wordle.html')

@app.route('/games/wordPuzzle')
@login_required
def game_wordPuzzle():
    return render_template('games/wordPuzzle.html')

# routes.py
# Bu dosya artık kullanılmıyor, yönlendirmeler main.py içerisinde.