import { useWorkoutStore } from '../stores/workoutStore';
import {
  StepType,
  StrokeType,
  STEP_TYPE_NAMES,
  STROKE_NAMES,
  findStepById,
  isRepeatGroup,
  type RepeatGroup,
} from '../types/workout';
import { confirm } from './ConfirmDialog';

export function StepEditor() {
  const {
    workout,
    selectedStepId,
    updateStep,
    removeStep,
    setSelectedStep,
    distanceUnit,
    addStepToRepeat,
    updateRepeatIterations,
  } = useWorkoutStore();

  // Conversion helpers
  const metersToYards = (m: number) => Math.round(m / 0.9144);
  const yardsToMeters = (yd: number) => Math.round(yd * 0.9144);
  const displayDist = (m: number) => distanceUnit === 'yd' ? metersToYards(m) : m;
  const toMeters = (val: number) => distanceUnit === 'yd' ? yardsToMeters(val) : val;

  if (!workout || !selectedStepId) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <p className="text-gray-500 text-center">Select a step to edit</p>
      </div>
    );
  }

  // Check if selected item is a repeat group
  const repeatGroup = workout.steps.find(
    (item): item is RepeatGroup => isRepeatGroup(item) && item.id === selectedStepId
  );

  if (repeatGroup) {
    // Calculate displayed distances to avoid rounding errors
    const groupDistanceDisplay = repeatGroup.steps.reduce((sum, s) => sum + displayDist(s.distance_m || 0), 0);
    const totalDistanceDisplay = groupDistanceDisplay * repeatGroup.iterations;

    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Edit Repeat</h3>
          <button
            onClick={() => setSelectedStep(null)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Iterations */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Iterations
            </label>
            <input
              type="number"
              value={repeatGroup.iterations}
              onChange={(e) =>
                updateRepeatIterations(repeatGroup.id, Number(e.target.value))
              }
              min={1}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-400">
            <p>{repeatGroup.steps.length} step(s) per repeat</p>
            <p>{groupDistanceDisplay}{distanceUnit} per repeat</p>
            <p className="font-medium text-white mt-2">
              Total: {totalDistanceDisplay}{distanceUnit}
            </p>
          </div>

          {/* Add step to repeat */}
          <button
            onClick={() => addStepToRepeat(repeatGroup.id)}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            + Add Step to Repeat
          </button>
        </div>

        {/* Delete repeat */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Delete Repeat',
                message: 'Are you sure you want to delete this repeat group?',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'danger',
              });
              if (confirmed) {
                removeStep(repeatGroup.id);
              }
            }}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Delete Repeat
          </button>
        </div>
      </div>
    );
  }

  const step = findStepById(workout.steps, selectedStepId);
  if (!step) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <p className="text-gray-500 text-center">Step not found</p>
      </div>
    );
  }

  const isRest = step.step_type === StepType.REST;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Edit Step</h3>
        <button
          onClick={() => setSelectedStep(null)}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Step Type
          </label>
          <select
            value={step.step_type}
            onChange={(e) =>
              updateStep(step.id, { step_type: Number(e.target.value) as StepType })
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(STEP_TYPE_NAMES)
              .filter(([key]) => Number(key) !== StepType.REPEAT)
              .map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
          </select>
        </div>

        {/* Stroke (not for rest) */}
        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stroke
            </label>
            <select
              value={step.stroke}
              onChange={(e) =>
                updateStep(step.id, { stroke: Number(e.target.value) as StrokeType })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(STROKE_NAMES).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Distance (not for rest) */}
        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Distance ({distanceUnit})
            </label>
            <input
              type="number"
              value={displayDist(step.distance_m)}
              onChange={(e) =>
                updateStep(step.id, { distance_m: Math.max(toMeters(25), toMeters(Number(e.target.value))) })
              }
              step={displayDist(workout.pool_length)}
              min={displayDist(workout.pool_length)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Steps of {displayDist(workout.pool_length)}{distanceUnit} (pool length)
            </p>
          </div>
        )}

        {/* Duration (for rest) */}
        {isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={step.duration_seconds || 30}
              onChange={(e) =>
                updateStep(step.id, { duration_seconds: Math.max(5, Number(e.target.value)) })
              }
              step={5}
              min={5}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Zone (not for rest) */}
        {!isRest && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Heart Rate Zone
            </label>
            <select
              value={step.zone || ''}
              onChange={(e) =>
                updateStep(step.id, {
                  zone: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No target</option>
              <option value="1">Zone 1 (Recovery)</option>
              <option value="2">Zone 2 (Aerobic)</option>
              <option value="3">Zone 3 (Tempo)</option>
              <option value="4">Zone 4 (Threshold)</option>
              <option value="5">Zone 5 (VO2 Max)</option>
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={step.description || ''}
            onChange={(e) => updateStep(step.id, { description: e.target.value || undefined })}
            rows={2}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Optional notes..."
          />
        </div>

        {/* Equipment toggles */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Equipment
          </label>
          <div className="space-y-2">
            {Object.entries(step.equipment).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    updateStep(step.id, {
                      equipment: { ...step.equipment, [key]: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-300 capitalize">
                  {key.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={async () => {
            const confirmed = await confirm({
              title: 'Delete Step',
              message: 'Are you sure you want to delete this step?',
              confirmText: 'Delete',
              cancelText: 'Cancel',
              variant: 'danger',
            });
            if (confirmed) {
              removeStep(step.id);
            }
          }}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Delete Step
        </button>
      </div>
    </div>
  );
}
