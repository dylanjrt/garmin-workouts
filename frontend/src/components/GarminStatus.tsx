import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { garminApi, workoutApi } from '../api/client';
import { useWorkoutStore } from '../stores/workoutStore';
import { toast } from './Toast';

export function GarminStatus() {
  const queryClient = useQueryClient();
  const { workout, isDirty, markSaved } = useWorkoutStore();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['garmin-status'],
    queryFn: garminApi.getStatus,
    refetchInterval: 60000,
  });

  const loginMutation = useMutation({
    mutationFn: () => garminApi.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin-status'] });
      setShowLogin(false);
      setPassword('');
      toast.success('Signed in to Garmin Connect');
    },
    onError: () => {
      toast.error('Login failed. Check your credentials.');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: garminApi.upload,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });

      if (result.workout_id && workout && result.workout_id !== workout.id) {
        workoutApi.get(result.workout_id).then((newWorkout) => {
          useWorkoutStore.getState().setWorkout(newWorkout);
        });
      }

      toast.success('Workout uploaded to Garmin Connect!');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (!workout) return;

    setIsSaving(true);
    try {
      await workoutApi.update(workout.id, {
        name: workout.name,
        pool_length: workout.pool_length,
        steps: workout.steps,
      });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      markSaved();
      toast.success('Workout saved');
    } catch (error) {
      toast.error(`Save failed: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = () => {
    if (!workout) return;

    if (!status?.authenticated) {
      setShowLogin(true);
      return;
    }

    uploadMutation.mutate(workout.id);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-gray-800 border-b border-gray-700">
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!workout || !isDirty || isSaving}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            workout && isDirty
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : isDirty ? 'Save*' : 'Saved'}
        </button>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!workout || uploadMutation.isPending}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            workout
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {uploadMutation.isPending ? (
            'Uploading...'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload to Garmin
            </>
          )}
        </button>

        {/* Garmin status */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          {statusLoading ? (
            <span className="text-gray-500">Checking...</span>
          ) : status?.authenticated ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-300">{status.user_name || 'Connected'}</span>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign in to Garmin
            </button>
          )}
        </div>
      </div>

      {/* Login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Sign in to Garmin Connect</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
