from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.api import agents, chat, scenario
from dotenv import load_dotenv
import os

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SENI Agent Builder API",
    description="API for creating and managing conversational agents",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (오디오 파일용)
os.makedirs("/tmp/static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="/tmp/static"), name="static")

app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(scenario.router, prefix="/api/scenario", tags=["scenario"])

@app.get("/")
def root():
    return {"message": "SENI Agent Builder API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "True").lower() == "true"
    
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)