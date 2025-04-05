
from flask import url_for

# Wordle rota tanımını ekleyin
@app.route('/games/wordle')
def wordle():
    return render_template('games/wordle.html')

# routes.py
# Bu dosya artık kullanılmıyor, yönlendirmeler main.py içerisinde.