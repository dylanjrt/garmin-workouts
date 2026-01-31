import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { WorkoutList } from './components/WorkoutList';
import { Timeline } from './components/Timeline';
import { StepEditor } from './components/StepEditor';
import { GarminStatus } from './components/GarminStatus';
import { ToastContainer, toast } from './components/Toast';
import { ConfirmDialog, confirm } from './components/ConfirmDialog';
import { useWorkoutStore } from './stores/workoutStore';
import { workoutApi } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AppContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { workout, setWorkout, isDirty } = useWorkoutStore();

  // Fetch workout when selected
  const { data: fetchedWorkout, isLoading } = useQuery({
    queryKey: ['workout', selectedId],
    queryFn: () => (selectedId ? workoutApi.get(selectedId) : null),
    enabled: !!selectedId,
  });

  // Update store when workout is fetched
  useEffect(() => {
    if (fetchedWorkout) {
      setWorkout(fetchedWorkout);
    }
  }, [fetchedWorkout, setWorkout]);

  const handleSelect = async (id: string) => {
    if (isDirty) {
      const confirmed = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to continue?',
        confirmText: 'Continue',
        cancelText: 'Stay',
        variant: 'warning',
      });
      if (!confirmed) return;
    }
    setSelectedId(id);
  };

  const handleNew = async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to create a new workout?',
        confirmText: 'Create New',
        cancelText: 'Stay',
        variant: 'warning',
      });
      if (!confirmed) return;
    }
    try {
      const newWorkout = await workoutApi.create({
        name: 'New Workout',
        pool_length: 25,
        steps: [],
      });
      setSelectedId(newWorkout.id);
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('New workout created');
    } catch (error) {
      toast.error(`Failed to create workout: ${(error as Error).message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header with Garmin status */}
      <GarminStatus />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Workout list */}
        <div className="w-72 flex-shrink-0 border-r border-gray-700">
          <WorkoutList
            selectedId={selectedId}
            onSelect={handleSelect}
            onNew={handleNew}
          />
        </div>

        {/* Main area - Timeline */}
        <div className="flex-1 flex overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading workout...
            </div>
          ) : (
            <Timeline />
          )}
        </div>

        {/* Right panel - Step editor */}
        {workout && <StepEditor />}
      </div>

      {/* Global dialogs */}
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
