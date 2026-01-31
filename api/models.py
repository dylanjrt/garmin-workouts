"""Pydantic models for API requests and responses."""

from enum import IntEnum
from pydantic import BaseModel, Field


class StrokeType(IntEnum):
    """Swimming stroke types."""
    ANY = 1
    BACKSTROKE = 2
    BREASTSTROKE = 3
    BUTTERFLY = 4
    FREESTYLE = 5
    MIXED = 6
    IM = 7


class StepType(IntEnum):
    """Workout step types."""
    WARMUP = 1
    COOLDOWN = 2
    INTERVAL = 3
    RECOVERY = 4
    REST = 5
    REPEAT = 6


class Equipment(BaseModel):
    """Equipment that can be used in a step."""
    pull_buoy: bool = False
    paddles: bool = False
    fins: bool = False
    kickboard: bool = False
    snorkel: bool = False


class WorkoutStep(BaseModel):
    """A single workout step."""
    id: str
    step_type: StepType
    stroke: StrokeType = StrokeType.FREESTYLE
    distance_m: int = Field(ge=0, default=100)
    duration_seconds: int | None = None  # For rest steps
    zone: int | None = Field(ge=1, le=5, default=None)
    description: str | None = None
    equipment: Equipment = Field(default_factory=Equipment)


class RepeatGroup(BaseModel):
    """A group of steps to repeat."""
    id: str
    step_type: StepType = StepType.REPEAT
    iterations: int = Field(ge=1, default=1)
    steps: list[WorkoutStep] = Field(default_factory=list)


class Workout(BaseModel):
    """A complete workout."""
    id: str
    name: str = Field(max_length=80)
    pool_length: float = 25.0
    steps: list[WorkoutStep | RepeatGroup] = Field(default_factory=list)

    @property
    def total_distance(self) -> int:
        """Calculate total workout distance."""
        total = 0
        for step in self.steps:
            if isinstance(step, RepeatGroup):
                group_distance = sum(s.distance_m for s in step.steps)
                total += group_distance * step.iterations
            elif step.step_type != StepType.REST:
                total += step.distance_m
        return total


class WorkoutCreate(BaseModel):
    """Request body for creating a workout."""
    name: str = Field(max_length=80)
    pool_length: float = 25.0
    steps: list[WorkoutStep | RepeatGroup] = Field(default_factory=list)


class WorkoutUpdate(BaseModel):
    """Request body for updating a workout."""
    name: str | None = None
    pool_length: float | None = None
    steps: list[WorkoutStep | RepeatGroup] | None = None


class WorkoutSummary(BaseModel):
    """Summary of a workout for list views."""
    id: str
    name: str
    total_distance: int
    step_count: int


class GarminLoginRequest(BaseModel):
    """Request body for Garmin login."""
    email: str
    password: str


class GarminStatus(BaseModel):
    """Garmin authentication status."""
    authenticated: bool
    user_name: str | None = None


class UploadResult(BaseModel):
    """Result of uploading to Garmin."""
    success: bool
    workout_id: str | None = None
    error: str | None = None
