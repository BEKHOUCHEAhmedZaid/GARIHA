"""Seed script: Create admin account a_bekhouche@estin.dz"""
import sys, os
sys.path.insert(0, '.')

from app.database import SessionLocal, init_db
from app import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL = "a_bekhouche@estin.dz"
PASSWORD = "12345678"
ROLE = "admin"
STATUS = "approved"
FULL_NAME = "A Bekhouche"

init_db()
db = SessionLocal()

# Check if user already exists
existing = db.query(models.User).filter(models.User.email == EMAIL).first()
if existing:
    print(f"User {EMAIL} already exists (id={existing.id}, role={existing.role}, status={existing.status})")
    # Update to admin if not already
    if existing.role != "admin" or existing.status != "approved":
        existing.role = "admin"
        existing.status = "approved"
        db.commit()
        db.refresh(existing)
        print(f"  -> Updated to role=admin, status=approved")
    print("Done (no duplicate created).")
else:
    hashed = pwd_context.hash(PASSWORD)
    user = models.User(
        email=EMAIL,
        full_name=FULL_NAME,
        hashed_password=hashed,
        role=ROLE,
        status=STATUS,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Admin account created:")
    print(f"  id       = {user.id}")
    print(f"  email    = {user.email}")
    print(f"  name     = {user.full_name}")
    print(f"  role     = {user.role}")
    print(f"  status   = {user.status}")

db.close()
print("Seed complete.")
