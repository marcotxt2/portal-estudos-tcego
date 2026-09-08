from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        import sys
        from pathlib import Path
        root_dir = Path(__file__).resolve().parent.parent
        if str(root_dir) not in sys.path:
            sys.path.insert(0, str(root_dir))
        from seed import seed_modules
        seed_modules()
    except Exception as e:
        print(f"Warning: Auto-seed on startup failed: {e}")
    yield

app = FastAPI(title="Portal de Estudos TCE-GO API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import session, answers, modules

app.include_router(session.router, prefix="/api")
app.include_router(answers.router, prefix="/api")
app.include_router(modules.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}

