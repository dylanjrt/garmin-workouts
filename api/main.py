"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import workouts, garmin

app = FastAPI(
    title="Garmin Workout Editor",
    description="API for creating and managing swimming workouts",
    version="0.1.0",
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workouts.router)
app.include_router(garmin.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Garmin Workout Editor API"}


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
