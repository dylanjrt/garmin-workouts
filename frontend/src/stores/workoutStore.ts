import { create } from 'zustand';
import type { Workout, WorkoutStep, Equipment } from '../types/workout';
import { createDefaultStep, isRepeatGroup } from '../types/workout';

type DistanceUnit = 'm' | 'yd';

interface WorkoutState {
  workout: Workout | null;
  selectedStepId: string | null;
  isDirty: boolean;
  distanceUnit: DistanceUnit;

  // Actions
  setWorkout: (workout: Workout | null) => void;
  setSelectedStep: (stepId: string | null) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  updateWorkoutName: (name: string) => void;
  updatePoolLength: (length: number) => void;
  updateTargetDistance: (distance: number | undefined) => void;

  // Step operations
  addStep: (afterStepId?: string) => void;
  addRepeatGroup: (iterations?: number) => void;
  addStepToRepeat: (groupId: string) => void;
  updateRepeatIterations: (groupId: string, iterations: number) => void;
  removeStep: (stepId: string) => void;
  updateStep: (stepId: string, updates: Partial<WorkoutStep>) => void;
  updateStepDistance: (stepId: string, distance: number) => void;
  updateStepEquipment: (stepId: string, equipment: Partial<Equipment>) => void;
  reorderSteps: (fromIndex: number, toIndex: number) => void;

  // Mark as saved
  markSaved: () => void;
}

let stepCounter = 0;
function generateStepId(): string {
  return `step-${Date.now()}-${++stepCounter}`;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  workout: null,
  selectedStepId: null,
  isDirty: false,
  distanceUnit: 'yd', // Default to yards

  setWorkout: (workout) => set({ workout, isDirty: false, selectedStepId: null }),

  setSelectedStep: (stepId) => set({ selectedStepId: stepId }),

  setDistanceUnit: (unit) => set({ distanceUnit: unit }),

  updateWorkoutName: (name) =>
    set((state) => {
      if (!state.workout) return state;
      return {
        workout: { ...state.workout, name },
        isDirty: true,
      };
    }),

  updatePoolLength: (length) =>
    set((state) => {
      if (!state.workout) return state;
      return {
        workout: { ...state.workout, pool_length: length },
        isDirty: true,
      };
    }),

  updateTargetDistance: (distance) =>
    set((state) => {
      if (!state.workout) return state;
      return {
        workout: { ...state.workout, target_distance: distance },
        isDirty: true,
      };
    }),

  addStep: (afterStepId) =>
    set((state) => {
      if (!state.workout) return state;
      const newStep = createDefaultStep(generateStepId());
      const steps = [...state.workout.steps];

      if (afterStepId) {
        const index = steps.findIndex((s) => s.id === afterStepId);
        if (index !== -1) {
          steps.splice(index + 1, 0, newStep);
        } else {
          steps.push(newStep);
        }
      } else {
        steps.push(newStep);
      }

      return {
        workout: { ...state.workout, steps },
        isDirty: true,
        selectedStepId: newStep.id,
      };
    }),

  addRepeatGroup: (iterations = 4) =>
    set((state) => {
      if (!state.workout) return state;
      const groupId = `repeat-${Date.now()}`;
      const newStep = createDefaultStep(generateStepId());
      const repeatGroup = {
        id: groupId,
        step_type: 6 as const, // StepType.REPEAT
        iterations,
        steps: [newStep],
      };
      const steps = [...state.workout.steps, repeatGroup];

      return {
        workout: { ...state.workout, steps },
        isDirty: true,
        selectedStepId: groupId, // Select the group so user can edit iterations
      };
    }),

  addStepToRepeat: (groupId) =>
    set((state) => {
      if (!state.workout) return state;
      const newStep = createDefaultStep(generateStepId());
      const steps = state.workout.steps.map((item) => {
        if (isRepeatGroup(item) && item.id === groupId) {
          return { ...item, steps: [...item.steps, newStep] };
        }
        return item;
      });

      return {
        workout: { ...state.workout, steps },
        isDirty: true,
        selectedStepId: newStep.id,
      };
    }),

  updateRepeatIterations: (groupId, iterations) =>
    set((state) => {
      if (!state.workout) return state;
      const steps = state.workout.steps.map((item) => {
        if (isRepeatGroup(item) && item.id === groupId) {
          return { ...item, iterations: Math.max(1, iterations) };
        }
        return item;
      });

      return {
        workout: { ...state.workout, steps },
        isDirty: true,
      };
    }),

  removeStep: (stepId) =>
    set((state) => {
      if (!state.workout) return state;
      const steps = state.workout.steps
        .map((item) => {
          if (isRepeatGroup(item)) {
            const updatedSteps = item.steps.filter((step) => step.id !== stepId);
            // If repeat group is empty after removal, it will be filtered out below
            return { ...item, steps: updatedSteps };
          }
          return item;
        })
        .filter((item) => {
          // Remove the step if it matches, or remove empty repeat groups
          if (item.id === stepId) return false;
          if (isRepeatGroup(item) && item.steps.length === 0) return false;
          return true;
        });
      return {
        workout: { ...state.workout, steps },
        isDirty: true,
        selectedStepId: state.selectedStepId === stepId ? null : state.selectedStepId,
      };
    }),

  updateStep: (stepId, updates) =>
    set((state) => {
      if (!state.workout) return state;
      const steps = state.workout.steps.map((item) => {
        if (isRepeatGroup(item)) {
          // Check inside repeat group
          const updatedSteps = item.steps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
          );
          return { ...item, steps: updatedSteps };
        }
        if (item.id === stepId) {
          return { ...item, ...updates };
        }
        return item;
      });
      return {
        workout: { ...state.workout, steps },
        isDirty: true,
      };
    }),

  updateStepDistance: (stepId, distance) =>
    set((state) => {
      if (!state.workout) return state;
      // Snap to pool length increments
      const poolLength = state.workout.pool_length;
      const snappedDistance = Math.round(distance / poolLength) * poolLength;
      const finalDistance = Math.max(poolLength, snappedDistance);

      const steps = state.workout.steps.map((item) => {
        if (isRepeatGroup(item)) {
          const updatedSteps = item.steps.map((step) =>
            step.id === stepId ? { ...step, distance_m: finalDistance } : step
          );
          return { ...item, steps: updatedSteps };
        }
        if (item.id === stepId) {
          return { ...item, distance_m: finalDistance };
        }
        return item;
      });
      return {
        workout: { ...state.workout, steps },
        isDirty: true,
      };
    }),

  updateStepEquipment: (stepId, equipment) =>
    set((state) => {
      if (!state.workout) return state;
      const steps = state.workout.steps.map((item) => {
        if (isRepeatGroup(item)) {
          const updatedSteps = item.steps.map((step) =>
            step.id === stepId
              ? { ...step, equipment: { ...step.equipment, ...equipment } }
              : step
          );
          return { ...item, steps: updatedSteps };
        }
        if (item.id === stepId) {
          return { ...item, equipment: { ...(item as any).equipment, ...equipment } };
        }
        return item;
      });
      return {
        workout: { ...state.workout, steps },
        isDirty: true,
      };
    }),

  reorderSteps: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.workout) return state;
      const steps = [...state.workout.steps];
      const [removed] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, removed);
      return {
        workout: { ...state.workout, steps },
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),
}));
