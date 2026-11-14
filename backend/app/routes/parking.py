from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/parking", tags=["parking"])


@router.post("/create", response_model=schemas.ParkingOut)
def create_parking(
    parking_in: schemas.ParkingCreate,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Create a new parking.
    Only approved owners can create parkings.
    """
    new_parking = models.Parking(
        **parking_in.model_dump(),
        owner_id=current_owner.id
    )
    db.add(new_parking)
    db.commit()
    db.refresh(new_parking)
    
    # Automatically generate parking spots P1 to PN
    if new_parking.total_places > 0:
        spots_to_create = []
        for i in range(1, new_parking.total_places + 1):
            spot = models.ParkingSpot(
                parking_id=new_parking.id,
                name=f"P{i}",
                level="Ground",
                status="LIBRE",
                price=250
            )
            spots_to_create.append(spot)
        db.add_all(spots_to_create)
        
        # Ensure available_places is synchronized
        new_parking.available_places = new_parking.total_places
        db.commit()
        db.refresh(new_parking)

    return new_parking


@router.get("/mine", response_model=List[schemas.ParkingOut])
def get_my_parkings(
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Get all parkings owned by the current approved owner.
    """
    parkings = db.query(models.Parking).filter(models.Parking.owner_id == current_owner.id).all()
    return parkings


@router.put("/update/{parking_id}", response_model=schemas.ParkingOut)
def update_parking(
    parking_id: int,
    parking_in: schemas.ParkingUpdate,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Update an existing parking.
    """
    parking = db.query(models.Parking).filter(models.Parking.id == parking_id).first()
    if not parking:
        raise HTTPException(status_code=404, detail="Parking not found")
    
    if parking.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this parking")

    update_data = parking_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(parking, field, value)

    db.add(parking)
    db.commit()
    db.refresh(parking)
    return parking

@router.get("/{parking_id}/spots", response_model=List[schemas.ParkingSpotOut])
def get_parking_spots(
    parking_id: int,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    """
    Get all spots for a specific parking.
    """
    parking = db.query(models.Parking).filter(models.Parking.id == parking_id).first()
    if not parking:
        raise HTTPException(status_code=404, detail="Parking not found")
    if parking.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    spots = db.query(models.ParkingSpot).filter(models.ParkingSpot.parking_id == parking_id).all()
    return spots

@router.post("/{parking_id}/spots", response_model=schemas.ParkingSpotOut)
def create_parking_spot(
    parking_id: int,
    spot_in: schemas.ParkingSpotBase,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    parking = db.query(models.Parking).filter(models.Parking.id == parking_id).first()
    if not parking:
        raise HTTPException(status_code=404, detail="Parking not found")
    if parking.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_spot = models.ParkingSpot(
        parking_id=parking.id,
        name=spot_in.name,
        level=spot_in.level,
        status=spot_in.status,
        price=spot_in.price
    )
    db.add(new_spot)
    db.commit()
    db.refresh(new_spot)
    return new_spot

@router.put("/spots/{spot_id}", response_model=schemas.ParkingSpotOut)
def update_parking_spot(
    spot_id: int,
    spot_in: schemas.ParkingSpotBase,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
        
    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first()
    if not parking or parking.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    spot.name = spot_in.name
    spot.level = spot_in.level
    spot.status = spot_in.status
    spot.price = spot_in.price
    
    db.commit()
    db.refresh(spot)
    return spot

@router.delete("/spots/{spot_id}")
def delete_parking_spot(
    spot_id: int,
    db: Session = Depends(get_db),
    current_owner: models.User = Depends(auth.get_current_active_owner)
) -> Any:
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
        
    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first()
    if not parking or parking.owner_id != current_owner.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(spot)
    db.commit()
    return {"message": "Spot deleted successfully"}
