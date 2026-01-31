import { useDroppable } from '@dnd-kit/core';
import type { RepeatGroup, WorkoutStep } from '../types/workout';
import {
  StepType,
  STROKE_NAMES,
  STEP_TYPE_NAMES,
  STROKE_COLORS,
  STEP_TYPE_COLORS,
} from '../types/workout';
import { EquipmentBadge, type EquipmentType } from './EquipmentPanel';

interface TimelineRepeatGroupProps {
  group: RepeatGroup;
  totalDistance: number;
  isSelected: boolean;
  selectedStepId: string | null;
  onSelectGroup: () => void;
  onSelectStep: (stepId: string) => void;
  onEquipmentRemove: (stepId: string, type: EquipmentType) => void;
  distanceUnit: 'm' | 'yd';
}

function MiniStep({
  step,
  isSelected,
  onSelect,
  onEquipmentRemove,
  distanceUnit,
}: {
  step: WorkoutStep;
  isSelected: boolean;
  onSelect: () => void;
  onEquipmentRemove: (type: EquipmentType) => void;
  distanceUnit: 'm' | 'yd';
}) {
  const isRest = step.step_type === StepType.REST;
  const strokeColor = STROKE_COLORS[step.stroke];
  const stepTypeColor = STEP_TYPE_COLORS[step.step_type];

  // Conversion helper
  const metersToYards = (m: number) => Math.round(m / 0.9144);
  const displayDist = (m: number) => distanceUnit === 'yd' ? metersToYards(m) : m;

  const activeEquipment = Object.entries(step.equipment)
    .filter(([_, active]) => active)
    .map(([type]) => type as EquipmentType);

  return (
    <div
      className={`relative h-20 rounded-lg border-2 transition-all cursor-pointer overflow-hidden flex-1 min-w-[50px] ${
        isSelected
          ? 'border-blue-400 ring-2 ring-blue-400/50'
          : 'border-gray-600 hover:border-gray-500'
      } ${strokeColor}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Step type indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${stepTypeColor}`} />

      {/* Content */}
      <div className="p-1.5 pt-2 h-full flex flex-col">
        <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wide truncate">
          {STEP_TYPE_NAMES[step.step_type]}
        </div>
        <div className="text-xs font-semibold text-gray-900 truncate">
          {isRest ? `${step.duration_seconds || 30}s` : STROKE_NAMES[step.stroke]}
        </div>
        {!isRest && (
          <div className="text-sm font-bold text-gray-900">{displayDist(step.distance_m)}{distanceUnit}</div>
        )}

        {/* Equipment badges */}
        {activeEquipment.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-auto">
            {activeEquipment.map((type) => (
              <EquipmentBadge
                key={type}
                type={type}
                onRemove={() => onEquipmentRemove(type)}
                small
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelineRepeatGroup({
  group,
  totalDistance,
  isSelected,
  selectedStepId,
  onSelectGroup,
  onSelectStep,
  onEquipmentRemove,
  distanceUnit,
}: TimelineRepeatGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { type: 'repeat-group', groupId: group.id },
  });

  // Conversion helper
  const metersToYards = (m: number) => Math.round(m / 0.9144);
  const displayDist = (m: number) => distanceUnit === 'yd' ? metersToYards(m) : m;
  const unitLabel = distanceUnit;

  // Calculate group distance for width
  const groupDistance = group.steps.reduce((sum, s) => sum + (s.distance_m || 0), 0);
  const totalGroupDistance = groupDistance * group.iterations;
  const widthPercent = Math.min(
    50,
    Math.max(15, (totalGroupDistance / Math.max(totalDistance, 100)) * 100)
  );

  return (
    <div
      ref={setNodeRef}
      style={{ width: `${widthPercent}%`, minWidth: '150px' }}
      className="flex-shrink-0"
    >
      <div
        className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-indigo-400 bg-indigo-900/30'
            : isOver
            ? 'border-yellow-400 bg-yellow-900/20'
            : 'border-indigo-600 bg-indigo-900/20 hover:border-indigo-500'
        }`}
        onClick={onSelectGroup}
      >
        {/* Header */}
        <div className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold flex justify-between items-center">
          <span>REPEAT x{group.iterations}</span>
          <span className="opacity-75">{displayDist(totalGroupDistance)}{unitLabel} total</span>
        </div>

        {/* Steps inside the repeat */}
        <div className="p-2 flex gap-1">
          {group.steps.map((step) => (
            <MiniStep
              key={step.id}
              step={step}
              isSelected={selectedStepId === step.id}
              onSelect={() => onSelectStep(step.id)}
              onEquipmentRemove={(type) => onEquipmentRemove(step.id, type)}
              distanceUnit={distanceUnit}
            />
          ))}
        </div>
      </div>

      {/* Distance label below */}
      <div className="text-center text-xs text-gray-400 mt-1">
        {group.iterations} x {displayDist(groupDistance)}{unitLabel}
      </div>
    </div>
  );
}
