from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predictions

app = FastAPI(title="AgroSync AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "agrosync-ai"}
