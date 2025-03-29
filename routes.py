from flask import render_template, request, redirect, url_for, jsonify, flash, session
from app import app
from models import db, User, Score, Article
import random
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import logging

# Initialize database with sample data
@app.before_first_request
def initialize_database():
    try:
        # Check if we need to initialize the database by safely querying
        if User.query.filter_by(username="Anonymous").first() is None:
            app.logger.info("Initializing database with default data")

            # Create a default user
            default_user = User(
                username="Anonymous",
                email="anonymous@example.com",
                password_hash=generate_password_hash("anonymous")
            )
            db.session.add(default_user)
            db.session.commit()  # Commit the user first to get a valid ID

            # Create some sample articles
            articles = [
                Article(
                    title="Understanding Cognitive Function",
                    content="Cognitive function encompasses several mental abilities including learning, thinking, reasoning, remembering, problem-solving, decision making, and attention. These processes are central to how we interact with the world around us. Regular brain training can help improve these functions over time, leading to better performance in daily tasks and academic or professional challenges.",
                    category="article"
                ),
                Article(
                    title="How Brain Training Works",
                    content="Beyin eğitimi, nöroplastisite prensibi üzerinde çalışır - beyninizin yeni sinirsel bağlantılar oluşturarak kendini yeniden düzenleme yeteneğidir. Beyin eğitimi egzersizleriyle uğraştığınızda, aslında beyninize bir antrenman yaptırıyorsunuz. Fiziksel egzersizin kaslarınızı güçlendirmesi gibi, bilişsel egzersizler de sinir yollarını güçlendirerek zihinsel yeteneklerinizi potansiyel olarak geliştirebilir. İyileşmeleri görmek için tutarlı pratik yapmak önemlidir.",
                    category="article"
                ),
                Article(
                    title="Hafızanın Bilimi",
                    content="Hafıza tek bir varlık değil, farklı türleri içeren karmaşık bir sistemdir: duyusal hafıza, kısa süreli (çalışma) hafıza ve uzun süreli hafıza. Hafıza oyunlarımız her türü hedefleyerek bilgi saklama ve hatırlama yeteneğinizi geliştirmenize yardımcı olur. Araştırmalar, düzenli hafıza egzersizlerinin yaşla ilgili gerilemeyi yavaşlatabileceğini ve çeşitli bilişsel görevlerde zihinsel performansı potansiyel olarak artırabileceğini gösteriyor.",
                    category="article"
                ),
                Article(
                    title="Hidrasyon ve Beyin Fonksiyonu",
                    content="İyi hidrate kalmak, optimal beyin fonksiyonu için çok önemlidir. Hafif dehidrasyon bile dikkat, hafıza ve ruh hali dahil olmak üzere bilişsel performansı bozabilir. Beyin eğitimi egzersizleri sırasında en yüksek zihinsel performans için günde en az 8 bardak su içmeyi hedefleyin.",
                    category="tip"
                ),
                Article(
                    title="Uyku Kalitesi ve Bilişsel Performans",
                    content="Kaliteli uyku, bilişsel işlem ve hafıza pekiştirmesi için gereklidir. Her gece kesintisiz 7-9 saat uyumayı hedefleyin. Düzenli bir uyku programı oluşturun ve yatmadan önce ekran süresini sınırlayarak, yatak odanızı serin ve karanlık tutarak huzurlu bir ortam yaratın.",
                    category="tip"
                ),
                Article(
                    title="Beyin Sağlığı için Beslenme",
                    content="Ne yediğiniz beyninizin nasıl çalıştığını etkiler. Omega-3 yağ asitleri (balık, ceviz ve keten tohumu gibi), antioksidanlar (renkli meyve ve sebzeler) ve B vitaminleri (tam tahıllar, yumurta) açısından zengin gıdalar beyin sağlığını destekler. Bu beyin güçlendirici gıdaları günlük diyetinize dahil etmeyi düşünün.",
                    category="tip"
                ),
                Article(
                    title="Fiziksel Egzersiz ve Bilişsel İşlev",
                    content="Düzenli fiziksel aktivite, beyne kan akışını artırır ve yeni beyin hücrelerinin oluşumunu teşvik eder. Günde sadece 30 dakikalık orta yoğunlukta egzersiz bile hafıza, dikkat ve problem çözme yeteneklerini geliştirebilir. Maksimum fayda için beyin eğitimini fiziksel egzersizle birleştirmeyi deneyin.",
                    category="tip"
                )
            ]

            for article in articles:
                db.session.add(article)

            db.session.commit()
            app.logger.info("Database initialized with default data")
    except Exception as e:
        app.logger.error(f"Error initializing database: {e}")
        # Don't let initialization errors prevent the app from running
        pass

