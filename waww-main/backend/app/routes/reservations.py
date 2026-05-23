from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/reservations", tags=["reservations"])


def _expire_stale_reservations(db: Session):
    """
    Automatically expire any reservations whose expires_at has passed
    and whose status is still 'active'. Reverts their spots to LIBRE.
    """
    now = datetime.now(timezone.utc)
    stale = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.status == "active",
            models.Reservation.expires_at <= now,
        )
        .all()
    )
    for res in stale:
        res.status = "expired"
        spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == res.parking_spot_id).first()
        if spot and spot.status == "RESERVEE":
            spot.status = "LIBRE"
    if stale:
        db.commit()


# ── Public endpoints (no auth required — driver-facing) ──────────────


@router.get("/public/parkings", response_model=List[schemas.ParkingPublicOut])
def list_public_parkings(db: Session = Depends(get_db)) -> Any:
    """List all parkings with their availability counts (public)."""
    _expire_stale_reservations(db)
    parkings = db.query(models.Parking).all()

    result = []
    for p in parkings:
        libre_count = (
            db.query(models.ParkingSpot)
            .filter(models.ParkingSpot.parking_id == p.id, models.ParkingSpot.status == "LIBRE")
            .count()
        )
        result.append(
            schemas.ParkingPublicOut(
                id=p.id,
                parking_name=p.parking_name,
                location=p.location,
                total_places=p.total_places,
                available_places=libre_count,
            )
        )
    return result


@router.get("/public/parkings/{parking_id}/spots")
def list_libre_spots(parking_id: int, db: Session = Depends(get_db)) -> Any:
    """List only LIBRE spots for a given parking (public)."""
    _expire_stale_reservations(db)
    parking = db.query(models.Parking).filter(models.Parking.id == parking_id).first()
    if not parking:
        raise HTTPException(status_code=404, detail="Parking not found")

    spots = (
        db.query(models.ParkingSpot)
        .filter(models.ParkingSpot.parking_id == parking_id, models.ParkingSpot.status == "LIBRE")
        .all()
    )
    return [
        {"id": s.id, "name": s.name, "level": s.level, "status": s.status, "price": s.price}
        for s in spots
    ]


@router.get("/public/parkings/{parking_id}/all-spots")
def list_all_spots_public(parking_id: int, db: Session = Depends(get_db)) -> Any:
    """List ALL spots for a given parking with their current status (public)."""
    _expire_stale_reservations(db)
    parking = db.query(models.Parking).filter(models.Parking.id == parking_id).first()
    if not parking:
        raise HTTPException(status_code=404, detail="Parking not found")

    spots = (
        db.query(models.ParkingSpot)
        .filter(models.ParkingSpot.parking_id == parking_id)
        .all()
    )
    return [
        {"id": s.id, "name": s.name, "level": s.level, "status": s.status, "price": s.price}
        for s in spots
    ]


# ── Reservation lifecycle ─────────────────────────────────────────────


@router.post("/create", response_model=schemas.ReservationOut)
def create_reservation(data: schemas.ReservationCreate, db: Session = Depends(get_db)) -> Any:
    """
    Driver makes a reservation.
    Spot must be LIBRE. Instantly changes spot status to RESERVEE.
    """
    _expire_stale_reservations(db)

    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == data.parking_spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Parking spot not found")

    if spot.status == "RESERVEE":
        raise HTTPException(status_code=409, detail="This spot is already RESERVEE (reserved by another driver)")
    if spot.status == "OCCUPEE":
        raise HTTPException(status_code=409, detail="This spot is already OCCUPEE (a car is physically parked there)")
    if spot.status != "LIBRE":
        raise HTTPException(status_code=409, detail=f"This spot is not available (current status: {spot.status})")

    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=data.duration_minutes)

    reservation = models.Reservation(
        parking_spot_id=spot.id,
        driver_name=data.driver_name,
        plate_number=data.plate_number,
        status="active",
        expires_at=expires,
    )
    spot.status = "RESERVEE"

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first()

    return schemas.ReservationOut(
        id=reservation.id,
        parking_spot_id=reservation.parking_spot_id,
        driver_name=reservation.driver_name,
        plate_number=reservation.plate_number,
        status=reservation.status,
        created_at=reservation.created_at,
        expires_at=reservation.expires_at,
        spot_name=spot.name,
        parking_name=parking.parking_name if parking else None,
    )


