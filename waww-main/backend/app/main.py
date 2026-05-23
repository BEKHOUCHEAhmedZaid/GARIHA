from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.database import init_db
from app.config import settings
from app.routes import auth, admin, owner, parking, notifications, messages

# Initialize Database
init_db()

app = FastAPI(
    title="Gariha API",
    description="Backend API for Gariha Parking Management Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(owner.router)
app.include_router(parking.router)
app.include_router(notifications.router)
app.include_router(messages.router)

@app.get("/")
def root():
    return {"message": "Welcome to Gariha API", "status": "online"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
