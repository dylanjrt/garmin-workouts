import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { useWorkoutStore } from '../stores/workoutStore';
import { TimelineStep } from './TimelineStep';
import { TimelineRepeatGroup } from './TimelineRepeatGroup';
import { EquipmentPanel, type EquipmentType } from './EquipmentPanel';
import { calculateTotalDistance, isRepeatGroup, type WorkoutStep, type WorkoutItem } from '../types/workout';

export function Timeline() {
  const {
    workout,
    selectedStepId,
    setSelectedStep,
    updateStepDistance,
    updateStepEquipment,
    updateWorkoutName,
    updatePoolLength,
    updateTargetDistance,
    reorderSteps,
    addStep,
    addRepeatGroup,
  } = useWorkoutStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [editedPoolLength, setEditedPoolLength] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editedTarget, setEditedTarget] = useState('');
  const { distanceUnit, setDistanceUnit } = useWorkoutStore();

  // Conversion helpers
  const metersToYards = (m: number) => Math.round(m / 0.9144);
  const yardsToMeters = (yd: number) => Math.round(yd * 0.9144);
  const displayDistance = (m: number) => distanceUnit === 'yd' ? metersToYards(m) : m;

  // Custom collision detection: use pointerWithin for equipment, rectIntersection for steps
  const collisionDetection: CollisionDetection = (args) => {
    // For equipment dragging, prefer pointerWithin to detect drop targets
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // Fall back to rectIntersection for step reordering
    return rectIntersection(args);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!workout) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a workout to edit
      </div>
    );
  }

  const totalDistance = calculateTotalDistance(workout.steps);

  // Separate flat steps from repeat groups
  const flatSteps = workout.steps.filter(
    (step): step is WorkoutStep => !isRepeatGroup(step)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle equipment drop onto step
    if (active.data.current?.type === 'equipment' && over.data.current?.type === 'step') {
      const equipmentType = active.data.current.equipmentType as EquipmentType;
      const stepId = over.data.current.stepId as string;
      updateStepEquipment(stepId, { [equipmentType]: true });
      return;
    }

    // Handle step reordering
    if (active.id !== over.id) {
      const oldIndex = flatSteps.findIndex((s) => s.id === active.id);
      const newIndex = flatSteps.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSteps(oldIndex, newIndex);
      }
    }
  };

  // Generate distance markers
  const markers = [];
  const markerInterval = totalDistance > 2000 ? 500 : totalDistance > 1000 ? 250 : 100;
  for (let d = 0; d <= totalDistance; d += markerInterval) {
    markers.push(d);
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => {
                if (editedName.trim()) {
                  updateWorkoutName(editedName.trim());
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editedName.trim()) {
                    updateWorkoutName(editedName.trim());
                  }
                  setIsEditingName(false);
                } else if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="text-xl font-bold bg-gray-800 text-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2
              className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => {
                setEditedName(workout.name);
                setIsEditingName(true);
              }}
              title="Click to edit name"
            >
              {workout.name}
            </h2>
          )}
          <div className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
            {/* Total / Target distance */}
            <span className="flex items-center gap-1">
              {workout.target_distance ? (
                <>
                  <span className={totalDistance >= workout.target_distance ? 'text-green-400' : ''}>
                    {displayDistance(totalDistance)}
                  </span>
                  <span>/</span>
                  {isEditingTarget ? (
                    <input
                      type="number"
                      value={editedTarget}
                      onChange={(e) => setEditedTarget(e.target.value)}
                      onBlur={() => {
                        const val = Number(editedTarget);
                        if (val > 0) {
                          const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                          updateTargetDistance(meters);
                        }
                        setIsEditingTarget(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = Number(editedTarget);
                          if (val > 0) {
                            const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                            updateTargetDistance(meters);
                          }
                          setIsEditingTarget(false);
                        } else if (e.key === 'Escape') {
                          setIsEditingTarget(false);
                        }
                      }}
                      autoFocus
                      className="w-16 bg-gray-800 text-gray-400 border border-blue-500 rounded px-1 text-sm focus:outline-none"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => {
                        setEditedTarget(String(displayDistance(workout.target_distance!)));
                        setIsEditingTarget(true);
                      }}
                      title="Click to edit target"
                    >
                      {displayDistance(workout.target_distance)}
                    </span>
                  )}
                </>
              ) : isEditingTarget ? (
                <>
                  Target:{' '}
                  <input
                    type="number"
                    value={editedTarget}
                    onChange={(e) => setEditedTarget(e.target.value)}
                    onBlur={() => {
                      const val = Number(editedTarget);
                      if (val > 0) {
                        const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                        updateTargetDistance(meters);
                      }
                      setIsEditingTarget(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = Number(editedTarget);
                        if (val > 0) {
                          const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                          updateTargetDistance(meters);
                        }
                        setIsEditingTarget(false);
                      } else if (e.key === 'Escape') {
                        setIsEditingTarget(false);
                      }
                    }}
                    autoFocus
                    placeholder="e.g. 2000"
                    className="w-20 bg-gray-800 text-gray-400 border border-blue-500 rounded px-1 text-sm focus:outline-none"
                  />
                  <span className="text-gray-500">{distanceUnit}</span>
                </>
              ) : (
                <>
                  Total: {displayDistance(totalDistance)}
                  <button
                    onClick={() => {
                      setEditedTarget('');
                      setIsEditingTarget(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                    title="Set a target distance"
                  >
                    [set target]
                  </button>
                </>
              )}
            </span>

            <span>·</span>

            {/* Pool length */}
            <span className="flex items-center gap-1">
              Pool:{' '}
              {isEditingPool ? (
                <input
                  type="number"
                  value={editedPoolLength}
                  onChange={(e) => setEditedPoolLength(e.target.value)}
                  onBlur={() => {
                    const val = Number(editedPoolLength);
                    if (val > 0) {
                      const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                      updatePoolLength(meters);
                    }
                    setIsEditingPool(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = Number(editedPoolLength);
                      if (val > 0) {
                        const meters = distanceUnit === 'yd' ? yardsToMeters(val) : val;
                        updatePoolLength(meters);
                      }
                      setIsEditingPool(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingPool(false);
                    }
                  }}
                  autoFocus
                  className="w-16 bg-gray-800 text-gray-400 border border-blue-500 rounded px-1 text-sm focus:outline-none"
                />
              ) : (
                <span
                  className="cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => {
                    setEditedPoolLength(String(displayDistance(workout.pool_length)));
                    setIsEditingPool(true);
                  }}
                  title="Click to edit pool length"
                >
                  {displayDistance(workout.pool_length)}
                </span>
              )}
            </span>

            {/* Unit selector */}
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value as 'm' | 'yd')}
              className="bg-gray-800 text-gray-400 border border-gray-600 rounded px-1 text-sm cursor-pointer hover:border-blue-500"
            >
              <option value="yd">yd</option>
              <option value="m">m</option>
            </select>

            {/* Clear target button */}
            {workout.target_distance && (
              <button
                onClick={() => updateTargetDistance(undefined)}
                className="text-gray-500 hover:text-red-400 text-xs"
                title="Clear target"
              >
                [clear target]
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addStep()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            + Add Step
          </button>
          <button
            onClick={() => addRepeatGroup()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            + Add Repeat
          </button>
        </div>
      </div>

      {/* Progress bar toward target */}
      {workout.target_distance && (
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalDistance >= workout.target_distance ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (totalDistance / workout.target_distance) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {Math.round((totalDistance / workout.target_distance) * 100)}% of target
          </div>
        </div>
      )}

      {/* Timeline area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto p-4">
            <div className="min-w-full">
              {/* Steps and Repeat Groups */}
              <SortableContext
                items={flatSteps.map((s) => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-2 mb-4 pb-2">
                  {workout.steps.map((item) => {
                    if (isRepeatGroup(item)) {
                      return (
                        <TimelineRepeatGroup
                          key={item.id}
                          group={item}
                          totalDistance={totalDistance}
                          isSelected={selectedStepId === item.id}
                          selectedStepId={selectedStepId}
                          onSelectGroup={() => setSelectedStep(item.id)}
                          onSelectStep={(stepId) => setSelectedStep(stepId)}
                          onEquipmentRemove={(stepId, type) =>
                            updateStepEquipment(stepId, { [type]: false })
                          }
                          distanceUnit={distanceUnit}
                        />
                      );
                    }
                    return (
                      <TimelineStep
                        key={item.id}
                        step={item}
                        totalDistance={totalDistance}
                        poolLength={workout.pool_length}
                        isSelected={selectedStepId === item.id}
                        onSelect={() => setSelectedStep(item.id)}
                        onDistanceChange={(d) => updateStepDistance(item.id, d)}
                        onEquipmentRemove={(type) =>
                          updateStepEquipment(item.id, { [type]: false })
                        }
                        distanceUnit={distanceUnit}
                      />
                    );
                  })}
                </div>
              </SortableContext>

              {/* Distance ruler */}
              <div className="relative h-8 border-t border-gray-700">
                <div className="absolute inset-0 flex justify-between text-xs text-gray-500">
                  {markers.map((d) => (
                    <div key={d} className="flex flex-col items-center">
                      <div className="w-px h-2 bg-gray-600" />
                      <span>{displayDistance(d)}{distanceUnit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Equipment panel */}
          <EquipmentPanel />

          {/* Drag overlay */}
          <DragOverlay>
            {activeId && activeId.startsWith('equipment-') && (
              <div className="px-3 py-2 bg-yellow-500 text-black rounded-lg shadow-lg">
                Drop on a step
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
