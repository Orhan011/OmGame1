import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "braingames_secret_key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///braintraining.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define models
class User(db.Model):
    __tablename__ = 'users'  # Explicit table name to avoid reserved word conflicts
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scores = db.relationship('Score', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Score(db.Model):
    __tablename__ = 'scores'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)  # wordPuzzle, memoryMatch, numberSequence, 3dRotation
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Score {self.game_type}: {self.score}>'

class Article(db.Model):
    __tablename__ = 'articles'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # article or tip
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Article {self.title}>'

# Initialize the database - no decorator, just create the function
def initialize_database():
    try:
        logger.info("Creating database tables if they don't exist")
        db.create_all()
        
        # Check if we need to add sample data
        if User.query.filter_by(username="Anonymous").first() is None:
            logger.info("Initializing database with default data")
            
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
            logger.info("Database initialized with default data")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Don't let initialization errors prevent the app from running
        pass

# Create a route to handle database initialization
@app.route('/initialize-db')
def init_db_route():
    initialize_database()
    return 'Database initialized'

# Home page with initialization
@app.route('/')
def index():
    # Try to initialize database on first request
    try:
        # Only try to create tables
        db.create_all()
        # Try to initialize data once
        if User.query.count() == 0:
            initialize_database()
    except Exception as e:
        logger.error(f"Error initializing on first request: {e}")
    
    # Continue with normal request
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

# Initialize the database at startup
with app.app_context():
    try:
        # Create tables
        db.create_all()
        logger.info("Tables created on startup")
        
        # Initialize data if needed
        try:
            if User.query.count() == 0:
                initialize_database()
        except Exception as e:
            logger.error(f"Error initializing data: {e}")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")

# Start the application
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)