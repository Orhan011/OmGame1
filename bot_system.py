import os
import random
import string
import time
from datetime import datetime, timedelta
import logging
import threading
import schedule
from werkzeug.security import generate_password_hash
from flask import current_app
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Bot isimleri listesi
MALE_NAMES = [
    "Mehmet", "Ali", "Ömer", "Mert", "Kerem", "Arda", "Efe", "Enes", 
    "Burak", "Emirhan", "Hakan", "Samir", "Nihat", "Fərid", "Murad", "Ayxan"
]

FEMALE_NAMES = [
    "Yağmur", "Sude", "Defne", "Azra", "Nehir", "Melisa", "Ceren", "Rabia", 
    "Nigar", "Ləman", "Aysel", "Nərmin", "Şəbnəm", "Lale", "Türkan", "Fidan"
]

ALL_NAMES = MALE_NAMES + FEMALE_NAMES

# Oyun türleri listesi
GAME_TYPES = [
    "wordPuzzle", "memoryMatch", "numberSequence", "labyrinth", "puzzle", 
    "numberChain", "audioMemory", "nBack", "game2048", "wordle", "chess", 
    "iqTest", "simonSays", "tetris", "typingSpeed", "puzzleSlider", 
    "minesweeper", "colorMatch", "mathChallenge", "snake", "sudoku", 
    "tangram", "hangman", "crossword", "solitaire"
]

def generate_random_avatar_placeholder(username):
    """
    Kullanıcı adına göre tutarlı bir renk kodu üreterek avatar placeholder oluşturur.
    Bu fonksiyon kullanıcı adını hash'leyip bir renk kodu oluşturur, böylece 
    aynı kullanıcı adı için her zaman aynı renk kullanılır.
    """
    # Kullanıcı adını hash'le
    hash_object = hashlib.md5(username.encode())
    hash_hex = hash_object.hexdigest()
    
    # Hash'in ilk 6 karakterini alarak bir renk kodu oluştur
    color_code = hash_hex[:6]
    
    return f"#avatar-placeholder-color-{color_code}"

def generate_bot_email(username):
    """Bot kullanıcılar için geçerli bir e-posta adresi üret"""
    domain = random.choice(["omgame.com", "brain-games.net", "gamemaster.org", "puzzlemaster.net"])
    return f"{username.lower()}@{domain}"

