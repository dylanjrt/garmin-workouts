"""Workout storage and conversion service."""

import json
import uuid
from pathlib import Path
from typing import Any

from api.models import (
    Equipment,
    RepeatGroup,
    StepType,
    StrokeType,
    Workout,
    WorkoutCreate,
    WorkoutStep,
    WorkoutSummary,
    WorkoutUpdate,
)
from swim_workout import (
    Stroke,
    StepType as SwimStepType,
    SwimWorkoutBuilder,
)
from example_workouts import WORKOUTS

# Storage directory
WORKOUT_DIR = Path.home() / ".garmin_workouts"


def ensure_storage_dir() -> None:
    """Ensure the workout storage directory exists."""
    WORKOUT_DIR.mkdir(exist_ok=True)


def initialize_workouts() -> None:
    """Initialize workouts from templates if storage is empty."""
    ensure_storage_dir()

    # Check if we already have workouts
    existing = list(WORKOUT_DIR.glob("*.json"))
    if existing:
        return  # Already initialized

    # Seed from templates
    for name, workout_fn in WORKOUTS.items():
        builder = workout_fn()
        workout = builder_to_workout(name, builder)  # Use template name as ID
        path = get_workout_path(workout.id)
        path.write_text(json.dumps(workout.model_dump(), indent=2))

    print(f"Initialized {len(WORKOUTS)} workouts from templates")


def get_workout_path(workout_id: str) -> Path:
    """Get the file path for a workout."""
    return WORKOUT_DIR / f"{workout_id}.json"


def list_workouts() -> list[WorkoutSummary]:
    """List all saved workouts."""
    ensure_storage_dir()
    workouts = []
    for path in WORKOUT_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text())
            workout = Workout(**data)
            workouts.append(WorkoutSummary(
                id=workout.id,
                name=workout.name,
                total_distance=workout.total_distance,
                step_count=len(workout.steps),
            ))
        except Exception:
            continue
    return workouts


def get_workout(workout_id: str) -> Workout | None:
    """Get a workout by ID."""
    path = get_workout_path(workout_id)
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    return Workout(**data)


def create_workout(data: WorkoutCreate) -> Workout:
    """Create a new workout."""
    ensure_storage_dir()
    workout = Workout(
        id=str(uuid.uuid4()),
        name=data.name,
        pool_length=data.pool_length,
        steps=data.steps,
    )
    path = get_workout_path(workout.id)
    path.write_text(json.dumps(workout.model_dump(), indent=2))
    return workout


def update_workout(workout_id: str, data: WorkoutUpdate) -> Workout | None:
    """Update an existing workout."""
    workout = get_workout(workout_id)
    if not workout:
        return None

    if data.name is not None:
        workout.name = data.name
    if data.pool_length is not None:
        workout.pool_length = data.pool_length
    if data.steps is not None:
        workout.steps = data.steps

    path = get_workout_path(workout_id)
    path.write_text(json.dumps(workout.model_dump(), indent=2))
    return workout


def delete_workout(workout_id: str) -> bool:
    """Delete a workout."""
    path = get_workout_path(workout_id)
    if path.exists():
        path.unlink()
        return True
    return False


def replace_workout_id(old_id: str, new_id: str) -> bool:
    """Replace a workout's ID (after uploading to Garmin)."""
    workout = get_workout(old_id)
    if not workout:
        return False

    # Update the ID
    workout.id = new_id

    # Save with new ID
    new_path = get_workout_path(new_id)
    new_path.write_text(json.dumps(workout.model_dump(), indent=2))

    # Delete old file
    old_path = get_workout_path(old_id)
    if old_path.exists():
        old_path.unlink()

    print(f"Replaced workout ID {old_id} -> {new_id}")
    return True


