import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  variant: 'danger' | 'warning' | 'info';
}

interface ConfirmStore extends ConfirmState {
  show: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  hide: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,
  variant: 'info',
  show: (options) =>
    set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'info',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel || null,
    }),
  hide: () =>
    set({
      isOpen: false,
      onConfirm: null,
      onCancel: null,
    }),
}));

// Helper function for easier usage
export function confirm(options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().show({
      ...options,
      onConfirm: () => {
        useConfirmStore.getState().hide();
        resolve(true);
      },
      onCancel: () => {
        useConfirmStore.getState().hide();
        resolve(false);
      },
    });
  });
}

export function ConfirmDialog() {
  const { isOpen, title, message, confirmText, cancelText, variant, onConfirm, onCancel, hide } =
    useConfirmStore();

  if (!isOpen) return null;

  const confirmButtonClass = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }[variant];

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
    hide();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
