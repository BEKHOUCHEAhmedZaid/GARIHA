from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Any
import datetime

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/send", response_model=schemas.MessageOut)
def send_message(
    message_in: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    # If owner, they can only message admins
    if current_user.role == "owner":
        # Find an admin to receive the message (or just use a specific admin ID if available)
        # For simplicity, we'll allow sending to any admin, but in practice, 
        # owners usually just send to "Support" and any admin can see it.
        # We'll check if the receiver_id is indeed an admin
        admin = db.query(models.User).filter(models.User.id == message_in.receiver_id, models.User.role == "admin").first()
        if not admin:
             # Fallback: if no receiver_id specified or invalid, send to the first admin found
             admin = db.query(models.User).filter(models.User.role == "admin").first()
             if not admin:
                 raise HTTPException(status_code=404, detail="No admin available to receive message")
             receiver_id = admin.id
        else:
            receiver_id = admin.id
    else:
        # Admin can message anyone
        receiver_id = message_in.receiver_id

    new_message = models.Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=message_in.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@router.get("/my", response_model=List[schemas.MessageOut])
def get_my_messages(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    # Owners only see messages where they are sender or receiver
    messages = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == current_user.id,
            models.Message.receiver_id == current_user.id
        )
    ).order_by(models.Message.created_at.asc()).all()
    return messages

@router.get("/conversations", response_model=List[schemas.ConversationSummary])
def get_conversations(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    # Find all unique users who have messaged with admins
    # We'll look for messages where receiver_id is admin or sender_id is admin
    # And group by the OTHER person
    
    # This is a bit complex in SQL, we'll do it via logic
    all_messages = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == current_admin.id,
            models.Message.receiver_id == current_admin.id
        )
    ).order_by(models.Message.created_at.desc()).all()
    
    conversations = {}
    for m in all_messages:
        other_id = m.sender_id if m.receiver_id == current_admin.id else m.receiver_id
        if other_id not in conversations:
            other_user = db.query(models.User).filter(models.User.id == other_id).first()
            if not other_user: continue
            
            conversations[other_id] = {
                "user_id": other_id,
                "full_name": other_user.full_name,
                "avatar": other_user.avatar,
                "last_message": m.content,
                "last_message_time": m.created_at,
                "unread_count": 0
            }
        
        if m.receiver_id == current_admin.id and m.is_read == 0:
            conversations[other_id]["unread_count"] += 1
            
    return list(conversations.values())

@router.get("/with/{user_id}", response_model=List[schemas.MessageOut])
def get_conversation_with(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
) -> Any:
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_admin.id, models.Message.receiver_id == user_id),
            and_(models.Message.sender_id == user_id, models.Message.receiver_id == current_admin.id)
        )
    ).order_by(models.Message.created_at.asc()).all()
    
    # Mark messages from the other user as read
    db.query(models.Message).filter(
        models.Message.sender_id == user_id,
        models.Message.receiver_id == current_admin.id,
        models.Message.is_read == 0
    ).update({models.Message.is_read: 1})
    db.commit()
    
    return messages

@router.put("/{message_id}/read")
def mark_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
) -> Any:
    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.receiver_id == current_user.id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = 1
    db.commit()
    return {"status": "ok"}
