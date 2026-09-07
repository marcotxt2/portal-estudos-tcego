from app.database import engine, Base
from app.models import UploadTask

print("Creating upload_tasks table if it doesn't exist...")
UploadTask.__table__.create(bind=engine, checkfirst=True)
print("Done!")
