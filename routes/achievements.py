from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify, session, g
from models import db, User, Achievement, UserAchievement
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
import json
from routes.avatars import unlock_avatar_by_achievement

achievements_bp = Blueprint('achievements', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Bu sayfayı görüntülemek için giriş yapmalısınız.', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@achievements_bp.route('/achievements')
@login_required
def achievement_list():
    """Kullanıcının başarımlarını göster"""
    user = User.query.get(session['user_id'])
    
    # Tüm başarımları al
    all_achievements = Achievement.query.all()
    
    # Kullanıcının başarımları
    user_achievements = UserAchievement.query.filter_by(user_id=user.id).all()
    
    # Tamamlanan başarım sayısı
    completed_achievements = [ua for ua in user_achievements if ua.progress >= 100]
    
    # İstatistikler
    completed_achievements_count = len(completed_achievements)
    total_achievements_count = len(all_achievements)
    
    # Toplam başarım puanları
    total_achievement_points = sum([ua.achievement.points for ua in completed_achievements])
    
    # Tamamlama yüzdesi
    completion_percentage = int((completed_achievements_count / total_achievements_count * 100) if total_achievements_count > 0 else 0)
    
    # Kullanıcının sahip olmadığı başarımlar
    user_achievement_ids = [ua.achievement_id for ua in user_achievements]
    locked_achievements = []
    
    for achievement in all_achievements:
        if achievement.id not in user_achievement_ids:
            # Kullanıcının sahip olmadığı başarımı, 0 ilerleme ile listele
            locked_achievement = UserAchievement(
                user_id=user.id,
                achievement_id=achievement.id,
                progress=0,
                achievement=achievement  # Bu ilişki sadece görüntüleme için, veritabanına kaydedilmeyecek
            )
            user_achievements.append(locked_achievement)
    
    # Başarımları ilerleme ve ad sırasına göre sırala
    user_achievements.sort(key=lambda x: (-x.progress, x.achievement.name))
    
    return render_template('achievements.html', 
                          user=user,
                          user_achievements=user_achievements,
                          completed_achievements_count=completed_achievements_count,
                          total_achievements_count=total_achievements_count,
                          total_achievement_points=total_achievement_points,
                          completion_percentage=completion_percentage)

def update_achievement_progress(user_id, achievement_code, progress_value=None, increment=None):
    """Başarım ilerlemesini güncelle"""
    # Başarım koduna göre başarımı bul
    achievement = Achievement.query.filter_by(code=achievement_code).first()
    
    if not achievement:
        return False
    
    # Kullanıcının bu başarıma ilişkin kaydını bul veya oluştur
    user_achievement = UserAchievement.query.filter_by(
        user_id=user_id, 
        achievement_id=achievement.id
    ).first()
    
    if not user_achievement:
        user_achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement.id,
            progress=0
        )
        db.session.add(user_achievement)
    
    # İlerlemeyi güncelle
    if progress_value is not None:
        # Direkt değer atama
        user_achievement.progress = min(progress_value, 100)
    elif increment is not None:
        # Artırma
        user_achievement.progress = min(user_achievement.progress + increment, 100)
    
    # Başarım tamamlandıysa tarih ekle
    if user_achievement.progress >= 100 and not user_achievement.unlocked_at:
        user_achievement.unlocked_at = datetime.utcnow()
        
        # Kullanıcıya XP ekle
        user = User.query.get(user_id)
        if user:
            user.experience_points += achievement.points
            
        # İlgili avatarın kilidini aç
        unlock_avatar_by_achievement(user_id, achievement.id)
    
    db.session.commit()
    
    # Flash bildirim göster
    if user_achievement.progress >= 100:
        # Websocket notification would be better but flash for now
        print(f"New achievement unlocked: {achievement.name}")
    
    return True