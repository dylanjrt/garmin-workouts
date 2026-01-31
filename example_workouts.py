"""10km Open Water Training Workouts.

Training plan for intermediate/advanced swimmer preparing for 10km race.
- Current base: 2-3x/week, 4.5km longest swim
- Target: 10km race in ~22 weeks
- Pace: ~1:45-2:00/100m

Equipment phases:
- Weeks 1-2: Pull buoy only
- Weeks 3+: Paddles, fins, and pull buoy
"""

from swim_workout import Stroke, SwimWorkoutBuilder, create_swim_workout


# =============================================================================
# ENDURANCE WORKOUTS - Build aerobic base
# =============================================================================

def endurance_2500() -> SwimWorkoutBuilder:
    """2500m steady endurance swim. Use for base building (weeks 1-6).

    Focus: Maintain consistent pace, work on breathing rhythm.
    Target pace: Your comfortable pace +5 sec/100m
    """
    return (
        create_swim_workout("Endurance 2500m")
        .warmup(300, Stroke.FREESTYLE, description="Easy, focus on long strokes")
        # Main set: continuous aerobic work
        .swim(400, Stroke.FREESTYLE, zone=2, description="Steady pace")
        .swim(200, Stroke.BACKSTROKE, zone=2, description="Active recovery")
        .swim(400, Stroke.FREESTYLE, zone=2)
        .swim(200, Stroke.BREASTSTROKE, zone=2, description="Open hips")
        .swim(400, Stroke.FREESTYLE, zone=2)
        .swim(200, Stroke.BACKSTROKE, zone=2)
        .swim(400, Stroke.FREESTYLE, zone=2)
        .cooldown(200, Stroke.FREESTYLE, description="Easy, stretch out")
    )


def endurance_3500() -> SwimWorkoutBuilder:
    """3500m endurance swim. Use for volume building (weeks 7+).

    Focus: Build mental stamina, practice pacing.
    Target pace: Race pace (1:50-2:00/100m)
    """
    return (
        create_swim_workout("Endurance 3500m")
        .warmup(400, Stroke.FREESTYLE, description="Build to steady pace")
        # Main set: 2400m broken into manageable chunks
        .repeat(6, lambda b: (
            b.swim(400, Stroke.FREESTYLE, zone=2, description="Hold steady pace")
            .rest(30)
        ))
        # Finish strong
        .swim(300, Stroke.FREESTYLE, zone=3, description="Negative split")
        .cooldown(200, Stroke.FREESTYLE)
    )


def long_steady_4000() -> SwimWorkoutBuilder:
    """4000m continuous-style swim. Use for peak phase (weeks 13+).

    Focus: Race simulation, minimal rest, nutrition timing.
    Target: Complete with consistent splits.
    """
    return (
        create_swim_workout("Long Steady 4000m")
        .warmup(400, Stroke.FREESTYLE, description="Gradual build")
        # Main set: 3200m with brief touch-and-go rests
        .repeat(8, lambda b: (
            b.swim(400, Stroke.FREESTYLE, zone=2, description="Race pace, count strokes")
            .rest(15)  # Brief rest, simulates feed stops
        ))
        .cooldown(400, Stroke.FREESTYLE, description="Easy, loosen up")
    )


# =============================================================================
# THRESHOLD / PACING WORKOUTS - Build speed endurance
# =============================================================================

def threshold_intervals() -> SwimWorkoutBuilder:
    """Threshold pace work. Builds speed endurance at race pace.

    Focus: Hold target pace under fatigue.
    Target pace: Your CSS pace (fastest sustainable for 1500m)
    """
    return (
        create_swim_workout("Threshold Intervals")
        .warmup(300, Stroke.FREESTYLE)
        .swim(200, Stroke.FREESTYLE, zone=2, description="Build to threshold")
        # Main set: 8x200m at threshold
        .repeat(8, lambda b: (
            b.swim(200, Stroke.FREESTYLE, zone=3, description="CSS pace")
            .rest(30)
        ))
        # Descending 100s to finish
        .repeat(4, lambda b: (
            b.swim(100, Stroke.FREESTYLE, zone=4, description="Descend 1-4")
            .rest(20)
        ))
        .cooldown(200, Stroke.FREESTYLE)
    )


