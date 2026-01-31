import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutApi, garminApi } from '../api/client';
import type { WorkoutSummary } from '../types/workout';
import { toast } from './Toast';
import { confirm } from './ConfirmDialog';

interface WorkoutListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function WorkoutList({ selectedId, onSelect, onNew }: WorkoutListProps) {
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutApi.list,
  });

  const { data: garminStatus } = useQuery({
    queryKey: ['garmin-status'],
    queryFn: garminApi.getStatus,
  });

  const deleteMutation = useMutation({
    mutationFn: workoutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout deleted');
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: workoutApi.duplicate,
    onSuccess: (newWorkout) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      onSelect(newWorkout.id);
      toast.success('Workout duplicated');
    },
    onError: (error: Error) => {
      toast.error(`Duplicate failed: ${error.message}`);
    },
  });

  const syncMutation = useMutation({
    mutationFn: garminApi.sync,
    onSuccess: (workouts) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success(`Synced ${workouts.length} workouts from Garmin`);
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const handleDelete = async (e: React.MouseEvent, workoutId: string) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Workout',
      message: 'Are you sure you want to delete this workout? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(workoutId);
    }
  };

  const renderWorkoutItem = (workout: WorkoutSummary) => (
    <div
      key={workout.id}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        selectedId === workout.id
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
      }`}
      onClick={() => onSelect(workout.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{workout.name}</div>
          <div className="text-sm opacity-75">
            {workout.total_distance}m · {workout.step_count} steps
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            className="p-1 rounded hover:bg-gray-500/50 text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              duplicateMutation.mutate(workout.id);
            }}
            title="Duplicate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            className="p-1 rounded hover:bg-red-500/50 text-gray-300 hover:text-red-300"
            onClick={(e) => handleDelete(e, workout.id)}
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Workouts</h2>
          <button
            onClick={onNew}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            + New
          </button>
        </div>
        {garminStatus?.authenticated && (
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {syncMutation.isPending ? (
              'Syncing...'
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync from Garmin
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.map((w) => renderWorkoutItem(w))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            {garminStatus?.authenticated ? (
              <p>No workouts yet. Click "Sync from Garmin" to import your swimming workouts.</p>
            ) : (
              <p>Sign in to Garmin to sync your workouts.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
