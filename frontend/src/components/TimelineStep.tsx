import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WorkoutStep } from '../types/workout';
import {
  StepType,
  STROKE_NAMES,
  STEP_TYPE_NAMES,
  STROKE_COLORS,
  STEP_TYPE_COLORS,
} from '../types/workout';
import { EquipmentBadge, type EquipmentType } from './EquipmentPanel';

interface TimelineStepProps {
  step: WorkoutStep;
  totalDistance: number;
  poolLength: number;
  isSelected: boolean;
  onSelect: () => void;
  onDistanceChange: (distance: number) => void;
  onEquipmentRemove: (type: EquipmentType) => void;
  distanceUnit: 'm' | 'yd';
}

export function TimelineStep({
  step,
  totalDistance,
  poolLength,
  isSelected,
  onSelect,
  onDistanceChange,
  onEquipmentRemove,
  distanceUnit,
}: TimelineStepProps) {
  // Conversion helper
  const metersToYards = (m: number) => Math.round(m / 0.9144);
  const displayDist = (m: number) => distanceUnit === 'yd' ? metersToYards(m) : m;
  const unitLabel = distanceUnit;
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartDistance, setResizeStartDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { type: 'step', stepId: step.id },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: step.id,
    data: { type: 'step', stepId: step.id },
  });

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
    (containerRef as any).current = node;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate width based on distance (min 60px)
  // Rest steps use a fixed width since they're time-based, not distance-based
  const minWidth = 60;
  const maxWidthPercent = 40; // Max 40% of timeline
  const isRest = step.step_type === StepType.REST;
  const widthPercent = isRest
    ? 8 // Fixed width for rest steps
    : Math.min(
        maxWidthPercent,
        Math.max(5, (step.distance_m / Math.max(totalDistance, 100)) * 100)
      );

  // Get active equipment
  const activeEquipment = Object.entries(step.equipment)
    .filter(([_, active]) => active)
    .map(([type]) => type as EquipmentType);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.parentElement?.clientWidth || 1;
      const deltaX = e.clientX - resizeStartX;
      const distancePerPixel = totalDistance / containerWidth;
      const newDistance = resizeStartDistance + deltaX * distancePerPixel;

      // Snap to pool length increments
      const snapped = Math.round(newDistance / poolLength) * poolLength;
      const clamped = Math.max(poolLength, Math.min(snapped, totalDistance * 0.5));
      onDistanceChange(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, resizeStartDistance, poolLength, totalDistance, onDistanceChange]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartDistance(step.distance_m);
  };

  const strokeColor = STROKE_COLORS[step.stroke];
  const stepTypeColor = STEP_TYPE_COLORS[step.step_type];

  return (
    <div
      ref={setRefs}
      style={{
        ...style,
        width: `${widthPercent}%`,
        minWidth: `${minWidth}px`,
      }}
      className={`relative flex-shrink-0 select-none ${isDragging ? 'z-50' : ''}`}
      {...attributes}
    >
      <div
        className={`relative h-24 rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-blue-400 ring-2 ring-blue-400/50'
            : isOver
            ? 'border-yellow-400 ring-2 ring-yellow-400/50'
            : 'border-gray-600 hover:border-gray-500'
        } ${strokeColor}`}
        onClick={onSelect}
        {...listeners}
      >
        {/* Step type indicator */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${stepTypeColor}`}
        />

        {/* Content */}
        <div className="p-2 pt-3 h-full flex flex-col">
          <div className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate">
            {STEP_TYPE_NAMES[step.step_type]}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">
            {isRest ? `${step.duration_seconds || 30}s` : STROKE_NAMES[step.stroke]}
          </div>
          {!isRest && (
            <div className="text-lg font-bold text-gray-900">
              {displayDist(step.distance_m)}{unitLabel}
            </div>
          )}
          {step.zone && (
            <div className="text-xs text-gray-700">Z{step.zone}</div>
          )}

          {/* Equipment badges */}
          {activeEquipment.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {activeEquipment.map((type) => (
                <EquipmentBadge
                  key={type}
                  type={type}
                  onRemove={() => onEquipmentRemove(type)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resize handle */}
        {!isRest && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-gray-900/20 hover:bg-blue-500/50 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>

      {/* Distance label below */}
      {!isRest && (
        <div className="text-center text-xs text-gray-400 mt-1">
          {displayDist(step.distance_m)}{unitLabel}
        </div>
      )}
    </div>
  );
}