def negative_split() -> SwimWorkoutBuilder:
    """Negative split training. Learn to finish faster than you start.

    Focus: Patience in first half, speed in second half.
    Critical skill for 10km racing.
    """
    return (
        create_swim_workout("Negative Split 3000m")
        .warmup(300, Stroke.FREESTYLE)
        # Set 1: 1000m building
        .swim(500, Stroke.FREESTYLE, zone=2, description="Comfortable")
        .swim(500, Stroke.FREESTYLE, zone=3, description="Faster than first 500")
        .rest(60)
        # Set 2: 1000m building more aggressively
        .swim(500, Stroke.FREESTYLE, zone=2, description="Reset, easy")
        .swim(500, Stroke.FREESTYLE, zone=4, description="Strong finish")
        .rest(60)
        # Set 3: 400m fast finish practice
        .swim(200, Stroke.FREESTYLE, zone=3)
        .swim(200, Stroke.FREESTYLE, zone=4, description="Race finish effort")
        .cooldown(200, Stroke.FREESTYLE)
    )


# =============================================================================
# SPEED WORKOUTS - Maintain/build top-end speed
# =============================================================================

def speed_sprints() -> SwimWorkoutBuilder:
    """Sprint workout. Maintains fast-twitch fitness and turnover.

    Focus: Maximum effort with full recovery.
    Use once per week to maintain speed.
    """
    return (
        create_swim_workout("Speed Sprints")
        .warmup(300, Stroke.FREESTYLE)
        .swim(200, Stroke.FREESTYLE, zone=2, description="Loosen up")
        # Sprint set 1: 50s all-out
        .repeat(8, lambda b: (
            b.swim(50, Stroke.FREESTYLE, zone=5, description="ALL OUT")
            .rest(45)  # Full recovery
        ))
        .swim(200, Stroke.FREESTYLE, zone=1, description="Easy recovery")
        # Sprint set 2: 25s max speed
        .repeat(8, lambda b: (
            b.swim(25, Stroke.FREESTYLE, zone=5, description="MAX SPEED")
            .rest(30)
        ))
        .cooldown(200, Stroke.FREESTYLE)
    )


def race_pace_200s() -> SwimWorkoutBuilder:
    """200m repeats at race pace. Bread and butter distance set.

    Focus: Consistent pacing, stroke efficiency.
    Target: All 200s within 5 seconds of each other.
    """
    return (
        create_swim_workout("Race Pace 200s")
        .warmup(400, Stroke.FREESTYLE)
        # Main set: 10x200
        .repeat(10, lambda b: (
            b.swim(200, Stroke.FREESTYLE, zone=3, description="Target pace")
            .rest(25)
        ))
        # Fast finish
        .swim(200, Stroke.FREESTYLE, zone=4, description="Faster than main set")
        .cooldown(200, Stroke.FREESTYLE)
    )


# =============================================================================
# TECHNIQUE & BUTTERFLY WORKOUTS
# =============================================================================

def technique_and_fly() -> SwimWorkoutBuilder:
    """Technique work with butterfly development.

    Focus: Stroke efficiency, butterfly endurance.
    Butterfly tip: "Power ON underwater, Power OFF in recovery"
    """
    return (
        create_swim_workout("Technique + Butterfly")
        .warmup(200, Stroke.FREESTYLE, description="Easy")
        .warmup(100, Stroke.BUTTERFLY, description="Easy fly, find rhythm")
        # Freestyle technique: catch and rotation
        .repeat(4, lambda b: (
            b.swim(50, Stroke.FREESTYLE, description="Closed fist drill")
            .swim(50, Stroke.FREESTYLE, description="Normal swim, feel the catch")
            .rest(15)
        ))
        # Butterfly building
        .repeat(4, lambda b: (
            b.swim(25, Stroke.BUTTERFLY, description="Relaxed, breathe every 2")
            .swim(75, Stroke.FREESTYLE, zone=2, description="Active recovery")
            .rest(20)
        ))
        # Fly endurance - longer reps
        .repeat(4, lambda b: (
            b.swim(50, Stroke.BUTTERFLY, description="Smooth, consistent")
            .swim(50, Stroke.FREESTYLE, zone=2)
            .rest(30)
        ))
        .cooldown(200, Stroke.FREESTYLE)
    )


