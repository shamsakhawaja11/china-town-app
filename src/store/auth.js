import { create } from 'zustand';
import { authApi } from '../api/endpoints';
import { setSessionExpiredHandler, tokenStore } from '../api/client';
export const appRoleOf = (user) => {
    if (!user) return 'customer';
    if (user.role === 'admin') return 'admin';
    if (user.role === 'staff') return user.staff?.staffType ?? 'waiter';
    return 'customer';
};
export const useAuth = create((set, get) => ({
    status: 'booting',
    user: null,
    async bootstrap() {
        setSessionExpiredHandler(() => set({ status: 'signedOut', user: null }));
        const tokens = await tokenStore.load();
        if (!tokens) return set({ status: 'signedOut' });
        try {
            const user = await authApi.me();
            set({ status: 'signedIn', user });
        } catch {
            await tokenStore.clear();
            set({ status: 'signedOut', user: null });
        }
    },
    async login(contact, password) {
        const tokens = await authApi.login(contact.trim(), password);
        await tokenStore.save(tokens);
        const user = await authApi.me();
        set({ status: 'signedIn', user });
        return user;
    },
    async register(body) {
        await authApi.register(body);
        return get().login(body.email ?? body.phone ?? '', body.password);
    },
    async refreshMe() {
        try {
            set({ user: await authApi.me() });
        } catch {}
    },
    async logout() {
        const tokens = tokenStore.current();
        try {
            if (tokens) await authApi.logout(tokens.refreshToken);
        } catch {}
        await tokenStore.clear();
        set({ status: 'signedOut', user: null });
    },
}));
