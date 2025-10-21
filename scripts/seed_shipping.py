import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def seed_shipping():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["vigiloc_db"]
    
    # Check if shipping rates exist
    existing = await db.shipping_rates.count_documents({})
    if existing > 0:
        print(f"✅ {existing} shipping rates already exist")
        client.close()
        return
    
    # Create default shipping rates
    rates = [
        {
            "id": "pac",
            "name": "PAC - Correios",
            "type": "fixed",
            "price": 15.00,
            "min_days": 7,
            "max_days": 12,
            "active": True
        },
        {
            "id": "sedex",
            "name": "SEDEX - Correios",
            "type": "fixed",
            "price": 25.00,
            "min_days": 2,
            "max_days": 5,
            "active": True
        },
        {
            "id": "free-sp",
            "name": "Frete Grátis - São Paulo",
            "type": "free",
            "price": 0.00,
            "min_days": 3,
            "max_days": 7,
            "regions": ["SP"],
            "active": True
        }
    ]
    
    await db.shipping_rates.insert_many(rates)
    print(f"✅ Created {len(rates)} shipping rates")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_shipping())
