"""Garmin Connect authentication and upload service."""

from pathlib import Path
from typing import Any
from garminconnect import Garmin

from api.models import GarminStatus, UploadResult

# Token storage directory
TOKEN_DIR = Path.home() / ".garmin_tokens"

# Global client instance (for simplicity in this demo)
_garmin_client: Garmin | None = None


def get_client() -> Garmin | None:
    """Get the authenticated Garmin client."""
    global _garmin_client
    if not _garmin_client:
        get_status()  # This will try to restore the session
    return _garmin_client


def get_status() -> GarminStatus:
    """Check if we have a valid Garmin session."""
    global _garmin_client

    TOKEN_DIR.mkdir(exist_ok=True)
    token_file = TOKEN_DIR / "garth_tokens"

    # If we have an existing client, verify it's still valid
    if _garmin_client:
        try:
            name = _garmin_client.get_full_name()
            return GarminStatus(authenticated=True, user_name=name)
        except Exception:
            _garmin_client = None

    # Try to resume from saved tokens
    if token_file.exists():
        try:
            client = Garmin()
            client.login(str(token_file))  # Convert Path to string
            name = client.get_full_name()
            _garmin_client = client
            return GarminStatus(authenticated=True, user_name=name)
        except Exception as e:
            print(f"Failed to resume session: {e}")
            pass

    return GarminStatus(authenticated=False)


def login(email: str, password: str) -> GarminStatus:
    """Login to Garmin Connect."""
    global _garmin_client

    TOKEN_DIR.mkdir(exist_ok=True)
    token_file = TOKEN_DIR / "garth_tokens"

    try:
        client = Garmin(email, password)
        client.login()

        # Save tokens for next time
        client.garth.dump(str(token_file))

        name = client.get_full_name()
        _garmin_client = client
        return GarminStatus(authenticated=True, user_name=name)
    except Exception as e:
        print(f"Login error: {e}")
        return GarminStatus(authenticated=False, user_name=str(e))


def upload_workout(workout_dict: dict) -> UploadResult:
    """Upload a workout to Garmin Connect."""
    global _garmin_client

    if not _garmin_client:
        # Try to get a client from saved tokens
        status = get_status()
        if not status.authenticated:
            return UploadResult(success=False, error="Not authenticated")

    try:
        # Use swimming-specific upload method
        result = _garmin_client.upload_swimming_workout(workout_dict)
        workout_id = result.get("workoutId", "unknown")
        return UploadResult(success=True, workout_id=str(workout_id))
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return UploadResult(success=False, error=str(e))


def logout() -> None:
    """Clear the current session."""
    global _garmin_client
    _garmin_client = None

    token_file = TOKEN_DIR / "garth_tokens"
    if token_file.exists():
        token_file.unlink()


def fetch_workouts(limit: int = 50) -> list[dict[str, Any]]:
    """Fetch workouts from Garmin Connect."""
    client = get_client()
    if not client:
        print("No Garmin client available")
        return []

    try:
        workouts = client.get_workouts(0, limit)
        print(f"Fetched {len(workouts)} total workouts from Garmin")

        # Log all sport types for debugging
        sport_types = set()
        for w in workouts:
            sport_key = w.get("sportType", {}).get("sportTypeKey", "unknown")
            sport_types.add(sport_key)
        print(f"Sport types found: {sport_types}")

        # Filter to only swimming workouts
        swim_workouts = [
            w for w in workouts
            if w.get("sportType", {}).get("sportTypeKey") in ("lap_swimming", "open_water_swimming", "swimming")
        ]
        print(f"Found {len(swim_workouts)} swimming workouts")
        return swim_workouts
    except Exception as e:
        print(f"Error fetching workouts: {e}")
        import traceback
        traceback.print_exc()
        return []


def delete_workout_from_garmin(workout_id: str) -> bool:
    """Delete a workout from Garmin Connect."""
    client = get_client()
    if not client:
        print("No Garmin client for delete")
        return False

    try:
        # Use the garth client to make a DELETE request
        url = f"/workout-service/workout/{workout_id}"
        client.garth.delete("connectapi", url, api=True)
        print(f"Deleted workout {workout_id} from Garmin")
        return True
    except Exception as e:
        print(f"Error deleting workout {workout_id}: {e}")
        return False


def fetch_workout_details(workout_id: str) -> dict[str, Any] | None:
    """Fetch full workout details from Garmin Connect."""
    client = get_client()
    if not client:
        return None

    try:
        # Get the full workout details
        workout = client.get_workout_by_id(workout_id)
        return workout
    except Exception as e:
        print(f"Error fetching workout {workout_id}: {e}")
        return None
