"""Workout CRUD endpoints."""

from fastapi import APIRouter, HTTPException

from api.models import Workout, WorkoutCreate, WorkoutUpdate, WorkoutSummary
from api.services import workout_service

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.get("", response_model=list[WorkoutSummary])
async def list_workouts():
    """List all saved workouts."""
    return workout_service.list_workouts()


@router.get("/{workout_id}", response_model=Workout)
async def get_workout(workout_id: str):
    """Get a workout by ID."""
    workout = workout_service.get_workout(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.post("", response_model=Workout, status_code=201)
async def create_workout(data: WorkoutCreate):
    """Create a new workout."""
    return workout_service.create_workout(data)


@router.put("/{workout_id}", response_model=Workout)
async def update_workout(workout_id: str, data: WorkoutUpdate):
    """Update an existing workout."""
    workout = workout_service.update_workout(workout_id, data)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.delete("/{workout_id}", status_code=204)
async def delete_workout(workout_id: str):
    """Delete a workout."""
    if not workout_service.delete_workout(workout_id):
        raise HTTPException(status_code=404, detail="Workout not found")


@router.post("/{workout_id}/duplicate", response_model=Workout)
async def duplicate_workout(workout_id: str):
    """Duplicate a workout."""
    source = workout_service.get_workout(workout_id)

    if not source:
        raise HTTPException(status_code=404, detail="Workout not found")

    # Create a new workout with the same data
    return workout_service.create_workout(WorkoutCreate(
        name=f"{source.name} (copy)",
        pool_length=source.pool_length,
        steps=source.steps,
    ))
