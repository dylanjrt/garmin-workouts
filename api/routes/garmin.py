"""Garmin Connect authentication and upload endpoints."""

from fastapi import APIRouter, HTTPException

from api.models import GarminLoginRequest, GarminStatus, UploadResult, WorkoutSummary
from api.services import garmin_service, workout_service

router = APIRouter(prefix="/api/garmin", tags=["garmin"])


@router.get("/status", response_model=GarminStatus)
async def get_status():
    """Check Garmin authentication status."""
    return garmin_service.get_status()


@router.post("/login", response_model=GarminStatus)
async def login(data: GarminLoginRequest):
    """Login to Garmin Connect."""
    status = garmin_service.login(data.email, data.password)
    if not status.authenticated:
        raise HTTPException(status_code=401, detail="Login failed")
    return status


@router.post("/logout", status_code=204)
async def logout():
    """Logout from Garmin Connect."""
    garmin_service.logout()


@router.post("/upload/{workout_id}", response_model=UploadResult)
async def upload_workout(workout_id: str):
    """Upload a workout to Garmin Connect (replaces old version)."""
    workout = workout_service.get_workout(workout_id)

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    old_garmin_id = workout_id  # The current ID is the old Garmin workout ID

    # Convert to Garmin format and upload
    try:
        garmin_workout = workout_service.workout_to_garmin_dict(workout)
        print(f"Converted workout to Garmin format: {workout.name}")
    except Exception as e:
        print(f"Error converting workout: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Conversion error: {e}")

    result = garmin_service.upload_workout(garmin_workout)
    print(f"Upload result: {result}")

    if not result.success:
        raise HTTPException(status_code=400, detail=result.error)

    # Successfully uploaded - now delete the old workout from Garmin
    if old_garmin_id and result.workout_id and old_garmin_id != result.workout_id:
        print(f"Deleting old workout {old_garmin_id} from Garmin...")
        garmin_service.delete_workout_from_garmin(old_garmin_id)

        # Update local storage: delete old file, save with new ID
        workout_service.replace_workout_id(old_garmin_id, result.workout_id)

    return result


@router.post("/sync", response_model=list[WorkoutSummary])
async def sync_workouts():
    """Sync swimming workouts from Garmin Connect."""
    status = garmin_service.get_status()
    if not status.authenticated:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Fetch workouts from Garmin
    garmin_workouts = garmin_service.fetch_workouts(limit=50)

    if not garmin_workouts:
        return []

    # Fetch full details for each workout and sync locally
    full_workouts = []
    for w in garmin_workouts:
        workout_id = str(w.get("workoutId"))
        details = garmin_service.fetch_workout_details(workout_id)
        if details:
            full_workouts.append(details)

    # Sync to local storage
    synced = workout_service.sync_from_garmin(full_workouts)

    return [
        WorkoutSummary(
            id=w.id,
            name=w.name,
            total_distance=w.total_distance,
            step_count=len(w.steps),
        )
        for w in synced
    ]
