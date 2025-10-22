import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_banners():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["vigiloc_db"]
    
    # Check if banners exist
    existing = await db.banners.count_documents({})
    if existing > 0:
        print(f"✅ {existing} banners already exist")
        client.close()
        return
    
    # Create default banners
    banners = [
        {
            "id": "banner-1",
            "title": "Segurança Inteligente Para Seu Negócio",
            "subtitle": "Câmeras de alta definição, controle de acesso e monitoramento 24/7",
            "media_type": "image",
            "media_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80",
            "link_url": "/produtos",
            "order": 1,
            "active": True,
            "created_at": "2025-01-18T00:00:00Z"
        },
        {
            "id": "banner-2",
            "title": "Totens de Monitoramento VigiLoc",
            "subtitle": "Instala Grátis + Cashback + Segurança para sua rua",
            "media_type": "image",
            "media_url": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1920&q=80",
            "link_url": "/totens",
            "order": 2,
            "active": True,
            "created_at": "2025-01-18T00:00:00Z"
        },
        {
            "id": "banner-3",
            "title": "Controle de Acesso Biométrico",
            "subtitle": "Tecnologia de ponta para proteger seu patrimônio",
            "media_type": "image",
            "media_url": "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1920&q=80",
            "link_url": "/produtos?category=controle-acesso",
            "order": 3,
            "active": True,
            "created_at": "2025-01-18T00:00:00Z"
        }
    ]
    
    await db.banners.insert_many(banners)
    print(f"✅ Created {len(banners)} banners")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_banners())
