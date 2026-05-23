from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from app.database import get_db
from app.config import settings
from app import models, schemas, auth
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleLoginRequest(BaseModel):
    token: str


@router.post("/google-login", response_model=schemas.Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Validate Google token, create/update user, and issue JWT.
    """
    idinfo = auth.verify_google_token(request.token)
    
    email = idinfo.get("email")
    full_name = idinfo.get("name")
    google_id = idinfo.get("sub")
    avatar = idinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Email not found in Google token")

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        # Determine role based on admin email list
        role = "admin" if email in settings.admin_emails_list else "owner"
        status_val = "approved" if role == "admin" else "pending"
        
        user = models.User(
            email=email,
            full_name=full_name,
            google_id=google_id,
            avatar=avatar,
            role=role,
            status=status_val
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user info
        user.full_name = full_name
        user.google_id = google_id
        if avatar:
            user.avatar = avatar
        
        # Ensure role and status are always correct for admins
        if email in settings.admin_emails_list:
            user.role = "admin"
            user.status = "approved"

        db.commit()
        db.refresh(user)

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=schemas.UserOut)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    role = "admin" if user_in.email in settings.admin_emails_list else "owner"
    status_val = "approved" if role == "admin" else "pending"
    
    hashed_pwd = get_password_hash(user_in.password)
    
    new_user = models.User(
        email=user_in.email,
        full_name=f"{user_in.first_name} {user_in.last_name}",
        hashed_password=hashed_pwd,
        phone=user_in.phone,
        role=role,
        status=status_val
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-generate Parking and ParkingSpots
    if user_in.parking_name and user_in.location:
        total_spots = user_in.spots or 0
        new_parking = models.Parking(
            owner_id=new_user.id,
            parking_name=user_in.parking_name,
            location=user_in.location,
            total_places=total_spots,
            available_places=total_spots
        )
        db.add(new_parking)
        db.commit()
        db.refresh(new_parking)
        
        if total_spots > 0:
            spots = []
            for i in range(1, total_spots + 1):
                spot = models.ParkingSpot(
                    parking_id=new_parking.id,
                    name=f"P{i}",
                    level="Ground",
                    status="Available",
                    price=250
                )
                spots.append(spot)
            db.bulk_save_objects(spots)
            db.commit()

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    # Auto-correct admin status on login
    if user.email in settings.admin_emails_list:
        if user.role != "admin" or user.status != "approved":
            user.role = "admin"
            user.status = "approved"
            db.commit()
            db.refresh(user)
        
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)) -> Any:
    """
    Get current user profile.
    """
    return current_user


@router.post("/logout")
def logout() -> Any:
    """
    Logout (handled on client side by clearing token, but good to have a dedicated endpoint).
    """
    return {"message": "Logged out successfully"}
