from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import Module, Question, UserProgress, UploadTask

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Recreating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
