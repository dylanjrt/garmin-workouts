#!/usr/bin/env python3
"""Upload swimming workouts to Garmin Connect.

Usage:
    # List available workouts
    uv run python upload.py --list

    # Upload a specific workout
    uv run python upload.py --workout endurance

    # Upload all workouts
    uv run python upload.py --all

    # Preview workout JSON without uploading
    uv run python upload.py --workout intervals --dry-run

    # Use saved credentials
    uv run python upload.py --workout quick --email you@example.com
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from garminconnect import Garmin

from example_workouts import WORKOUTS

# Load .env file from current directory
load_dotenv()

# Token storage directory
TOKEN_DIR = Path.home() / ".garmin_tokens"


def get_garmin_client(email: str | None = None, password: str | None = None) -> Garmin:
    """Get an authenticated Garmin client.

    Tries to use saved tokens first, falls back to email/password auth.
    """
    TOKEN_DIR.mkdir(exist_ok=True)
    token_file = TOKEN_DIR / "garth_tokens"

    # Try to resume from saved tokens
    if token_file.exists() and not (email and password):
        print("Resuming session from saved tokens...")
        try:
            client = Garmin()
            client.login(token_file)
            # Verify the session is still valid
            client.get_full_name()
            print(f"Logged in as: {client.get_full_name()}")
            return client
        except Exception as e:
            print(f"Saved session expired: {e}")
            print("Please provide credentials to re-authenticate.")

    # Get credentials
    if not email:
        email = os.environ.get("GARMIN_EMAIL") or input("Garmin email: ")
    if not password:
        password = os.environ.get("GARMIN_PASSWORD")
        if not password:
            import getpass
            password = getpass.getpass("Garmin password: ")

    # Login
    print("Logging in to Garmin Connect...")
    client = Garmin(email, password)
    client.login()

    # Save tokens for next time
    client.garth.dump(token_file)
    print(f"Session saved to {token_file}")
    print(f"Logged in as: {client.get_full_name()}")

    return client


def list_workouts():
    """Print available local workouts."""
    print("\nAvailable local workouts:")
    print("-" * 40)
    for name, workout_fn in WORKOUTS.items():
        workout = workout_fn().build()
        duration = workout.estimatedDurationInSecs // 60
        print(f"  {name:15} - {workout.workoutName} (~{duration} min)")
    print()


def list_remote_workouts(client: Garmin, limit: int = 20):
    """List workouts from Garmin Connect account."""
    print(f"\nWorkouts in your Garmin Connect account (limit {limit}):")
    print("-" * 60)

    workouts = client.get_workouts(0, limit)

    if not workouts:
        print("  No workouts found.")
        return

    for w in workouts:
        name = w.get("workoutName", "Unknown")
        workout_id = w.get("workoutId", "?")
        sport = w.get("sportType", {}).get("sportTypeKey", "?")
        print(f"  [{workout_id}] {name} ({sport})")

    print()


def preview_workout(name: str):
    """Preview a workout as JSON."""
    if name not in WORKOUTS:
        print(f"Unknown workout: {name}")
        print(f"Available: {', '.join(WORKOUTS.keys())}")
        return

    workout = WORKOUTS[name]().build()
    print(f"\nWorkout: {workout.workoutName}")
    print(f"Estimated duration: {workout.estimatedDurationInSecs // 60} minutes")
    print("\nJSON payload:")
    print(json.dumps(workout.to_dict(), indent=2))


def upload_workout(client: Garmin, name: str) -> bool:
    """Upload a single workout to Garmin Connect."""
    if name not in WORKOUTS:
        print(f"Unknown workout: {name}")
        return False

    workout = WORKOUTS[name]().build()
    print(f"\nUploading: {workout.workoutName}...")

    try:
        result = client.upload_workout(workout.to_dict())
        workout_id = result.get("workoutId", "unknown")
        print(f"  Success! Workout ID: {workout_id}")
        return True
    except Exception as e:
        print(f"  Failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Upload swimming workouts to Garmin Connect")
    parser.add_argument("--list", "-l", action="store_true", help="List available local workouts")
    parser.add_argument("--remote", "-r", action="store_true", help="List workouts in your Garmin account")
    parser.add_argument("--workout", "-w", type=str, help="Workout name to upload")
    parser.add_argument("--all", "-a", action="store_true", help="Upload all workouts")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Preview without uploading")
    parser.add_argument("--email", "-e", type=str, help="Garmin Connect email")
    parser.add_argument("--password", "-p", type=str, help="Garmin Connect password")

    args = parser.parse_args()

    # List local workouts
    if args.list:
        list_workouts()
        return

    # List remote workouts from Garmin account
    if args.remote:
        try:
            client = get_garmin_client(args.email, args.password)
            list_remote_workouts(client)
        except Exception as e:
            print(f"Failed to connect: {e}")
            sys.exit(1)
        return

    # Preview workout
    if args.workout and args.dry_run:
        preview_workout(args.workout)
        return

    # Need to upload something
    if not args.workout and not args.all:
        parser.print_help()
        print("\nExamples:")
        print("  uv run python upload.py --list              # List local workouts")
        print("  uv run python upload.py --remote            # List workouts in Garmin account")
        print("  uv run python upload.py --workout endurance # Upload a workout")
        print("  uv run python upload.py --workout intervals --dry-run")
        return

    # Get authenticated client
    try:
        client = get_garmin_client(args.email, args.password)
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

    # Upload workouts
    success_count = 0
    fail_count = 0

    if args.all:
        workouts_to_upload = list(WORKOUTS.keys())
    else:
        workouts_to_upload = [args.workout]

    for name in workouts_to_upload:
        if upload_workout(client, name):
            success_count += 1
        else:
            fail_count += 1

    print(f"\nDone: {success_count} uploaded, {fail_count} failed")


if __name__ == "__main__":
    main()
