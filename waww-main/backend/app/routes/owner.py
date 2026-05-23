from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/owner", tags=["owner"])


@router.get("/status")
def get_owner_status(current_user: models.User = Depends(auth.get_current_user)) -> Any:
    """
    Get the approval status of the current owner.
    """
    if current_user.role != "owner":
        raise HTTPException(status_code=400, detail="User is not an owner")
    return {"status": current_user.status}


@router.get("/dashboard", response_model=schemas.DashboardOut)
def get_owner_dashboard(
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Get statistics and high-level data for the owner dashboard.
    Only accessible to approved owners.
    """
    parkings = db.query(models.Parking).filter(models.Parking.owner_id == current_owner.id).all()
    
    total_parkings = len(parkings)
    
    all_spots = []
    for parking in parkings:
        spots = db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == parking.id).all()
        all_spots.extend(spots)
        
    total_places = len(all_spots)
    occupied_places = sum(1 for s in all_spots if s.status.lower() == 'occupied')
    available_places = sum(1 for s in all_spots if s.status.lower() == 'available')
    unavailable_places = sum(1 for s in all_spots if s.status.lower() == 'unavailable')
    reservations_count = sum(1 for s in all_spots if s.status.lower() == 'reserved')
    
    # Calculate revenue based on occupied and reserved spots price
    revenue = sum(s.price for s in all_spots if s.status.lower() in ['occupied', 'reserved'])
    
    # Total drivers would be counted from a Reservations table in the future,
    # for now we return the number of currently active clients (occupied + reserved spots)
    total_drivers = occupied_places + reservations_count
    
    return {
        "total_parkings": total_parkings,
        "total_places": total_places,
        "available_places": available_places,
        "occupied_places": occupied_places,
        "unavailable_places": unavailable_places,
        "total_drivers": total_drivers,
        "reservations_count": reservations_count,
        "revenue": revenue,
        "parkings": parkings
    }

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Update owner privacy and security settings.
    """
    from app.routes.auth import get_password_hash
    
    if profile_in.email:
        # Check if email is already taken
        existing_user = db.query(models.User).filter(models.User.email == profile_in.email).first()
        if existing_user and existing_user.id != current_owner.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_owner.email = profile_in.email
        
    if profile_in.phone:
        current_owner.phone = profile_in.phone
        
    if profile_in.password:
        current_owner.hashed_password = get_password_hash(profile_in.password)

    db.add(current_owner)
    db.commit()
    db.refresh(current_owner)
    return current_owner
