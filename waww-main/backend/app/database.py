from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called on application startup."""
    Base.metadata.create_all(bind=engine)

    # Seed default data if empty
    db = SessionLocal()
    try:
        from app import models
        # Check if there is any owner user
        owner = db.query(models.User).filter(models.User.email == "owner@gariha.com").first()
        if not owner:
            # Create a default owner
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            owner = models.User(
                email="owner@gariha.com",
                full_name="Default Owner",
                hashed_password=pwd_context.hash("gariha2026"),
                role="owner",
                status="approved",
                phone="0555555555"
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
            
        # Check if there are any parkings
        if db.query(models.Parking).count() == 0:
            local_parkings = [
                {
                    "name": "PlayLand Parking",
                    "lat": 36.7520,
                    "lng": 5.0574,
                    "price": "50 DZD/H",
                    "places": 45
                },
                {
                    "name": "Parking Public Payant",
                    "lat": 36.7558,
                    "lng": 5.0812,
                    "price": "30 DZD/H",
                    "places": 67
                },
                {
                    "name": "Parking Auto Centre",
                    "lat": 36.7571,
                    "lng": 5.0835,
                    "price": "60 DZD/H",
                    "places": 20
                },
                {
                    "name": "Bougie Park",
                    "lat": 36.7490,
                    "lng": 5.0650,
                    "price": "50 DZD/H",
                    "places": 67
                },
                {
                    "name": "Parking Gare Ferroviaire",
                    "lat": 36.7580,
                    "lng": 5.0870,
                    "price": "40 DZD/H",
                    "places": 30
                }
            ]
            for lp in local_parkings:
                p = models.Parking(
                    owner_id=owner.id,
                    parking_name=lp["name"],
                    location="Béjaïa, Algérie",
                    total_places=lp["places"],
                    available_places=lp["places"],
                    pricing=lp["price"],
                    lat=lp["lat"],
                    lng=lp["lng"],
                    description="Standard city parking with secure and covered spots."
                )
                db.add(p)
                db.commit()
                db.refresh(p)
                
                # Add spots for this parking
                spots = []
                for i in range(1, lp["places"] + 1):
                    price_int = 50
                    try:
                        price_int = int(lp["price"].split()[0])
                    except:
                        pass
                    spot = models.ParkingSpot(
                        parking_id=p.id,
                        name=f"P{i}",
                        level="Ground",
                        status="LIBRE",
                        price=price_int
                    )
                    spots.append(spot)
                db.bulk_save_objects(spots)
                db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
