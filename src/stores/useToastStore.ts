import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.durationMs ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }

    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

// Convenience helper functions
export const toast = {
  success: (title: string, message?: string, durationMs?: number) =>
    useToastStore.getState().addToast({ type: 'success', title, message, durationMs }),
  error: (title: string, message?: string, durationMs?: number) =>
    useToastStore.getState().addToast({ type: 'error', title, message, durationMs: durationMs ?? 6000 }),
  info: (title: string, message?: string, durationMs?: number) =>
    useToastStore.getState().addToast({ type: 'info', title, message, durationMs }),
  warning: (title: string, message?: string, durationMs?: number) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, durationMs }),
};
