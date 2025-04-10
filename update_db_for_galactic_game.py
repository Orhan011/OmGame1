from models import Game, db
from main import app
from datetime import datetime

# Run with app context
with app.app_context():
    # Check if game already exists
    existing_game = Game.query.filter_by(slug='galactic-challenge').first()
    
    if not existing_game:
        # Create new game entry
        new_game = Game(
            name="Galaktik Mücadele",
            slug="galactic-challenge",
            short_description="Uzay temalı mini oyunlar koleksiyonu",
            description="""<p>Galaktik Mücadele, uzayın derinliklerinde yeteneklerinizi test edebileceğiniz ve stratejik düşünme becerilerinizi geliştirebileceğiniz bir oyun koleksiyonudur.</p>
            <p>Üç farklı oyun modu içerir:</p>
            <ul>
                <li><strong>Asteroid Avı:</strong> Asteroidleri yok ederek puan kazanın ve hızlı tepki verme becerilerinizi geliştirin.</li>
                <li><strong>Galaksi Labirenti:</strong> En kısa rotayı bularak mantıksal düşünme yeteneğinizi geliştirin.</li>
                <li><strong>Gezegen Savunması:</strong> Gezegeninizi düşman saldırılarından koruyarak stratejik planlama yapın.</li>
            </ul>
            <p>Bu oyun hızlı düşünme, problem çözme ve uzamsal farkındalık becerilerinizi geliştirmenize yardımcı olur.</p>""",
            template_path="games/galacticChallenge.html",
            categories="strateji,hız,uzay",
            tags="uzay,galaksi,strateji,mini-oyunlar",
            difficulty="medium",
            published=True,
            featured=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by=1,
            meta_title="Galaktik Mücadele - Uzay Temalı Oyunlar | OmGame",
            meta_description="Uzayın derinliklerinde yeteneklerinizi test edin ve stratejik düşünme becerilerinizi geliştirin.",
            meta_keywords="uzay oyunu, galaksi, asteroid avı, strateji, labirent"
        )
        
        db.session.add(new_game)
        db.session.commit()
        print("Galaktik Mücadele oyunu veritabanına eklendi!")
    else:
        print("Galaktik Mücadele oyunu zaten veritabanında mevcut!")