export const StrokeType = {
  ANY: 1,
  BACKSTROKE: 2,
  BREASTSTROKE: 3,
  BUTTERFLY: 4,
  FREESTYLE: 5,
  MIXED: 6,
  IM: 7,
} as const;
export type StrokeType = (typeof StrokeType)[keyof typeof StrokeType];

export const StepType = {
  WARMUP: 1,
  COOLDOWN: 2,
  INTERVAL: 3,
  RECOVERY: 4,
  REST: 5,
  REPEAT: 6,
} as const;
export type StepType = (typeof StepType)[keyof typeof StepType];

export interface Equipment {
  pull_buoy: boolean;
  paddles: boolean;
  fins: boolean;
  kickboard: boolean;
  snorkel: boolean;
}

export interface WorkoutStep {
  id: string;
  step_type: StepType;
  stroke: StrokeType;
  distance_m: number;
  duration_seconds?: number;
  zone?: number;
  description?: string;
  equipment: Equipment;
}

export interface RepeatGroup {
  id: string;
  step_type: typeof StepType.REPEAT;
  iterations: number;
  steps: WorkoutStep[];
}

export type WorkoutItem = WorkoutStep | RepeatGroup;

export interface Workout {
  id: string;
  name: string;
  pool_length: number;
  target_distance?: number; // Optional target distance goal
  steps: WorkoutItem[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  total_distance: number;
  step_count: number;
}

export interface GarminStatus {
  authenticated: boolean;
  user_name?: string;
}

export interface UploadResult {
  success: boolean;
  workout_id?: string;
  error?: string;
}

export const STROKE_NAMES: Record<StrokeType, string> = {
  [StrokeType.ANY]: 'Any',
  [StrokeType.BACKSTROKE]: 'Backstroke',
  [StrokeType.BREASTSTROKE]: 'Breaststroke',
  [StrokeType.BUTTERFLY]: 'Butterfly',
  [StrokeType.FREESTYLE]: 'Freestyle',
  [StrokeType.MIXED]: 'Mixed',
  [StrokeType.IM]: 'IM',
};

export const STEP_TYPE_NAMES: Record<StepType, string> = {
  [StepType.WARMUP]: 'Warmup',
  [StepType.COOLDOWN]: 'Cooldown',
  [StepType.INTERVAL]: 'Interval',
  [StepType.RECOVERY]: 'Recovery',
  [StepType.REST]: 'Rest',
  [StepType.REPEAT]: 'Repeat',
};

export const STROKE_COLORS: Record<StrokeType, string> = {
  [StrokeType.ANY]: 'bg-gray-400',
  [StrokeType.BACKSTROKE]: 'bg-blue-400',
  [StrokeType.BREASTSTROKE]: 'bg-green-400',
  [StrokeType.BUTTERFLY]: 'bg-purple-400',
  [StrokeType.FREESTYLE]: 'bg-cyan-400',
  [StrokeType.MIXED]: 'bg-orange-400',
  [StrokeType.IM]: 'bg-pink-400',
};

export const STEP_TYPE_COLORS: Record<StepType, string> = {
  [StepType.WARMUP]: 'bg-yellow-500',
  [StepType.COOLDOWN]: 'bg-blue-500',
  [StepType.INTERVAL]: 'bg-red-500',
  [StepType.RECOVERY]: 'bg-green-500',
  [StepType.REST]: 'bg-gray-500',
  [StepType.REPEAT]: 'bg-indigo-500',
};

export function isRepeatGroup(item: WorkoutItem): item is RepeatGroup {
  return item.step_type === StepType.REPEAT;
}

export function createDefaultEquipment(): Equipment {
  return {
    pull_buoy: false,
    paddles: false,
    fins: false,
    kickboard: false,
    snorkel: false,
  };
}

export function createDefaultStep(id: string): WorkoutStep {
  // Default to 100 yards (91 meters)
  return {
    id,
    step_type: StepType.INTERVAL,
    stroke: StrokeType.FREESTYLE,
    distance_m: 91, // ~100 yards
    equipment: createDefaultEquipment(),
  };
}

export function calculateTotalDistance(steps: WorkoutItem[]): number {
  let total = 0;
  for (const step of steps) {
    if (isRepeatGroup(step)) {
      const groupDistance = step.steps.reduce((sum, s) => sum + s.distance_m, 0);
      total += groupDistance * step.iterations;
    } else if (step.step_type !== StepType.REST) {
      total += step.distance_m;
    }
  }
  return total;
}

export function findStepById(steps: WorkoutItem[], stepId: string): WorkoutStep | null {
  for (const item of steps) {
    if (isRepeatGroup(item)) {
      // Search inside repeat group
      const found = item.steps.find((s) => s.id === stepId);
      if (found) return found;
    } else if (item.id === stepId) {
      return item;
    }
  }
  return null;
}