def butterfly_focus() -> SwimWorkoutBuilder:
    """Butterfly-focused workout. Build fly endurance progressively.

    Focus: Rhythm, relaxation, breathing pattern.
    Key: Keep recovery relaxed, power only on the pull.
    """
    return (
        create_swim_workout("Butterfly Focus")
        .warmup(200, Stroke.FREESTYLE)
        .warmup(100, Stroke.BUTTERFLY, description="Easy, 2-stroke breathing")
        # Drill work
        .repeat(4, lambda b: (
            b.swim(25, Stroke.BUTTERFLY, description="One-arm fly, breathe to side")
            .swim(25, Stroke.BUTTERFLY, description="Full stroke, relaxed")
            .rest(20)
        ))
        # Building fly endurance
        .swim(50, Stroke.BUTTERFLY, description="Smooth")
        .swim(100, Stroke.FREESTYLE, zone=2)
        .swim(75, Stroke.BUTTERFLY, description="Hold form")
        .swim(100, Stroke.FREESTYLE, zone=2)
        .swim(100, Stroke.BUTTERFLY, description="100m fly - you got this!")
        .swim(100, Stroke.FREESTYLE, zone=2)
        # Fly/free alternating
        .repeat(6, lambda b: (
            b.swim(25, Stroke.BUTTERFLY, zone=3)
            .swim(75, Stroke.FREESTYLE, zone=2)
            .rest(15)
        ))
        .cooldown(200, Stroke.FREESTYLE)
    )


# =============================================================================
# EQUIPMENT WORKOUTS
# =============================================================================

def pull_endurance() -> SwimWorkoutBuilder:
    """Pull buoy endurance workout. Use for first 2 weeks (buoy only).

    Focus: Upper body endurance, high elbow catch.
    Keep equipment use under 50% of workout.
    """
    return (
        create_swim_workout("Pull Buoy Endurance")
        .warmup(300, Stroke.FREESTYLE, description="No equipment")
        # Pull set: build upper body endurance
        .repeat(5, lambda b: (
            b.swim(200, Stroke.FREESTYLE, zone=2, description="WITH PULL BUOY")
            .rest(20)
        ))
        # Swim without buoy - feel the difference
        .swim(400, Stroke.FREESTYLE, zone=2, description="NO BUOY - use your kick")
        # More pull work
        .repeat(4, lambda b: (
            b.swim(100, Stroke.FREESTYLE, zone=3, description="WITH PULL BUOY - faster")
            .rest(15)
        ))
        .cooldown(200, Stroke.FREESTYLE, description="No equipment")
    )


def equipment_power() -> SwimWorkoutBuilder:
    """Paddles and fins workout. Use after week 2 when you have equipment.

    Focus: Power development, speed adaptation.
    Caution: Don't overuse - shoulders need protection.
    """
    return (
        create_swim_workout("Equipment Power")
        .warmup(300, Stroke.FREESTYLE, description="No equipment")
        # Fins: build kick and body position
        .repeat(4, lambda b: (
            b.swim(100, Stroke.FREESTYLE, zone=2, description="WITH FINS - feel the speed")
            .rest(15)
        ))
        # Paddles + buoy: power pulling
        .repeat(6, lambda b: (
            b.swim(150, Stroke.FREESTYLE, zone=3, description="PADDLES + BUOY")
            .rest(20)
        ))
        # Speed adaptation: fins for turnover
        .repeat(6, lambda b: (
            b.swim(50, Stroke.FREESTYLE, zone=4, description="WITH FINS - fast turnover")
            .rest(30)
        ))
        # Swim normal to feel the adaptation
        .swim(400, Stroke.FREESTYLE, zone=2, description="NO EQUIPMENT")
        .cooldown(200, Stroke.FREESTYLE)
    )


