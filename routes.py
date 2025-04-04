from flask import Blueprint, request, jsonify, session
from models import db, Favorite

# Blueprint oluştur
favorites_bp = Blueprint('favorites', __name__)

@favorites_bp.route('/get_favorites', methods=['GET'])
def get_favorites():
    """Kullanıcının favori oyunlarını getirir."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    # Kullanıcının favorilerini al
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    
    # JSON formatına dönüştür
    favorites_list = []
    for fav in favorites:
        favorites_list.append({
            'id': fav.id,
            'game_type': fav.game_type,
            'game_name': fav.game_name,
            'game_icon': fav.game_icon,
            'game_description': fav.game_description
        })
    
    return jsonify({'success': True, 'favorites': favorites_list})

@favorites_bp.route('/add_favorite', methods=['POST'])
def add_favorite():
    """Yeni bir favori oyun ekler."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    # Favori sayısını kontrol et (maksimum 4)
    favorites_count = Favorite.query.filter_by(user_id=user_id).count()
    if favorites_count >= 4:
        return jsonify({'success': False, 'message': 'En fazla 4 oyunu favorilere ekleyebilirsiniz'})
    
    # İstek verilerini al
    data = request.get_json()
    game_type = data.get('game_type')
    game_name = data.get('game_name')
    game_icon = data.get('game_icon')
    game_description = data.get('game_description')
    
    # Gerekli alanları kontrol et
    if not all([game_type, game_name, game_icon]):
        return jsonify({'success': False, 'message': 'Eksik bilgiler'})
    
    # Aynı oyunun zaten favorilerde olup olmadığını kontrol et
    existing_favorite = Favorite.query.filter_by(user_id=user_id, game_type=game_type).first()
    if existing_favorite:
        return jsonify({'success': False, 'message': 'Bu oyun zaten favorilerinizde'})
    
    # Yeni favori oluştur
    new_favorite = Favorite(
        user_id=user_id,
        game_type=game_type,
        game_name=game_name,
        game_icon=game_icon,
        game_description=game_description
    )
    
    # Veritabanına kaydet
    db.session.add(new_favorite)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Oyun favorilere eklendi'})

@favorites_bp.route('/remove_favorite', methods=['POST'])
def remove_favorite():
    """Favori oyunu kaldırır."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Giriş yapmalısınız'})
    
    # İstek verilerini al
    data = request.get_json()
    game_type = data.get('game_type')
    
    if not game_type:
        return jsonify({'success': False, 'message': 'Oyun türü belirtilmedi'})
    
    # Favorilerden kaldır
    favorite = Favorite.query.filter_by(user_id=user_id, game_type=game_type).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Oyun favorilerden kaldırıldı'})
    else:
        return jsonify({'success': False, 'message': 'Favori oyun bulunamadı'})