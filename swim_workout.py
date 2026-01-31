"""Swimming workout builder for Garmin Connect.

Provides a clean API for creating swimming workouts with strokes, distances,
and repeat groups that can be uploaded to Garmin Connect.
"""

from enum import IntEnum
from typing import Any

from garminconnect.workout import (
    ExecutableStep,
    RepeatGroup,
    SwimmingWorkout,
    WorkoutSegment,
)


class Stroke(IntEnum):
    """Swimming stroke types as defined by Garmin."""
    ANY = 1
    BACKSTROKE = 2
    BREASTSTROKE = 3
    BUTTERFLY = 4
    FREESTYLE = 5
    MIXED = 6
    IM = 7  # Individual Medley


class StepType(IntEnum):
    """Workout step types."""
    WARMUP = 1
    COOLDOWN = 2
    INTERVAL = 3
    RECOVERY = 4
    REST = 5
    REPEAT = 6


STROKE_KEYS = {
    Stroke.ANY: "any_stroke",
    Stroke.BACKSTROKE: "backstroke",
    Stroke.BREASTSTROKE: "breaststroke",
    Stroke.BUTTERFLY: "butterfly",
    Stroke.FREESTYLE: "freestyle",
    Stroke.MIXED: "mixed",
    Stroke.IM: "im",
}

STEP_TYPE_KEYS = {
    StepType.WARMUP: "warmup",
    StepType.COOLDOWN: "cooldown",
    StepType.INTERVAL: "interval",
    StepType.RECOVERY: "recovery",
    StepType.REST: "rest",
    StepType.REPEAT: "repeat",
}


