from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    phone: Optional[str] = None

class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    parking_name: Optional[str] = None
    location: Optional[str] = None
    spots: Optional[int] = 0

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParkingBase(BaseModel):
    parking_name: str
    location: str
    total_places: Optional[int] = 0
    available_places: Optional[int] = 0
    pricing: Optional[str] = None
    opening_hours: Optional[str] = None
    description: Optional[str] = None


class ParkingCreate(ParkingBase):
    pass


class ParkingUpdate(ParkingBase):
    parking_name: Optional[str] = None
    location: Optional[str] = None


class ParkingOut(ParkingBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ParkingSpotBase(BaseModel):
    name: str
    level: str = "Ground"
    status: str = "Available"
    price: int = 250

class ParkingSpotOut(ParkingSpotBase):
    id: int
    parking_id: int

    model_config = ConfigDict(from_attributes=True)

class AdminLogOut(BaseModel):
    id: int
    admin_id: int
    action: str
    target_user_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardOut(BaseModel):
    total_parkings: int
    total_places: int
    available_places: int
    occupied_places: int
    unavailable_places: int
    total_drivers: int
    reservations_count: int
    revenue: int
    parkings: List[ParkingOut]

class NotificationBase(BaseModel):
    title: str
    message: str
    category: str = "System Alert"
    priority: str = "Normal"
    scheduled_for: Optional[datetime] = None

class NotificationCreate(NotificationBase):
    receiver_id: int
    is_sent: int = 1

class NotificationBroadcast(NotificationBase):
    target_role: str = "All Users"

class NotificationOut(NotificationBase):
    id: int
    sender_id: Optional[int] = None
    receiver_id: int
    is_read: int
    is_sent: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class MessageOut(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    is_read: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationSummary(BaseModel):
    user_id: int
    full_name: str
    avatar: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int