def create_bot_user(username, avatar_type="svg"):
    """
    Bot kullanıcı oluştur
    
    Args:
        username (str): Bot kullanıcı adı
        avatar_type (str): Avatar türü ('placeholder', 'svg' veya 'generated')
    
    Returns:
        User: Oluşturulan bot kullanıcı nesnesi
    """
    from models import User, db

    try:
        # Kullanıcı adının benzersiz olmasını sağla
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            # Kullanıcı adına rastgele bir numara ekle
            username = f"{username}{random.randint(1, 999)}"
        
        email = generate_bot_email(username)
        
        # Avatar URL'si oluştur
        if avatar_type == "svg":
            # İsim erkek veya kadın ismi mi kontrol et
            is_female = username in FEMALE_NAMES
            
            if is_female:
                avatar_options = [
                    "/static/avatars/bots/avatar_female_1.svg", 
                    "/static/avatars/bots/avatar_female_2.svg"
                ]
            else:
                avatar_options = [
                    "/static/avatars/bots/avatar_male_1.svg", 
                    "/static/avatars/bots/avatar_male_2.svg", 
                    "/static/avatars/bots/avatar_male_3.svg"
                ]
            
            avatar_url = random.choice(avatar_options)
        else:
            # Fallback olarak placeholder kullan
            avatar_url = generate_random_avatar_placeholder(username)
        
        # Rastgele nitelikler oluştur
        age = random.randint(18, 65)
        locations = ["İstanbul", "Ankara", "İzmir", "Bakü", "Antalya", "Bursa", "Adana", "Konya", "Trabzon", "Diyarbakır"]
        location = random.choice(locations)
        
        bios = [
            "Bilişsel oyunları seviyorum!",
            "Zekamı geliştirmek için buradayım",
            "Bulmaca çözmeyi çok seviyorum",
            "Matematik ve mantık oyunları favorim",
            "Hafıza oyunlarında iddialıyım",
            "Kelime oyunları benim için vazgeçilmez",
            "Zihin egzersizi yapmayı seviyorum",
            "Yapay zeka ve bilişim ile ilgileniyorum",
            "Farklı zorluk seviyelerinde oyunlar oynuyorum",
            "Yeni zihinsel beceriler geliştirmek için buradayım"
        ]
        bio = random.choice(bios)
        
        # Başlangıç seviyesini belirle (daha düşük, gerçekçi değerler)
        experience_points = random.randint(50, 300)
        
        # Seviyeye göre rütbeyi belirle
        rank = "Başlangıç"
        if experience_points > 250:
            rank = "Orta Seviye"
        elif experience_points > 150:
            rank = "Acemi"
        
        # Oyun istatistiklerini belirle (daha gerçekçi, küçük değerler)
        total_games_played = random.randint(2, 20)
        highest_score = random.randint(50, 200)
        total_score = random.randint(highest_score, highest_score + 150)
        
        # Bot kullanıcı oluştur
        bot_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(f"bot_{username}_password"),
            full_name=username,
            age=age,
            bio=bio,
            avatar_url=avatar_url,
            location=location,
            experience_points=experience_points,
            rank=rank,
            total_games_played=total_games_played,
            highest_score=highest_score,
            total_score=total_score,
            # Bot olduğunu belirten bir alan ekle (veritabanında var olan bir alan olmadığından açıklama alanını kullanalım)
            account_status='bot'  # Normal kullanıcılar için 'active' kullanılıyor
        )
        
        db.session.add(bot_user)
        db.session.commit()
        
        logger.info(f"Bot kullanıcı oluşturuldu: {username}")
        return bot_user
    
    except Exception as e:
        logger.error(f"Bot kullanıcı oluşturulurken hata: {str(e)}")
        db.session.rollback()
        return None

def generate_game_score(game_type, bot_skill_level):
    """
    Belirli bir oyun türü ve bot beceri seviyesine göre rastgele bir skor üretir
    
    Args:
        game_type (str): Oyun türü
        bot_skill_level (float): Bot beceri seviyesi (0.1 - 1.0 arası)
    
    Returns:
        int: Üretilen skor
    """
    # Oyun türüne göre skor aralıklarını belirle (daha düşük, gerçekçi değerler)
    game_score_ranges = {
        "wordPuzzle": (10, 150),
        "memoryMatch": (20, 200),
        "numberSequence": (10, 100),
        "labyrinth": (15, 150),
        "puzzle": (25, 200),
        "numberChain": (20, 150),
        "audioMemory": (10, 100),
        "nBack": (5, 50),
        "game2048": (100, 500),
        "wordle": (5, 80),
        "chess": (20, 150),
        "iqTest": (40, 120),
        "simonSays": (5, 30),
        "tetris": (50, 300),
        "typingSpeed": (10, 80),
        "puzzleSlider": (20, 150),
        "minesweeper": (10, 100),
        "colorMatch": (5, 50),
        "mathChallenge": (10, 120),
        "snake": (5, 50),
        "sudoku": (20, 150),
        "tangram": (10, 100),
        "hangman": (5, 50),
        "crossword": (10, 100),
        "solitaire": (20, 150)
    }
    
    # Oyun türü için skor aralığını al, yoksa varsayılan değer kullan
    min_score, max_score = game_score_ranges.get(game_type, (50, 500))
    
    # Beceri seviyesine göre skor aralığını ayarla
    adjusted_min = min_score
    adjusted_max = min_score + int((max_score - min_score) * bot_skill_level)
    
    # Rastgele bir skor üret
    return random.randint(adjusted_min, adjusted_max)

