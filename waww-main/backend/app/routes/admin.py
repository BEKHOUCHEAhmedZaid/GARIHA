from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending-owners", response_model=List[schemas.UserOut])
def get_pending_owners(
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Get all pending parking owners.
    """
    users = db.query(models.User).filter(
        models.User.role == "owner", 
        models.User.status == "pending"
    ).all()
    return users


@router.get("/approved-owners", response_model=List[schemas.UserOut])
def get_approved_owners(
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Get all approved parking owners.
    """
    users = db.query(models.User).filter(
        models.User.role == "owner", 
        models.User.status == "approved"
    ).all()
    return users


@router.put("/approve-owner/{user_id}", response_model=schemas.UserOut)
def approve_owner(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Approve a pending parking owner.
    """
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == "owner").first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner not found")

    user.status = "approved"
    
    log = models.AdminLog(
        admin_id=current_admin.id,
        action="approve_owner",
        target_user_id=user.id,
        details=f"Approved owner {user.email}"
    )
    db.add(log)
    db.commit()
    db.refresh(user)
    return user


@router.put("/reject-owner/{user_id}", response_model=schemas.UserOut)
def reject_owner(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Reject a pending parking owner.
    """
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == "owner").first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner not found")

    user.status = "rejected"
    
    log = models.AdminLog(
        admin_id=current_admin.id,
        action="reject_owner",
        target_user_id=user.id,
        details=f"Rejected owner {user.email}"
    )
    db.add(log)
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Get high-level platform statistics for the admin dashboard.
    """
    total_owners = db.query(models.User).filter(models.User.role == "owner").count()
    pending_owners = db.query(models.User).filter(models.User.role == "owner", models.User.status == "pending").count()
    approved_owners = db.query(models.User).filter(models.User.role == "owner", models.User.status == "approved").count()
    
    parkings = db.query(models.Parking).all()
    total_parkings = len(parkings)
    
    # Calculate some aggregated stats based on parkings and spots
    all_spots = db.query(models.ParkingSpot).all()
    
    # Mocking missing data like drivers and revenue based on spots for now
    active_drivers = sum(1 for s in all_spots if s.status.lower() in ['occupied', 'reserved'])
    total_revenue = sum(s.price * 30 for s in all_spots) # Mock monthly revenue
    transactions = active_drivers * 2 # Mock transactions

    return {
        "total_owners": total_owners,
        "pending_owners": pending_owners,
        "approved_owners": approved_owners,
        "suspended_owners": 0,
        "total_parkings": total_parkings,
        "active_drivers": active_drivers,
        "reported_drivers": 0,
        "banned_drivers": 0,
        "revenue": total_revenue,
        "transactions": transactions,
        "new_users": 0,
        "open_reports": 0,
        "warnings_issued": 0,
        "bans_this_month": 0,
        "resolved_reports": 0,
        "total_processed": total_revenue,
        "commissions_earned": int(total_revenue * 0.1),
        "pending_payments": 0,
        "disputes": 0,
        "pending_validations": 0
    }

@router.delete("/delete-owner/{user_id}", response_model=dict)
def delete_owner(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Delete a parking owner permanently along with their parkings and spots.
    """
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == "owner").first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Cascade delete logs, notifications, messages
    db.query(models.AdminLog).filter(
        (models.AdminLog.admin_id == user.id) | (models.AdminLog.target_user_id == user.id)
    ).delete(synchronize_session=False)
    db.query(models.Notification).filter(
        (models.Notification.sender_id == user.id) | (models.Notification.receiver_id == user.id)
    ).delete(synchronize_session=False)
    db.query(models.Message).filter(
        (models.Message.sender_id == user.id) | (models.Message.receiver_id == user.id)
    ).delete(synchronize_session=False)
    
    # Delete parkings and spots
    parkings = db.query(models.Parking).filter(models.Parking.owner_id == user.id).all()
    for p in parkings:
        db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == p.id).delete(synchronize_session=False)
    db.query(models.Parking).filter(models.Parking.owner_id == user.id).delete(synchronize_session=False)

    # Log action before deleting the user
    log = models.AdminLog(
        admin_id=current_admin.id,
        action="delete_owner",
        target_user_id=None,
        details=f"Deleted owner {user.email}"
    )
    db.add(log)
    
    db.delete(user)
    db.commit()
    
    return {"detail": "Owner and associated data deleted successfully"}
