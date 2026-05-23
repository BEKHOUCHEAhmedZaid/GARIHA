from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime, timezone

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/driver", tags=["driver"])


@router.get("/profile")
async def get_driver_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """Get driver profile with stats."""
    total_reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.driver_id == current_user.id)
        .count()
    )
    active_reservation = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.driver_id == current_user.id,
            models.Reservation.status.in_(["active", "checked_in"]),
        )
        .first()
    )

    active_data = None
    if active_reservation:
        spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == active_reservation.parking_spot_id).first()
        parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None
        active_data = {
            "id": active_reservation.id,
            "parking_spot_id": active_reservation.parking_spot_id,
            "driver_name": active_reservation.driver_name,
            "plate_number": active_reservation.plate_number,
            "status": active_reservation.status,
            "created_at": active_reservation.created_at.isoformat(),
            "expires_at": active_reservation.expires_at.isoformat(),
            "spot_name": spot.name if spot else None,
            "parking_name": parking.parking_name if parking else None,
            "spot_price": spot.price if spot else 0,
        }

    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "plate_number": current_user.plate_number,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
        "total_reservations": total_reservations,
        "active_reservation": active_data,
    }


@router.get("/reservations/active")
async def get_active_reservation(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """Get the driver's currently active reservation."""
    reservation = (
        db.query(models.Reservation)
        .filter(
            models.Reservation.driver_id == current_user.id,
            models.Reservation.status.in_(["active", "checked_in"]),
        )
        .first()
    )
    if not reservation:
        return {"active": False, "reservation": None}

    spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == reservation.parking_spot_id).first()
    parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None

    return {
        "active": True,
        "reservation": {
            "id": reservation.id,
            "parking_spot_id": reservation.parking_spot_id,
            "driver_name": reservation.driver_name,
            "plate_number": reservation.plate_number,
            "status": reservation.status,
            "created_at": reservation.created_at.isoformat(),
            "expires_at": reservation.expires_at.isoformat(),
            "spot_name": spot.name if spot else None,
            "parking_name": parking.parking_name if parking else None,
            "spot_price": spot.price if spot else 0,
        },
    }


@router.get("/reservations/history")
async def get_reservation_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """Get all past reservations for this driver."""
    reservations = (
        db.query(models.Reservation)
        .filter(models.Reservation.driver_id == current_user.id)
        .order_by(models.Reservation.created_at.desc())
        .all()
    )

    result = []
    for r in reservations:
        spot = db.query(models.ParkingSpot).filter(models.ParkingSpot.id == r.parking_spot_id).first()
        parking = db.query(models.Parking).filter(models.Parking.id == spot.parking_id).first() if spot else None
        result.append({
            "id": r.id,
            "parking_spot_id": r.parking_spot_id,
            "driver_name": r.driver_name,
            "plate_number": r.plate_number,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "expires_at": r.expires_at.isoformat(),
            "spot_name": spot.name if spot else None,
            "parking_name": parking.parking_name if parking else None,
            "spot_price": spot.price if spot else 0,
        })

    return result