def generate_bot_game_play(bot_user, game_type=None):
    """
    Bot kullanıcı için bir oyun oynama kaydı oluştur
    
    Args:
        bot_user (User): Bot kullanıcı nesnesi
        game_type (str, optional): Oyun türü. Belirtilmezse rastgele seçilir.
    
    Returns:
        Score: Oluşturulan skor nesnesi
    """
    from models import Score, db
    
    try:
        # Oyun türü belirtilmemişse rastgele seç
        if not game_type:
            game_type = random.choice(GAME_TYPES)
        
        # Bot için beceri seviyesi belirle (deneyim puanına göre)
        bot_skill_level = min(bot_user.experience_points / 5000, 1.0)
        
        # Zorluk seviyesi belirle
        difficulties = ["easy", "medium", "hard", "expert"]
        difficulty_weights = [0.4, 0.3, 0.2, 0.1]  # Kolay oyunlar daha sık
        difficulty = random.choices(difficulties, weights=difficulty_weights, k=1)[0]
        
        # Skor üret
        score_value = generate_game_score(game_type, bot_skill_level)
        
        # Düzeltilmiş skor hesapla (zorluk seviyesine göre)
        difficulty_multipliers = {
            "easy": 1.0,
            "medium": 1.5,
            "hard": 2.0,
            "expert": 3.0
        }
        adjusted_score = int(score_value * difficulty_multipliers.get(difficulty, 1.0))
        
        # Zaman damgası ayarla (son 7 gün içinde rastgele)
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
        
        # Skor nesnesi oluştur
        score = Score(
            user_id=bot_user.id,
            game_type=game_type,
            score=score_value,
            adjusted_score=adjusted_score,
            difficulty=difficulty,
            timestamp=timestamp
        )
        
        db.session.add(score)
        
        # Kullanıcı istatistiklerini güncelle
        bot_user.total_games_played += 1
        bot_user.total_score += score_value
        
        if score_value > bot_user.highest_score:
            bot_user.highest_score = score_value
        
        # XP kazancını hesapla (zorluk ve skora göre)
        xp_gain = int(score_value * 0.1 * difficulty_multipliers.get(difficulty, 1.0))
        bot_user.experience_points += xp_gain
        
        # Rütbeyi güncelle (daha düşük değerlerle)
        if bot_user.experience_points > 250:
            bot_user.rank = "Orta Seviye"
        elif bot_user.experience_points > 150:
            bot_user.rank = "Acemi"
        else:
            bot_user.rank = "Başlangıç"
        
        db.session.commit()
        
        logger.info(f"Bot oyun kaydı oluşturuldu: {bot_user.username} - {game_type} - Skor: {score_value}")
        return score
    
    except Exception as e:
        logger.error(f"Bot oyun kaydı oluşturulurken hata: {str(e)}")
        db.session.rollback()
        return None

def create_multiple_bot_users(count=20):
    """
    Belirtilen sayıda bot kullanıcı oluştur
    
    Args:
        count (int): Oluşturulacak bot sayısı
    
    Returns:
        list: Oluşturulan bot kullanıcıların listesi
    """
    bot_users = []
    
    for i in range(count):
        # Erkek ve kadın isimlerini karıştır
        username = random.choice(ALL_NAMES)
        
        # Bot kullanıcıyı oluştur
        bot_user = create_bot_user(username)
        
        if bot_user:
            bot_users.append(bot_user)
            
            # Her bot için 1-5 arası rastgele oyun kaydı oluştur
            game_count = random.randint(1, 5)
            for _ in range(game_count):
                generate_bot_game_play(bot_user)
    
    return bot_users

def schedule_bot_game_plays():
    """Bot oyun kayıtlarını düzenli aralıklarla oluşturmak için zamanlar"""
    from models import User, db
    
    try:
        # 'bot' statüsüne sahip kullanıcıları bul
        bot_users = User.query.filter_by(account_status='bot').all()
        
        if not bot_users:
            logger.warning("Hiç bot kullanıcı bulunamadı!")
            return
        
        # Her bot için rastgele 1-2 oyun oynama kaydı oluştur
        for bot_user in bot_users:
            # Her bot 1-2 oyun oynasın
            num_games = random.randint(1, 2)
            for _ in range(num_games):
                game_type = random.choice(GAME_TYPES)
                generate_bot_game_play(bot_user, game_type)
        
        logger.info(f"{len(bot_users)} bot kullanıcı için oyun kayıtları oluşturuldu")
    
    except Exception as e:
        logger.error(f"Bot oyun zamanlaması sırasında hata: {str(e)}")