def get_templates() -> list[WorkoutSummary]:
    """Get predefined workout templates from example_workouts.py."""
    templates = []
    for name, workout_fn in WORKOUTS.items():
        builder = workout_fn()
        workout = builder.build()
        # Estimate distance from duration
        distance = int((workout.estimatedDurationInSecs / 120) * 100)
        templates.append(WorkoutSummary(
            id=f"template:{name}",
            name=workout.workoutName,
            total_distance=distance,
            step_count=len(builder.steps),
        ))
    return templates


def get_template(template_id: str) -> Workout | None:
    """Get a template workout and convert to our Workout model."""
    if not template_id.startswith("template:"):
        return None

    name = template_id[9:]  # Remove "template:" prefix
    if name not in WORKOUTS:
        return None

    builder = WORKOUTS[name]()
    return builder_to_workout(template_id, builder)


def builder_to_workout(workout_id: str, builder: SwimWorkoutBuilder) -> Workout:
    """Convert a SwimWorkoutBuilder to our Workout model."""
    steps = []
    step_counter = 0

    def convert_step(step: Any) -> WorkoutStep | RepeatGroup:
        nonlocal step_counter
        step_counter += 1
        step_id = f"step-{step_counter}"

        # Check if it's a repeat group
        if hasattr(step, 'numberOfIterations'):
            inner_steps = []
            for inner in step.workoutSteps:
                inner_steps.append(convert_step(inner))
            return RepeatGroup(
                id=step_id,
                iterations=step.numberOfIterations,
                steps=inner_steps,
            )

        # Regular step
        step_type_id = step.stepType.get("stepTypeId", 3)
        stroke_id = step.strokeType.get("strokeTypeId", 5) if hasattr(step, 'strokeType') and step.strokeType else 5

        return WorkoutStep(
            id=step_id,
            step_type=StepType(step_type_id),
            stroke=StrokeType(stroke_id),
            distance_m=int(step.endConditionValue) if step.endConditionValue else 0,
            duration_seconds=int(step.endConditionValue) if step_type_id == 5 else None,
            zone=getattr(step, 'zoneNumber', None),
            description=step.description,
            equipment=Equipment(),
        )

    for step in builder.steps:
        steps.append(convert_step(step))

    return Workout(
        id=workout_id,
        name=builder.name,
        pool_length=builder.pool_length,
        steps=steps,
    )


def garmin_to_workout(garmin_workout: dict[str, Any]) -> Workout:
    """Convert a Garmin workout dict to our Workout model."""
    workout_id = str(garmin_workout.get("workoutId", ""))
    name = garmin_workout.get("workoutName", "Unnamed Workout")
    pool_length = garmin_workout.get("poolLength", 25.0)

    steps = []
    step_counter = 0

    # Get steps from the first segment
    segments = garmin_workout.get("workoutSegments", [])
    if segments:
        garmin_steps = segments[0].get("workoutSteps", [])

        def convert_garmin_step(g_step: dict) -> WorkoutStep | RepeatGroup:
            nonlocal step_counter
            step_counter += 1
            step_id = f"step-{step_counter}"

            step_type_id = g_step.get("stepType", {}).get("stepTypeId", 3)

            # Check for repeat group
            if step_type_id == 6:  # REPEAT
                inner_steps = []
                for inner in g_step.get("workoutSteps", []):
                    inner_steps.append(convert_garmin_step(inner))
                return RepeatGroup(
                    id=step_id,
                    iterations=g_step.get("numberOfIterations", 1),
                    steps=inner_steps,
                )

            # Regular step
            stroke_type = g_step.get("strokeType", {})
            stroke_id = stroke_type.get("strokeTypeId", 5) if stroke_type else 5
            # Handle invalid stroke IDs (0 or out of range) - default to freestyle
            if stroke_id < 1 or stroke_id > 7:
                stroke_id = 5  # FREESTYLE

            # Handle invalid step type IDs - default to interval
            if step_type_id < 1 or step_type_id > 6:
                step_type_id = 3  # INTERVAL

            end_condition = g_step.get("endCondition", {}).get("conditionTypeKey", "distance")
            end_value = g_step.get("endConditionValue", 100)

            return WorkoutStep(
                id=step_id,
                step_type=StepType(step_type_id),
                stroke=StrokeType(stroke_id),
                distance_m=int(end_value) if end_condition == "distance" else 0,
                duration_seconds=int(end_value) if end_condition in ("time", "fixed.rest") else None,
                zone=g_step.get("zoneNumber"),
                description=g_step.get("description"),
                equipment=Equipment(),
            )

        for g_step in garmin_steps:
            steps.append(convert_garmin_step(g_step))

    return Workout(
        id=workout_id,
        name=name,
        pool_length=pool_length,
        steps=steps,
    )


