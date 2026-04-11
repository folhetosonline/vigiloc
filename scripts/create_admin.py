import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["vigiloc_db"]
        
        # Check if admin exists
        existing = await db.users.find_one({"email": "admin@vigiloc.com"})
        if existing:
            print("✅ Admin user already exists")
            client.close()
            return
        
        # Create admin user
        admin = {
            "id": "admin-001",
            "email": "admin@vigiloc.com",
            "name": "Administrador",
            "password_hash": pwd_context.hash("admin123"),
            "is_admin": True,
            "created_at": "2025-01-18T00:00:00Z"
        }
        
        await db.users.insert_one(admin)
        print("✅ Admin user created!")
        print("Email: admin@vigiloc.com")
        print("Senha: admin123")
        
        client.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(create_admin())