# Home page
@app.route('/')
def index():
    return render_template('index.html')

# Game routes
@app.route('/games/word-puzzle')
def word_puzzle():
    return render_template('games/wordPuzzle.html')

@app.route('/games/memory-match')
def memory_match():
    return render_template('games/memoryMatch.html')

@app.route('/games/labyrinth')
def labyrinth():
    return render_template('games/labyrinth.html')

@app.route('/games/puzzle')
def puzzle():
    return render_template('games/puzzle.html')

@app.route('/games/3d-rotation')
def three_d_rotation():
    return render_template('games/3dRotation.html')

# Leaderboard
@app.route('/leaderboard')
def leaderboard():
    word_puzzle_scores = Score.query.filter_by(game_type='wordPuzzle').order_by(Score.score.desc()).limit(10).all()
    memory_match_scores = Score.query.filter_by(game_type='memoryMatch').order_by(Score.score.desc()).limit(10).all()
    labyrinth_scores = Score.query.filter_by(game_type='labyrinth').order_by(Score.score.desc()).limit(10).all()
    puzzle_scores = Score.query.filter_by(game_type='puzzle').order_by(Score.score.desc()).limit(10).all()
    rotation_3d_scores = Score.query.filter_by(game_type='3dRotation').order_by(Score.score.desc()).limit(10).all()

    return render_template('leaderboard.html', 
                          word_puzzle_scores=word_puzzle_scores,
                          memory_match_scores=memory_match_scores,
                          number_sequence_scores=labyrinth_scores,  # Labyrinth skorlarını number_sequence değişken adıyla gönderiyoruz
                          puzzle_scores=puzzle_scores,
                          rotation_3d_scores=rotation_3d_scores)

# Articles
@app.route('/articles')
def articles():
    articles = Article.query.filter_by(category='article').all()
    return render_template('articles.html', articles=articles)

# Tips
@app.route('/tips')
def tips():
    tips = Article.query.filter_by(category='tip').all()
    return render_template('tips.html', tips=tips)

@app.route('/profile')
def profile():
    if not session.get('user_id'):
        return redirect(url_for('login'))
    return render_template('profile.html')

@app.route('/update_profile', methods=['POST'])
def update_profile():
    if not session.get('user_id'):
        return redirect(url_for('login'))
        
    user = User.query.get(session['user_id'])
    if request.form.get('email'):
        user.email = request.form.get('email')
    if request.form.get('new_password'):
        user.password_hash = generate_password_hash(request.form.get('new_password'))
    if request.form.get('location'):
        user.location = request.form.get('location')
        
    db.session.commit()
    flash('Profil başarıyla güncellendi!', 'success')
    return redirect(url_for('profile'))

@app.route('/update_avatar', methods=['POST'])
def update_avatar():
    if not session.get('user_id'):
        return redirect(url_for('login'))
        
    if 'avatar' not in request.files:
        flash('Dosya seçilmedi', 'error')
        return redirect(url_for('profile'))
        
    file = request.files['avatar']
    if file.filename == '':
        flash('Dosya seçilmedi', 'error')
        return redirect(url_for('profile'))
        
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        user = User.query.get(session['user_id'])
        user.avatar_url = url_for('static', filename=f'uploads/{filename}')
        db.session.commit()
        
        flash('Profil fotoğrafı güncellendi!', 'success')
    return redirect(url_for('profile'))

# API routes for game scores
@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json

    # Use anonymous user or a session-based temporary user if not logged in
    user_id = session.get('user_id', 1)  # Default to user id 1 if not logged in

    # Check if user already has a score for this game
    existing_score = Score.query.filter_by(
        user_id=user_id,
        game_type=data['gameType']
    ).first()

    if existing_score:
        # Update score if new score is higher
        if data['score'] > existing_score.score:
            existing_score.score = data['score']
            db.session.commit()
        return jsonify({'success': True, 'message': 'Score updated successfully'})
    else:
        # Create new score entry if first time playing
        new_score = Score(
            user_id=user_id,
            game_type=data['gameType'],
            score=data['score']
        )
        db.session.add(new_score)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Score saved successfully'})

@app.route('/api/get-scores/<game_type>')
def get_scores(game_type):
    scores = Score.query.filter_by(game_type=game_type).order_by(Score.score.desc()).limit(10).all()
    score_list = []

    for score in scores:
        user = User.query.get(score.user_id)
        score_list.append({
            'username': user.username if user else 'Anonymous',
            'score': score.score,
            'timestamp': score.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })

    return jsonify(score_list)

# The initialize_database function is already defined above using the @app.before_first_request decorator