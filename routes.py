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
                    content="Brain training works on the principle of neuroplasticity - your brain's ability to reorganize itself by forming new neural connections. When you engage in brain training exercises, you're essentially giving your brain a workout. Just as physical exercise strengthens your muscles, cognitive exercises can strengthen neural pathways, potentially improving your mental capabilities. Consistent practice is key to seeing improvements.",
                    category="article"
                ),
                Article(
                    title="The Science of Memory",
                    content="Memory is not a single entity but a complex system comprising different types: sensory memory, short-term (working) memory, and long-term memory. Our memory games target each type, helping you improve information retention and recall. Research shows that regular memory exercises can slow age-related decline and potentially enhance mental performance across various cognitive tasks.",
                    category="article"
                ),
                Article(
                    title="Hydration and Brain Function",
                    content="Staying well-hydrated is crucial for optimal brain function. Even mild dehydration can impair cognitive performance, including attention, memory, and mood. Aim to drink at least 8 glasses of water daily for peak mental performance during brain training exercises.",
                    category="tip"
                ),
                Article(
                    title="Sleep Quality and Cognitive Performance",
                    content="Quality sleep is essential for cognitive processing and memory consolidation. Aim for 7-9 hours of uninterrupted sleep nightly. Establish a regular sleep schedule and create a restful environment by limiting screen time before bed and keeping your bedroom cool and dark.",
                    category="tip"
                ),
                Article(
                    title="Nutrition for Brain Health",
                    content="What you eat affects how your brain functions. Foods rich in omega-3 fatty acids (like fish, walnuts, and flaxseeds), antioxidants (colorful fruits and vegetables), and B vitamins (whole grains, eggs) support brain health. Consider incorporating these brain-boosting foods into your daily diet.",
                    category="tip"
                ),
                Article(
                    title="Physical Exercise and Cognitive Function",
                    content="Regular physical activity increases blood flow to the brain and stimulates the growth of new brain cells. Even 30 minutes of moderate exercise daily can enhance memory, attention, and problem-solving abilities. Try combining brain training with physical exercise for maximum benefits.",
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

@app.route('/games/number-sequence')
def number_sequence():
    return render_template('games/numberSequence.html')

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
    number_sequence_scores = Score.query.filter_by(game_type='numberSequence').order_by(Score.score.desc()).limit(10).all()
    puzzle_scores = Score.query.filter_by(game_type='puzzle').order_by(Score.score.desc()).limit(10).all()
    rotation_3d_scores = Score.query.filter_by(game_type='3dRotation').order_by(Score.score.desc()).limit(10).all()
    
    return render_template('leaderboard.html', 
                          word_puzzle_scores=word_puzzle_scores,
                          memory_match_scores=memory_match_scores,
                          number_sequence_scores=number_sequence_scores,
                          pattern_recognition_scores=puzzle_scores,
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

# API routes for game scores
@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json
    
    # Use anonymous user or a session-based temporary user if not logged in
    user_id = session.get('user_id', 1)  # Default to user id 1 if not logged in
    
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