@router.post("/{reservation_id}/checkin", response_model=schemas.ReservationOut)
def checkin(reservation_id: int, db: Session = Depends(get_db)) -> Any:
    """Driver arrives — spot becomes OCCUPEE."""
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.status != "active":
        raise HTTPException(status_code=400, detail=f"Cannot check in — reservation status is '{res.status}'")

    res.status = "checked_in"
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == res.parking_spot_id).first()
    if spot:
        spot.status = "OCCUPEE"

    db.commit()
    db.refresh(res)

    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None

    return schemas.ReservationOut(
        id=res.id,
        parking_spot_id=res.parking_spot_id,
        driver_name=res.driver_name,
        plate_number=res.plate_number,
        status=res.status,
        created_at=res.created_at,
        expires_at=res.expires_at,
        spot_name=spot.name if spot else None,
        parking_name=parking.parking_name if parking else None,
    )


@router.post("/{reservation_id}/checkout", response_model=schemas.ReservationOut)
def checkout(reservation_id: int, db: Session = Depends(get_db)) -> Any:
    """Driver leaves — spot becomes LIBRE."""
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.status != "checked_in":
        raise HTTPException(status_code=400, detail=f"Cannot check out — reservation status is '{res.status}'")

    res.status = "completed"
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == res.parking_spot_id).first()
    if spot:
        spot.status = "LIBRE"

    db.commit()
    db.refresh(res)

    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None

    return schemas.ReservationOut(
        id=res.id,
        parking_spot_id=res.parking_spot_id,
        driver_name=res.driver_name,
        plate_number=res.plate_number,
        status=res.status,
        created_at=res.created_at,
        expires_at=res.expires_at,
        spot_name=spot.name if spot else None,
        parking_name=parking.parking_name if parking else None,
    )


@router.post("/{reservation_id}/cancel", response_model=schemas.ReservationOut)
def cancel(reservation_id: int, db: Session = Depends(get_db)) -> Any:
    """Driver cancels — spot goes back to LIBRE."""
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.status not in ("active", "checked_in"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel — reservation status is '{res.status}'")

    res.status = "cancelled"
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == res.parking_spot_id).first()
    if spot:
        spot.status = "LIBRE"

    db.commit()
    db.refresh(res)

    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None

    return schemas.ReservationOut(
        id=res.id,
        parking_spot_id=res.parking_spot_id,
        driver_name=res.driver_name,
        plate_number=res.plate_number,
        status=res.status,
        created_at=res.created_at,
        expires_at=res.expires_at,
        spot_name=spot.name if spot else None,
        parking_name=parking.parking_name if parking else None,
    )


@router.post("/{reservation_id}/expire", response_model=schemas.ReservationOut)
def force_expire(reservation_id: int, db: Session = Depends(get_db)) -> Any:
    """Manually trigger expiration (for simulation). Spot goes back to LIBRE."""
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if res.status != "active":
        raise HTTPException(status_code=400, detail=f"Cannot expire — reservation status is '{res.status}'")

    res.status = "expired"
    res.expires_at = datetime.now(timezone.utc)
    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == res.parking_spot_id).first()
    if spot:
        spot.status = "LIBRE"

    db.commit()
    db.refresh(res)

    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None

    return schemas.ReservationOut(
        id=res.id,
        parking_spot_id=res.parking_spot_id,
        driver_name=res.driver_name,
        plate_number=res.plate_number,
        status=res.status,
        created_at=res.created_at,
        expires_at=res.expires_at,
        spot_name=spot.name if spot else None,
        parking_name=parking.parking_name if parking else None,
    )


@router.get("/by-spot/{spot_id}", response_model=List[schemas.ReservationOut])
def get_reservations_by_spot(spot_id: int, db: Session = Depends(get_db)) -> Any:
    """Get all reservations for a specific spot."""
    _expire_stale_reservations(db)
    reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.parking_spot_id == spot_id)
        .order_by(models.Reservation.created_at.desc())
        .all()
    )
    result = []
    for r in reservations:
        spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == r.parking_spot_id).first()
        parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None
        result.append(schemas.ReservationOut(
            id=r.id,
            parking_spot_id=r.parking_spot_id,
            driver_name=r.driver_name,
            plate_number=r.plate_number,
            status=r.status,
            created_at=r.created_at,
            expires_at=r.expires_at,
            spot_name=spot.name if spot else None,
            parking_name=parking.parking_name if parking else None,
        ))
    return result
