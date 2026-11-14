"""Seed script: Create admin and parking owner accounts.
Deletes existing accounts with matching emails first, then creates fresh ones.
Uses the same bcrypt hashing method as the rest of the project.
"""
import sys
import os
sys.path.insert(0, '.')

from app.database import SessionLocal, init_db
from app import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

init_db()
db = SessionLocal()

# ============================================================
# TASK 1: Admin Account
# ============================================================
ADMIN_EMAIL = "a_bekhouche@estin.dz"
ADMIN_PASSWORD = "12345678"
ADMIN_ROLE = "admin"
ADMIN_STATUS = "approved"
ADMIN_FULL_NAME = "A Bekhouche"

print("=" * 60)
print("TASK 1: Admin Account")
print("=" * 60)

# Check if admin email already exists
existing_admin = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
if existing_admin:
    print(f"  Found existing account: id={existing_admin.id}, role={existing_admin.role}, status={existing_admin.status}")
    print(f"  Deleting existing account completely...")
    # Delete related records first
    db.query(models.AdminLog).filter(
        (models.AdminLog.admin_id == existing_admin.id) |
        (models.AdminLog.target_user_id == existing_admin.id)
    ).delete(synchronize_session=False)
    db.query(models.Notification).filter(
        (models.Notification.sender_id == existing_admin.id) |
        (models.Notification.receiver_id == existing_admin.id)
    ).delete(synchronize_session=False)
    db.query(models.Message).filter(
        (models.Message.sender_id == existing_admin.id) |
        (models.Message.receiver_id == existing_admin.id)
    ).delete(synchronize_session=False)
    # Delete parkings and spots owned by the user
    parkings = db.query(models.Parking).filter(models.Parking.owner_id == existing_admin.id).all()
    for p in parkings:
        db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == p.id).delete(synchronize_session=False)
    db.query(models.Parking).filter(models.Parking.owner_id == existing_admin.id).delete(synchronize_session=False)
    # Now delete the user
    db.delete(existing_admin)
    db.commit()
    print(f"  Deleted successfully.")

# Create fresh admin account
hashed_admin = pwd_context.hash(ADMIN_PASSWORD)
admin_user = models.User(
    email=ADMIN_EMAIL,
    full_name=ADMIN_FULL_NAME,
    hashed_password=hashed_admin,
    role=ADMIN_ROLE,
    status=ADMIN_STATUS,
)
db.add(admin_user)
db.commit()
db.refresh(admin_user)
print(f"  Admin account created:")
print(f"    id       = {admin_user.id}")
print(f"    email    = {admin_user.email}")
print(f"    name     = {admin_user.full_name}")
print(f"    role     = {admin_user.role}")
print(f"    status   = {admin_user.status}")

# Verify password works
verify_ok = pwd_context.verify(ADMIN_PASSWORD, admin_user.hashed_password)
print(f"    password verification = {'PASS' if verify_ok else 'FAIL'}")

# ============================================================
# TASK 2: Parking Owner Account
# ============================================================
OWNER_EMAIL = "bekhoucheahmedziad@gmail.com"
OWNER_PASSWORD = "12345678"
OWNER_ROLE = "owner"
OWNER_STATUS = "approved"
OWNER_FULL_NAME = "Bekhouche Ahmed Ziad"

print()
print("=" * 60)
print("TASK 2: Parking Owner Account")
print("=" * 60)

# Check if owner email already exists
existing_owner = db.query(models.User).filter(models.User.email == OWNER_EMAIL).first()
if existing_owner:
    print(f"  Found existing account: id={existing_owner.id}, role={existing_owner.role}, status={existing_owner.status}")
    print(f"  Deleting existing account completely...")
    # Delete related records first
    db.query(models.AdminLog).filter(
        (models.AdminLog.admin_id == existing_owner.id) |
        (models.AdminLog.target_user_id == existing_owner.id)
    ).delete(synchronize_session=False)
    db.query(models.Notification).filter(
        (models.Notification.sender_id == existing_owner.id) |
        (models.Notification.receiver_id == existing_owner.id)
    ).delete(synchronize_session=False)
    db.query(models.Message).filter(
        (models.Message.sender_id == existing_owner.id) |
        (models.Message.receiver_id == existing_owner.id)
    ).delete(synchronize_session=False)
    # Delete parkings and spots owned by the user
    parkings = db.query(models.Parking).filter(models.Parking.owner_id == existing_owner.id).all()
    for p in parkings:
        db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == p.id).delete(synchronize_session=False)
    db.query(models.Parking).filter(models.Parking.owner_id == existing_owner.id).delete(synchronize_session=False)
    # Now delete the user
    db.delete(existing_owner)
    db.commit()
    print(f"  Deleted successfully.")

# Create fresh owner account
hashed_owner = pwd_context.hash(OWNER_PASSWORD)
owner_user = models.User(
    email=OWNER_EMAIL,
    full_name=OWNER_FULL_NAME,
    hashed_password=hashed_owner,
    role=OWNER_ROLE,
    status=OWNER_STATUS,
)
db.add(owner_user)
db.commit()
db.refresh(owner_user)
print(f"  Parking Owner account created:")
print(f"    id       = {owner_user.id}")
print(f"    email    = {owner_user.email}")
print(f"    name     = {owner_user.full_name}")
print(f"    role     = {owner_user.role}")
print(f"    status   = {owner_user.status}")

# Verify password works
verify_ok = pwd_context.verify(OWNER_PASSWORD, owner_user.hashed_password)
print(f"    password verification = {'PASS' if verify_ok else 'FAIL'}")

db.close()
print()
print("=" * 60)
print("Both accounts seeded successfully!")
print("=" * 60)
