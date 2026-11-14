"""Script to cleanly delete 3 fake users and all their associated records from the database.
"""
import sys
import os

# Insert current directory into path so we can import app models and database
sys.path.insert(0, '.')

from app.database import SessionLocal
from app import models

FAKE_EMAILS = [
    "test3@gariha.dz",
    "audit@gariha.dz",
    "verifytest@gariha.dz"
]

def main():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("DELETING FAKE USERS FROM THE DATABASE")
        print("=" * 60)
        
        for email in FAKE_EMAILS:
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                print(f"User {email} not found (already deleted or never existed).")
                continue
                
            print(f"Found fake user: id={user.id}, email={user.email}, name={user.full_name}, role={user.role}")
            
            # 1. Delete associated logs
            logs_deleted = db.query(models.AdminLog).filter(
                (models.AdminLog.admin_id == user.id) |
                (models.AdminLog.target_user_id == user.id)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {logs_deleted} AdminLog entries")
            
            # 2. Delete associated notifications
            notifs_deleted = db.query(models.Notification).filter(
                (models.Notification.sender_id == user.id) |
                (models.Notification.receiver_id == user.id)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {notifs_deleted} Notification entries")
            
            # 3. Delete associated messages
            msgs_deleted = db.query(models.Message).filter(
                (models.Message.sender_id == user.id) |
                (models.Message.receiver_id == user.id)
            ).delete(synchronize_session=False)
            print(f"  - Deleted {msgs_deleted} Message entries")
            
            # 4. Delete parking spots and parkings
            parkings = db.query(models.Parking).filter(models.Parking.owner_id == user.id).all()
            for p in parkings:
                spots_deleted = db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == p.id).delete(synchronize_session=False)
                print(f"  - Deleted {spots_deleted} ParkingSpot entries for parking '{p.parking_name}'")
                db.delete(p)
            print(f"  - Deleted {len(parkings)} Parking entries")
            
            # 5. Delete the user
            db.delete(user)
            db.commit()
            print(f"Successfully deleted user {email} permanently.")
            print("-" * 60)
            
        print("\nVerification: Remaining Users in the Database")
        print("-" * 60)
        remaining_users = db.query(models.User).all()
        for u in remaining_users:
            print(f"ID: {u.id:<3} | Email: {u.email:<30} | Name: {u.full_name:<25} | Role: {u.role:<6} | Status: {u.status}")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()
