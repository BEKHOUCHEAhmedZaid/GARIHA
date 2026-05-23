from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
import datetime

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/my", response_model=List[schemas.NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """
    Get all notifications for the current user.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Get notifications where:
    # 1. Receiver is the user
    # 2. It is sent OR it is scheduled and the scheduled time has passed
    notifications = db.query(models.Notification).filter(
        models.Notification.receiver_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()
    
    valid_notifications = []
    for n in notifications:
        if n.is_sent == 1:
            valid_notifications.append(n)
        elif n.scheduled_for and n.scheduled_for <= now:
            # Mark as sent if it was scheduled and time has passed
            n.is_sent = 1
            db.commit()
            valid_notifications.append(n)
            
    return valid_notifications

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    """
    Mark a notification as read.
    """
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.receiver_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = 1
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/broadcast")
def broadcast_notification(
    broadcast_in: schemas.NotificationBroadcast,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    """
    Admin only: Broadcast a notification to a specific role or all users.
    """
    target_users = []
    if broadcast_in.target_role == "All Users":
        target_users = db.query(models.User).filter(models.User.role != "admin").all()
    elif broadcast_in.target_role == "Drivers Only":
        target_users = db.query(models.User).filter(models.User.role == "driver").all()
    elif broadcast_in.target_role == "Owners Only":
        target_users = db.query(models.User).filter(models.User.role == "owner").all()
    
    if not target_users:
        return {"message": "No users found for this target"}

    is_sent = 0 if broadcast_in.scheduled_for else 1
        
    notifications_to_insert = []
    for user in target_users:
        notif = models.Notification(
            sender_id=current_admin.id,
            receiver_id=user.id,
            title=broadcast_in.title,
            message=broadcast_in.message,
            category=broadcast_in.category,
            priority=broadcast_in.priority,
            scheduled_for=broadcast_in.scheduled_for,
            is_sent=is_sent
        )
        notifications_to_insert.append(notif)
        
    db.add_all(notifications_to_insert)
    db.commit()
    
    return {"message": f"Successfully created {len(notifications_to_insert)} notifications"}
