import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

products = [
    {
        "id": "cam-ip-4k-01",
        "name": "Câmera IP 4K Ultra HD",
        "category": "cameras",
        "description": "Câmera IP de alta definição 4K com visão noturna infravermelha, detecção de movimento e gravação em nuvem. Ideal para áreas externas e internas.",
        "price": 899.90,
        "image": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
        "features": [
            "Resolução 4K Ultra HD (3840x2160)",
            "Visão noturna até 30 metros",
            "Resistente à água IP66",
            "Detecção inteligente de movimento",
            "Armazenamento em nuvem e cartão SD",
            "Acesso remoto via aplicativo"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "cam-dome-360",
        "name": "Câmera Dome 360° PTZ",
        "category": "cameras",
        "description": "Câmera dome com rotação 360°, zoom óptico 20x e rastreamento automático. Perfeita para monitoramento de grandes áreas.",
        "price": 1299.90,
        "image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
        "features": [
            "Rotação pan-tilt-zoom 360°",
            "Zoom óptico 20x",
            "Rastreamento automático de objetos",
            "Resolução Full HD 1080p",
            "Visão noturna infravermelha",
            "Resistente a vandalismo"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "biometric-access-01",
        "name": "Controle Biométrico de Acesso",
        "category": "controle-acesso",
        "description": "Sistema de controle de acesso por biometria digital e reconhecimento facial. Capacidade para 5000 usuários.",
        "price": 1899.90,
        "image": "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&q=80",
        "features": [
            "Reconhecimento facial e digital",
            "Capacidade para 5000 usuários",
            "Display touchscreen 5 polegadas",
            "Controle via aplicativo",
            "Relatórios de acesso em tempo real",
            "Integração com sistemas de alarme"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "card-reader-rfid",
        "name": "Leitor RFID com Teclado",
        "category": "controle-acesso",
        "description": "Leitor de cartão RFID com teclado numérico para controle de acesso. Ideal para condomínios e empresas.",
        "price": 599.90,
        "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
        "features": [
            "Leitura de cartões RFID 125kHz",
            "Teclado numérico retroiluminado",
            "Suporta até 2000 usuários",
            "Saída para fechadura elétrica",
            "Registro de eventos",
            "À prova d'água IP65"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "smart-lock-wifi",
        "name": "Fechadura Digital Wi-Fi",
        "category": "fechaduras",
        "description": "Fechadura inteligente com Wi-Fi, senha, cartão e aplicativo. Controle total de acesso pelo smartphone.",
        "price": 799.90,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        "features": [
            "Abertura por senha, cartão ou app",
            "Conexão Wi-Fi integrada",
            "Histórico de acessos",
            "Bateria de longa duração",
            "Alarme anti-arrombamento",
            "Compatível com Alexa e Google Home"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "biometric-lock-pro",
        "name": "Fechadura Biométrica Premium",
        "category": "fechaduras",
        "description": "Fechadura de alta segurança com biometria, senha, cartão RFID e chave mecânica. Design moderno e resistente.",
        "price": 1499.90,
        "image": "https://images.unsplash.com/photo-1585602173562-e7cfb7f14d96?w=800&q=80",
        "features": [
            "Múltiplas formas de acesso",
            "Capacidade para 100 impressões digitais",
            "Design em aço inoxidável",
            "Tela sensível ao toque",
            "Modo privacidade interno",
            "Certificação anti-arrombamento"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "nvr-16ch-4k",
        "name": "Gravador NVR 16 Canais 4K",
        "category": "cameras",
        "description": "Gravador de vídeo em rede para 16 câmeras IP 4K. Armazenamento de até 8TB e acesso remoto.",
        "price": 2199.90,
        "image": "https://images.unsplash.com/photo-1593640495390-1ff7e0e23747?w=800&q=80",
        "features": [
            "Suporta até 16 câmeras IP 4K",
            "Gravação contínua e por movimento",
            "Armazenamento até 8TB",
            "Acesso remoto multiplataforma",
            "Backup automático na nuvem",
            "Interface intuitiva"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "turnstile-tripod",
        "name": "Catraca Eletrônica Tripé",
        "category": "controle-acesso",
        "description": "Catraca tripé com controle de acesso biométrico e RFID. Ideal para recepções e áreas restritas.",
        "price": 3499.90,
        "image": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80",
        "features": [
            "Estrutura em aço inoxidável",
            "Leitura biométrica e RFID",
            "Liberação automática em emergências",
            "Contador de fluxo de pessoas",
            "Sistema anti-vandalismo",
            "Integração com software de gestão"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    },
    {
        "id": "intercom-video",
        "name": "Vídeo Porteiro IP",
        "category": "controle-acesso",
        "description": "Sistema de vídeo porteiro IP com tela touchscreen 7 polegadas. Comunicação bidirecional e gravação.",
        "price": 1199.90,
        "image": "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&q=80",
        "features": [
            "Tela touchscreen 7 polegadas",
            "Câmera Full HD 1080p",
            "Visão noturna infravermelha",
            "Comunicação bidirecional",
            "Abertura remota de portas",
            "Gravação de vídeo e fotos"
        ],
        "inStock": True,
        "timestamp": "2025-01-15T10:00:00Z"
    }
]

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing products
    await db.products.delete_many({})
    
    # Insert new products
    await db.products.insert_many(products)
    
    print(f"✅ Inserted {len(products)} products successfully!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
