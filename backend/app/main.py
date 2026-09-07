from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Base.metadata.create_all(bind=engine) # Removido da raiz para não travar importações sem o banco

app = FastAPI(title="Portal de Estudos TCE-GO API")

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

