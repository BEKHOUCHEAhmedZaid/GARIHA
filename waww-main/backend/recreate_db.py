import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app import models

# Drop all tables
print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

# Create all tables
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Database re-initialized successfully.")