class SwimWorkoutBuilder:
    """Builder for creating swimming workouts."""

    def __init__(self, name: str, pool_length: float = 25.0):
        """Initialize a swimming workout.

        Args:
            name: Workout name (max 80 chars)
            pool_length: Pool length in meters (default 25m)
        """
        self.name = name[:80]
        self.pool_length = pool_length
        self.steps: list[ExecutableStep | RepeatGroup] = []
        self._step_order = 0
        self._estimated_duration = 0  # seconds

    def _next_order(self) -> int:
        self._step_order += 1
        return self._step_order

    def _stroke_type_dict(self, stroke: Stroke) -> dict[str, Any]:
        return {
            "strokeTypeId": stroke.value,
            "strokeTypeKey": STROKE_KEYS[stroke],
            "displayOrder": 1,
        }

    def _step_type_dict(self, step_type: StepType) -> dict[str, Any]:
        return {
            "stepTypeId": step_type.value,
            "stepTypeKey": STEP_TYPE_KEYS[step_type],
            "displayOrder": step_type.value,
        }

    def _distance_condition(self) -> dict[str, Any]:
        return {
            "conditionTypeId": 3,
            "conditionTypeKey": "distance",
            "displayOrder": 2,
            "displayable": True,
        }

    def _time_condition(self) -> dict[str, Any]:
        return {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "displayOrder": 2,
            "displayable": True,
        }

    def _rest_condition(self) -> dict[str, Any]:
        return {
            "conditionTypeId": 8,
            "conditionTypeKey": "fixed.rest",
            "displayOrder": 8,
            "displayable": True,
        }

    def _lap_button_condition(self) -> dict[str, Any]:
        return {
            "conditionTypeId": 1,
            "conditionTypeKey": "lap.button",
            "displayOrder": 1,
            "displayable": True,
        }

    def _no_target(self) -> dict[str, Any]:
        return {
            "workoutTargetTypeId": 1,
            "workoutTargetTypeKey": "no.target",
            "displayOrder": 1,
        }

    def _hr_zone_target(self, zone: int) -> dict[str, Any]:
        return {
            "workoutTargetTypeId": 4,
            "workoutTargetTypeKey": "heart.rate.zone",
            "displayOrder": 1,
        }

    def _distance_unit(self) -> dict[str, Any]:
        return {
            "unitId": 1,
            "unitKey": "meter",
            "factor": 100.0,
        }

    def _estimate_swim_time(self, distance_m: float) -> int:
        """Estimate swim time in seconds (assumes ~2min/100m pace)."""
        return int(distance_m * 1.2)

    def warmup(
        self,
        distance_m: int,
        stroke: Stroke = Stroke.FREESTYLE,
        description: str | None = None,
    ) -> "SwimWorkoutBuilder":
        """Add a warmup swim.

        Args:
            distance_m: Distance in meters
            stroke: Stroke type (default freestyle)
            description: Optional step description
        """
        self._estimated_duration += self._estimate_swim_time(distance_m)
        step = ExecutableStep(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.WARMUP),
            endCondition=self._distance_condition(),
            endConditionValue=float(distance_m),
            preferredEndConditionUnit=self._distance_unit(),
            targetType=self._no_target(),
            strokeType=self._stroke_type_dict(stroke),
            description=description,
        )
        self.steps.append(step)
        return self

    def cooldown(
        self,
        distance_m: int,
        stroke: Stroke = Stroke.FREESTYLE,
        description: str | None = None,
    ) -> "SwimWorkoutBuilder":
        """Add a cooldown swim.

        Args:
            distance_m: Distance in meters
            stroke: Stroke type (default freestyle)
            description: Optional step description
        """
        self._estimated_duration += self._estimate_swim_time(distance_m)
        step = ExecutableStep(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.COOLDOWN),
            endCondition=self._distance_condition(),
            endConditionValue=float(distance_m),
            preferredEndConditionUnit=self._distance_unit(),
            targetType=self._no_target(),
            strokeType=self._stroke_type_dict(stroke),
            description=description,
        )
        self.steps.append(step)
        return self

    def swim(
        self,
        distance_m: int,
        stroke: Stroke = Stroke.FREESTYLE,
        zone: int | None = None,
        description: str | None = None,
    ) -> "SwimWorkoutBuilder":
        """Add an interval/main set swim.

        Args:
            distance_m: Distance in meters
            stroke: Stroke type (default freestyle)
            zone: Optional heart rate zone (1-5)
            description: Optional step description
        """
        self._estimated_duration += self._estimate_swim_time(distance_m)

        target = self._hr_zone_target(zone) if zone else self._no_target()

        step = ExecutableStep(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.INTERVAL),
            endCondition=self._distance_condition(),
            endConditionValue=float(distance_m),
            preferredEndConditionUnit=self._distance_unit(),
            targetType=target,
            strokeType=self._stroke_type_dict(stroke),
            description=description,
            **({"zoneNumber": zone} if zone else {}),
        )
        self.steps.append(step)
        return self

    def rest(self, seconds: int, description: str | None = None) -> "SwimWorkoutBuilder":
        """Add a timed rest interval.

        Args:
            seconds: Rest duration in seconds
            description: Optional step description
        """
        self._estimated_duration += seconds
        step = ExecutableStep(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.REST),
            endCondition=self._rest_condition(),
            endConditionValue=float(seconds),
            targetType=self._no_target(),
            description=description,
        )
        self.steps.append(step)
        return self

    def rest_until_button(self, description: str | None = None) -> "SwimWorkoutBuilder":
        """Add a rest until lap button is pressed.

        Args:
            description: Optional step description
        """
        self._estimated_duration += 30  # Estimate 30s rest
        step = ExecutableStep(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.REST),
            endCondition=self._lap_button_condition(),
            targetType=self._no_target(),
            description=description,
        )
        self.steps.append(step)
        return self

    def repeat(
        self,
        times: int,
        steps_fn: "callable",
    ) -> "SwimWorkoutBuilder":
        """Add a repeat group.

        Args:
            times: Number of repetitions
            steps_fn: A function that takes a SwimWorkoutBuilder and adds steps to it

        Example:
            builder.repeat(4, lambda b: b.swim(100, Stroke.FREESTYLE).rest(20))
        """
        # Create a temporary builder to capture the repeat steps
        inner_builder = SwimWorkoutBuilder(self.name, self.pool_length)
        inner_builder._step_order = 0  # Reset for inner steps
        steps_fn(inner_builder)

        # Renumber inner steps starting from 1
        for i, step in enumerate(inner_builder.steps, 1):
            step.stepOrder = i

        self._estimated_duration += inner_builder._estimated_duration * times

        repeat_group = RepeatGroup(
            stepOrder=self._next_order(),
            stepType=self._step_type_dict(StepType.REPEAT),
            numberOfIterations=times,
            workoutSteps=inner_builder.steps,
            endCondition={
                "conditionTypeId": 7,
                "conditionTypeKey": "iterations",
                "displayOrder": 7,
                "displayable": False,
            },
            endConditionValue=float(times),
            smartRepeat=False,
        )
        self.steps.append(repeat_group)
        return self

    def build(self) -> SwimmingWorkout:
        """Build the final SwimmingWorkout object."""
        sport_type = {
            "sportTypeId": 4,  # Swimming
            "sportTypeKey": "lap_swimming",
            "displayOrder": 1,
        }

        segment = WorkoutSegment(
            segmentOrder=1,
            sportType=sport_type,
            workoutSteps=self.steps,
        )

        workout = SwimmingWorkout(
            workoutName=self.name,
            sportType=sport_type,
            estimatedDurationInSecs=self._estimated_duration,
            workoutSegments=[segment],
            poolLength=self.pool_length,
            poolLengthUnit=self._distance_unit(),
        )

        return workout

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API upload."""
        return self.build().to_dict()


# Convenience function for quick workout creation
def create_swim_workout(name: str, pool_length: float = 25.0) -> SwimWorkoutBuilder:
    """Create a new swimming workout builder.

    Args:
        name: Workout name
        pool_length: Pool length in meters (default 25m)

    Returns:
        SwimWorkoutBuilder instance

    Example:
        workout = (
            create_swim_workout("Morning Swim")
            .warmup(200, Stroke.FREESTYLE)
            .repeat(4, lambda b: (
                b.swim(100, Stroke.FREESTYLE, zone=2)
                .rest(20)
            ))
            .cooldown(100, Stroke.FREESTYLE)
            .build()
        )
    """
    return SwimWorkoutBuilder(name, pool_length)
