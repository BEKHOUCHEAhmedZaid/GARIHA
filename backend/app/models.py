from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    avatar = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    plate_number = Column(String, nullable=True)
    role = Column(String, default="owner")  # 'admin' or 'owner' or 'driver'
    status = Column(String, default="pending")  # 'pending', 'approved', 'rejected'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    parkings = relationship("Parking", back_populates="owner")
    logs = relationship("AdminLog", back_populates="admin", foreign_keys="AdminLog.admin_id")


class Parking(Base):
    __tablename__ = "parkings"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    parking_name = Column(String, nullable=False)
    location = Column(Text, nullable=False)
    total_places = Column(Integer, default=0)
    available_places = Column(Integer, default=0)
    pricing = Column(Text, nullable=True)
    opening_hours = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    owner = relationship("User", back_populates="parkings")
    spots = relationship("ParkingSpot", back_populates="parking", cascade="all, delete-orphan")

class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id = Column(Integer, primary_key=True, index=True)
    parking_id = Column(Integer, ForeignKey("parkings.id"))
    name = Column(String, nullable=False)
    level = Column(String, default="Ground")
    status = Column(String, default="LIBRE")  # 'LIBRE', 'RESERVEE', 'OCCUPEE'
    price = Column(Integer, default=250)

    parking = relationship("Parking", back_populates="spots")
    reservations = relationship("Reservation", back_populates="spot")



class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", back_populates="logs", foreign_keys=[admin_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="System Alert")
    priority = Column(String, default="Normal")
    
    is_read = Column(Integer, default=0) # 0 for false, 1 for true
    
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    is_sent = Column(Integer, default=1) # 1 if sent immediately, 0 if scheduled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    parking_spot_id = Column(Integer, ForeignKey("parking_spots.id"), index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    driver_name = Column(String, nullable=False)
    plate_number = Column(String, nullable=False)
    status = Column(String, default="active")  # 'active', 'checked_in', 'completed', 'cancelled', 'expired'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    spot = relationship("ParkingSpot", back_populates="reservations")
    driver = relationship("User", foreign_keys=[driver_id])
