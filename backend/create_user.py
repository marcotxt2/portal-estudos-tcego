import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_user(username: str, password: str):
    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists. Updating password.")
            existing_user.password_hash = get_password_hash(password)
            db.commit()
            print("Password updated successfully.")
            return

        new_user = User(
            username=username,
            password_hash=get_password_hash(password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User '{username}' created successfully with ID: {new_user.id}")
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_user.py <username> <password>")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]
    create_user(username, password)
