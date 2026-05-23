import sys, traceback
sys.path.insert(0, '.')

print("=== TEST 1: IMPORTS ===")
try:
    from app.config import settings
    print("config OK, DB URL:", settings.DATABASE_URL[:40])
    print("admin_emails:", settings.admin_emails_list)
except Exception as e:
    print("FAIL config:", e)
    traceback.print_exc()

try:
    from app.database import engine, SessionLocal, Base
    print("database OK")
except Exception as e:
    print("FAIL database:", e)
    traceback.print_exc()

try:
    from app import models
    print("models OK")
except Exception as e:
    print("FAIL models:", e)
    traceback.print_exc()

try:
    from app import schemas
    print("schemas OK")
except Exception as e:
    print("FAIL schemas:", e)
    traceback.print_exc()

try:
    from app import auth
    print("auth OK")
except Exception as e:
    print("FAIL auth:", e)
    traceback.print_exc()

try:
    from app.routes.auth import router, get_password_hash, verify_password
    print("routes.auth OK")
except Exception as e:
    print("FAIL routes.auth:", e)
    traceback.print_exc()

try:
    from app.routes.owner import router as owner_router
    print("routes.owner OK")
except Exception as e:
    print("FAIL routes.owner:", e)
    traceback.print_exc()

try:
    from app.routes.admin import router as admin_router
    print("routes.admin OK")
except Exception as e:
    print("FAIL routes.admin:", e)
    traceback.print_exc()

print()
print("=== TEST 2: DATABASE TABLES ===")
import sqlite3
conn = sqlite3.connect("gariha.db")
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in c.fetchall()]
print("Tables:", tables)
for t in tables:
    c.execute("PRAGMA table_info(" + t + ")")
    cols = [col[1] for col in c.fetchall()]
    print("  " + t + ":", cols)
conn.close()

print()
print("=== TEST 3: PASSWORD HASHING ===")
try:
    from app.routes.auth import get_password_hash, verify_password
    h = get_password_hash("mypassword")
    print("Hash OK:", h[:30], "...")
    print("Verify correct:", verify_password("mypassword", h))
    print("Verify wrong:", verify_password("wrongpass", h))
except Exception as e:
    print("FAIL:", e)
    traceback.print_exc()

print()
print("=== TEST 4: FULL REGISTRATION + LOGIN FLOW ===")
try:
    from app.database import SessionLocal
    from app.routes.auth import get_password_hash, verify_password
    from app.config import settings
    from app import models, auth

    db = SessionLocal()

    # Clean test user
    existing = db.query(models.User).filter(models.User.email == "audit@gariha.dz").first()
    if existing:
        db.delete(existing)
        db.commit()
        print("Deleted existing test user")

    # Register
    hpwd = get_password_hash("audit123")
    user = models.User(
        email="audit@gariha.dz",
        full_name="Audit Test",
        hashed_password=hpwd,
        phone="+213 550 999 000",
        role="owner",
        status="pending"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("REGISTER OK: id=%d email=%s role=%s status=%s phone=%s" % (
        user.id, user.email, user.role, user.status, str(user.phone)
    ))

    # Login simulation
    found = db.query(models.User).filter(models.User.email == "audit@gariha.dz").first()
    assert found is not None, "User not found after insert"
    assert found.hashed_password is not None, "Password hash is NULL"
    pw_ok = verify_password("audit123", found.hashed_password)
    print("LOGIN password verify:", pw_ok)
    assert pw_ok, "Password verification FAILED"

    token = auth.create_access_token({"sub": found.email, "role": found.role})
    print("JWT created OK:", token[:30], "...")

    db.close()
    print("ALL AUTH TESTS PASSED")

except Exception as e:
    print("FAIL:", e)
    traceback.print_exc()

print()
print("=== TEST 5: MAIN APP STARTUP ===")
try:
    from app.main import app
    print("FastAPI app loads OK, routes:")
    for route in app.routes:
        if hasattr(route, "path"):
            print("  ", getattr(route, "methods", ""), route.path)
except Exception as e:
    print("FAIL app startup:", e)
    traceback.print_exc()
