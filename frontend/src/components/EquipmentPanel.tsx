import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Equipment } from '../types/workout';

export type EquipmentType = keyof Equipment;

const EQUIPMENT_LIST: { type: EquipmentType; label: string; icon: string }[] = [
  { type: 'pull_buoy', label: 'Pull Buoy', icon: '🟡' },
  { type: 'paddles', label: 'Paddles', icon: '🖐️' },
  { type: 'fins', label: 'Fins', icon: '🦶' },
  { type: 'kickboard', label: 'Kickboard', icon: '📋' },
  { type: 'snorkel', label: 'Snorkel', icon: '🤿' },
];

interface DraggableEquipmentProps {
  type: EquipmentType;
  label: string;
  icon: string;
}

function DraggableEquipment({ type, label, icon }: DraggableEquipmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `equipment-${type}`,
    data: { type: 'equipment', equipmentType: type },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-600 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-200">{label}</span>
    </div>
  );
}

interface EquipmentBadgeProps {
  type: EquipmentType;
  onRemove?: () => void;
  small?: boolean;
}

export function EquipmentBadge({ type, onRemove, small }: EquipmentBadgeProps) {
  const item = EQUIPMENT_LIST.find((e) => e.type === type);
  if (!item) return null;

  if (small) {
    return (
      <span
        className="inline-flex items-center px-1 py-0.5 bg-yellow-500/30 text-yellow-200 rounded text-[10px] cursor-pointer hover:bg-red-500/30 hover:text-red-200 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        title={`${item.label} (click to remove)`}
      >
        <span>{item.icon}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/30 text-yellow-200 rounded text-xs cursor-pointer hover:bg-red-500/30 hover:text-red-200 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onRemove?.();
      }}
      title={`${item.label} (click to remove)`}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </span>
  );
}

export function EquipmentPanel() {
  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        Equipment <span className="text-gray-500">(drag onto steps)</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_LIST.map((item) => (
          <DraggableEquipment key={item.type} {...item} />
        ))}
      </div>
    </div>
  );
}

export { EQUIPMENT_LIST };
