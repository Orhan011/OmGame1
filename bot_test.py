"""
Bot sistemini manuel olarak test etmek için kullanılabilecek bir script.
"""
import os
import sys
from flask import Flask
from models import db, User, Score
from bot_system import create_multiple_bot_users, generate_bot_game_play

# Mini Flask uygulaması oluştur
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

def create_bots(count=15):
    """Belirtilen sayıda bot oluşturur"""
    print(f"{count} bot oluşturuluyor...")
    with app.app_context():
        bots = create_multiple_bot_users(count)
        print(f"{len(bots)} bot başarıyla oluşturuldu.")
        return bots

def list_bots():
    """Mevcut botları listeler"""
    with app.app_context():
        bots = User.query.filter_by(account_status='bot').all()
        print(f"Toplam {len(bots)} bot bulunuyor:")
        for i, bot in enumerate(bots, 1):
            print(f"{i}. {bot.username} (ID: {bot.id})")
        return bots

def bot_play_games(bot_id=None, game_count=1):
    """
    Bot kullanıcılarının oyun oynamasını sağlar
    
    Args:
        bot_id: Belirli bir bot kullanıcısının ID'si. None ise tüm botlar için işlem yapılır.
        game_count: Her bot için oluşturulacak oyun kaydı sayısı.
    """
    with app.app_context():
        if bot_id:
            # Belirli bir bot için oyun kaydı oluştur
            bot = User.query.filter_by(id=bot_id, account_status='bot').first()
            if bot:
                print(f"Bot {bot.username} için {game_count} oyun kaydı oluşturuluyor...")
                for _ in range(game_count):
                    score = generate_bot_game_play(bot)
                    if score:
                        print(f"  - {score.game_type}: {score.score} puan eklendi.")
            else:
                print(f"ID {bot_id} olan bot bulunamadı!")
        else:
            # Tüm botlar için oyun kaydı oluştur
            bots = User.query.filter_by(account_status='bot').all()
            if not bots:
                print("Hiç bot kullanıcı bulunamadı!")
                return
            
            print(f"{len(bots)} bot için {game_count} oyun kaydı oluşturuluyor...")
            for bot in bots:
                for _ in range(game_count):
                    score = generate_bot_game_play(bot)
                    if score:
                        print(f"  - Bot {bot.username}, {score.game_type}: {score.score} puan eklendi.")

def delete_all_bots():
    """TÜM bot kullanıcılarını ve skorlarını siler (DİKKAT!)"""
    with app.app_context():
        bots = User.query.filter_by(account_status='bot').all()
        if not bots:
            print("Silinecek bot bulunamadı!")
            return
        
        confirm = input(f"{len(bots)} bot kullanıcısı bulundu. Hepsini silmek istediğinizden emin misiniz? (e/h): ")
        if confirm.lower() != 'e':
            print("İşlem iptal edildi.")
            return
        
        print(f"{len(bots)} bot siliniyor...")
        for bot in bots:
            # Önce botun skorlarını sil
            Score.query.filter_by(user_id=bot.id).delete()
            # Sonra botu sil
            db.session.delete(bot)
        
        db.session.commit()
        print("Tüm botlar silindi.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım:")
        print("  python bot_test.py create [sayı]  - Bot oluştur")
        print("  python bot_test.py list           - Botları listele")
        print("  python bot_test.py play [bot_id] [oyun_sayısı]  - Botları oynat")
        print("  python bot_test.py delete         - TÜM botları sil")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "create":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 15
        create_bots(count)
    elif command == "list":
        list_bots()
    elif command == "play":
        bot_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
        game_count = int(sys.argv[3]) if len(sys.argv) > 3 else 1
        bot_play_games(bot_id, game_count)
    elif command == "delete":
        delete_all_bots()
    else:
        print(f"Bilinmeyen komut: {command}")
        sys.exit(1)