def fins_fly_endurance() -> SwimWorkoutBuilder:
    """Butterfly with fins. Best way to build fly endurance and rhythm.

    Focus: Long, relaxed butterfly with fins support.
    Goal: Build to 200-400m continuous fly with fins.
    """
    return (
        create_swim_workout("Fins Butterfly Builder")
        .warmup(200, Stroke.FREESTYLE)
        .warmup(100, Stroke.BUTTERFLY, description="WITH FINS - easy")
        # Progressive fly with fins
        .swim(100, Stroke.BUTTERFLY, description="WITH FINS - find rhythm")
        .swim(100, Stroke.FREESTYLE, zone=2)
        .swim(150, Stroke.BUTTERFLY, description="WITH FINS - breathe every 2-3")
        .swim(100, Stroke.FREESTYLE, zone=2)
        .swim(200, Stroke.BUTTERFLY, description="WITH FINS - stay relaxed!")
        .swim(100, Stroke.FREESTYLE, zone=2)
        # Fly/free mix
        .repeat(4, lambda b: (
            b.swim(50, Stroke.BUTTERFLY, description="WITH FINS")
            .swim(50, Stroke.FREESTYLE, zone=2)
            .rest(20)
        ))
        # Finish with no-fins fly to feel the transfer
        .swim(50, Stroke.BUTTERFLY, description="NO FINS - feel stronger!")
        .cooldown(200, Stroke.FREESTYLE)
    )


# =============================================================================
# WORKOUT DICTIONARY
# =============================================================================

WORKOUTS = {
    # Endurance (use 2-3x per week)
    "endurance-2500": endurance_2500,
    "endurance-3500": endurance_3500,
    "long-4000": long_steady_4000,

    # Threshold/Pacing (use 1-2x per week)
    "threshold": threshold_intervals,
    "negative-split": negative_split,
    "race-pace": race_pace_200s,

    # Speed (use 1x per week)
    "speed": speed_sprints,

    # Technique & Butterfly (use 1-2x per week)
    "technique-fly": technique_and_fly,
    "butterfly": butterfly_focus,

    # Equipment workouts
    "pull": pull_endurance,          # Weeks 1-2: buoy only
    "equipment": equipment_power,     # Week 3+: paddles, fins, buoy
    "fins-fly": fins_fly_endurance,   # Week 3+: butterfly with fins
}


if __name__ == "__main__":
    import json

    print("=" * 70)
    print("10KM OPEN WATER TRAINING WORKOUTS")
    print("=" * 70)

    total_distance = 0
    for name, workout_fn in WORKOUTS.items():
        workout = workout_fn().build()
        duration = workout.estimatedDurationInSecs // 60
        # Rough distance estimate from duration (assuming ~2min/100m)
        distance = (workout.estimatedDurationInSecs / 120) * 100
        total_distance += distance
        print(f"  {name:20} | {workout.workoutName:30} | ~{duration:3} min | ~{distance:.0f}m")

    print("-" * 70)
    print(f"  Total if all workouts done: ~{total_distance/1000:.1f} km")
    print()
    print("SUGGESTED WEEKLY SCHEDULE:")
    print("-" * 70)
    print("  Weeks 1-2 (3 sessions, buoy only):")
    print("    Mon: endurance-2500 | Wed: pull | Fri: technique-fly")
    print()
    print("  Weeks 3-6 (4 sessions):")
    print("    Mon: endurance-2500 | Tue: threshold | Thu: equipment | Sat: butterfly")
    print()
    print("  Weeks 7-12 (4-5 sessions):")
    print("    Mon: endurance-3500 | Tue: speed | Wed: technique-fly")
    print("    Fri: race-pace | Sat: fins-fly")
    print()
    print("  Weeks 13-18 (4-5 sessions):")
    print("    Mon: long-4000 | Tue: threshold | Thu: negative-split")
    print("    Sat: butterfly or technique-fly")
    print()
    print("  Weeks 19-22 (Taper - reduce volume 30-40%):")
    print("    Keep intensity, reduce distance. Focus on feeling fresh.")