def sync_from_garmin(garmin_workouts: list[dict[str, Any]]) -> list[Workout]:
    """Sync workouts from Garmin Connect to local storage."""
    ensure_storage_dir()
    synced = []

    for g_workout in garmin_workouts:
        workout = garmin_to_workout(g_workout)
        path = get_workout_path(workout.id)
        path.write_text(json.dumps(workout.model_dump(), indent=2))
        synced.append(workout)

    return synced


def workout_to_garmin_dict(workout: Workout) -> dict[str, Any]:
    """Convert our Workout model to Garmin API format."""
    stroke_map = {
        StrokeType.ANY: Stroke.ANY,
        StrokeType.BACKSTROKE: Stroke.BACKSTROKE,
        StrokeType.BREASTSTROKE: Stroke.BREASTSTROKE,
        StrokeType.BUTTERFLY: Stroke.BUTTERFLY,
        StrokeType.FREESTYLE: Stroke.FREESTYLE,
        StrokeType.MIXED: Stroke.MIXED,
        StrokeType.IM: Stroke.IM,
    }

    step_type_map = {
        StepType.WARMUP: SwimStepType.WARMUP,
        StepType.COOLDOWN: SwimStepType.COOLDOWN,
        StepType.INTERVAL: SwimStepType.INTERVAL,
        StepType.RECOVERY: SwimStepType.RECOVERY,
        StepType.REST: SwimStepType.REST,
    }

    builder = SwimWorkoutBuilder(workout.name, workout.pool_length)

    def add_step(b: SwimWorkoutBuilder, step: WorkoutStep) -> None:
        stroke = stroke_map.get(step.stroke, Stroke.FREESTYLE)
        desc = step.description

        # Add equipment info to description
        eq = step.equipment
        eq_parts = []
        if eq.pull_buoy:
            eq_parts.append("PULL BUOY")
        if eq.paddles:
            eq_parts.append("PADDLES")
        if eq.fins:
            eq_parts.append("FINS")
        if eq.kickboard:
            eq_parts.append("KICKBOARD")
        if eq.snorkel:
            eq_parts.append("SNORKEL")
        if eq_parts:
            eq_str = " + ".join(eq_parts)
            desc = f"[{eq_str}] {desc}" if desc else f"[{eq_str}]"

        if step.step_type == StepType.WARMUP:
            b.warmup(step.distance_m, stroke, desc)
        elif step.step_type == StepType.COOLDOWN:
            b.cooldown(step.distance_m, stroke, desc)
        elif step.step_type == StepType.REST:
            b.rest(step.duration_seconds or 30, desc)
        else:
            b.swim(step.distance_m, stroke, step.zone, desc)

    for step in workout.steps:
        if isinstance(step, RepeatGroup):
            def make_repeat_fn(repeat_steps: list[WorkoutStep]):
                def fn(b: SwimWorkoutBuilder):
                    for s in repeat_steps:
                        add_step(b, s)
                return fn
            builder.repeat(step.iterations, make_repeat_fn(step.steps))
        else:
            add_step(builder, step)

    return builder.build()  # Return SwimmingWorkout object, not dict
