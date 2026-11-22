import { create } from 'zustand';
let next = 1;
export const useToast = create((set, get) => ({
    toasts: [],
    show(kind, title, message) {
        const id = next++;
        set({ toasts: [...get().toasts.slice(-2), { id, kind, title, message }] });
        setTimeout(() => get().dismiss(id), kind === 'error' ? 4500 : 3000);
    },
    dismiss(id) {
        set({ toasts: get().toasts.filter((t) => t.id !== id) });
    },
}));
export const toast = {
    success: (title, message) => useToast.getState().show('success', title, message),
    error: (title, message) => useToast.getState().show('error', title, message),
    info: (title, message) => useToast.getState().show('info', title, message),
};