def check_real_user_count():
    """Gerçek kullanıcı sayısını kontrol eder ve botların devre dışı bırakılması gerekip gerekmediğini belirler"""
    from models import User
    
    try:
        # Gerçek kullanıcıları say (active statüsüne sahip kullanıcılar)
        real_user_count = User.query.filter_by(account_status='active').count()
        
        logger.info(f"Mevcut gerçek kullanıcı sayısı: {real_user_count}")
        
        # Gerçek kullanıcı sayısı 50'yi geçerse botları devre dışı bırak
        if real_user_count >= 50:
            logger.info("Gerçek kullanıcı sayısı 50'yi geçti! Botlar devre dışı bırakılıyor...")
            return True
        
        return False
    
    except Exception as e:
        logger.error(f"Gerçek kullanıcı sayısı kontrol edilirken hata: {str(e)}")
        return False

def disable_bots():
    """Tüm bot kullanıcıları devre dışı bırakır"""
    from models import User, db
    
    try:
        # Bot statüsüne sahip kullanıcıları bul
        bot_users = User.query.filter_by(account_status='bot').all()
        
        if not bot_users:
            logger.warning("Devre dışı bırakılacak bot kullanıcı bulunamadı!")
            return
        
        # Botların durumunu güncelle
        for bot in bot_users:
            bot.account_status = 'inactive'
        
        db.session.commit()
        logger.info(f"{len(bot_users)} bot kullanıcı devre dışı bırakıldı")
    
    except Exception as e:
        logger.error(f"Botlar devre dışı bırakılırken hata: {str(e)}")
        db.session.rollback()

def start_bot_scheduler():
    """Bot zamanlamasını başlatır"""
    # Bot oyunlarını her gün belirli saatlerde çalıştır
    schedule.every().day.at("08:00").do(schedule_bot_game_plays)
    schedule.every().day.at("15:00").do(schedule_bot_game_plays)
    schedule.every().day.at("21:00").do(schedule_bot_game_plays)
    
    # Gerçek kullanıcı sayısını günde bir kez kontrol et
    schedule.every().day.at("00:00").do(lambda: check_real_user_count() and disable_bots())
    
    # Zamanlamayı ayrı bir iş parçacığında çalıştır
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)  # Her dakika kontrol et
    
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    logger.info("Bot zamanlaması başlatıldı")

def initialize_bot_system(initial_bot_count=15):
    """
    Bot sistemini başlatır
    
    Args:
        initial_bot_count (int): Başlangıçta oluşturulacak bot sayısı
    """
    from models import User
    
    try:
        # Sistemde bot kullanıcı olup olmadığını kontrol et
        bot_count = User.query.filter_by(account_status='bot').count()
        
        if bot_count == 0:
            logger.info(f"Bot sistemi başlatılıyor, {initial_bot_count} bot oluşturuluyor...")
            
            # İlk bot kullanıcıları oluştur
            create_multiple_bot_users(initial_bot_count)
            
            # Bot zamanlamasını başlat
            start_bot_scheduler()
        else:
            logger.info(f"Bot sistemi zaten aktif, mevcut bot sayısı: {bot_count}")
    
    except Exception as e:
        logger.error(f"Bot sistemi başlatılırken hata: {str(e)}")

if __name__ == "__main__":
    # Test amacıyla doğrudan çalıştırıldığında örnek botlar oluştur
    import sys
    from flask import Flask
    from models import db, User, Score
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/omgame")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        if len(sys.argv) > 1 and sys.argv[1] == "create":
            bot_count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            print(f"{bot_count} bot oluşturuluyor...")
            create_multiple_bot_users(bot_count)
            print("Tamamlandı!")
        elif len(sys.argv) > 1 and sys.argv[1] == "play":
            bot_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
            if bot_id:
                bot = User.query.filter_by(id=bot_id, account_status='bot').first()
                if bot:
                    print(f"{bot.username} için oyun kaydı oluşturuluyor...")
                    generate_bot_game_play(bot)
                    print("Tamamlandı!")
                else:
                    print(f"ID {bot_id} olan bot bulunamadı!")
            else:
                print("Tüm botlar için oyun kaydı oluşturuluyor...")
                schedule_bot_game_plays()
                print("Tamamlandı!")