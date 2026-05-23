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
    total_parkings = db.query(models.Parking).count()

    return {
        "total_owners": total_owners,
        "pending_owners": pending_owners,
        "approved_owners": approved_owners,
        "total_parkings": total_parkings
    }
