import axios from 'axios';
import { secureStorage } from '../lib/secureStorage';
import { API_URL } from '../config';
export { API_URL };
export const ASSET_URL = API_URL.replace(/\/api\/v\d+\/?$/, '');
export const assetUri = (path) => (path ? (path.startsWith('http') ? path : `${ASSET_URL}${path}`) : undefined);
const ACCESS = 'ct.accessToken';
const REFRESH = 'ct.refreshToken';
let memoryTokens = null;
const store = {
    get: (k) => secureStorage.getItem(k),
    set: (k, v) => secureStorage.setItem(k, v),
    del: (k) => secureStorage.deleteItem(k),
};
export const tokenStore = {
    async load() {
        if (memoryTokens) return memoryTokens;
        const [accessToken, refreshToken] = await Promise.all([store.get(ACCESS), store.get(REFRESH)]);
        memoryTokens = accessToken && refreshToken ? { accessToken, refreshToken } : null;
        return memoryTokens;
    },
    async save(tokens) {
        memoryTokens = tokens;
        await Promise.all([store.set(ACCESS, tokens.accessToken), store.set(REFRESH, tokens.refreshToken)]);
    },
    async clear() {
        memoryTokens = null;
        await Promise.all([store.del(ACCESS), store.del(REFRESH)]);
    },
    current: () => memoryTokens,
};
export const http = axios.create({ baseURL: API_URL, timeout: 15000 });
http.interceptors.request.use(async (config) => {
    const tokens = memoryTokens ?? (await tokenStore.load());
    if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    return config;
});
let onSessionExpired = () => undefined;
export const setSessionExpiredHandler = (fn) => {
    onSessionExpired = fn;
};
let refreshing = null;
async function refreshAccessToken() {
    const tokens = await tokenStore.load();
    if (!tokens?.refreshToken) return null;
    try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: tokens.refreshToken }, { timeout: 15000 });
        await tokenStore.save(data);
        return data.accessToken;
    } catch {
        return null;
    }
}
http.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const url = original?.url ?? '';
        const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');
        if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
            original._retry = true;
            refreshing = refreshing ?? refreshAccessToken().finally(() => (refreshing = null));
            const newToken = await refreshing;
            if (newToken) {
                original.headers.Authorization = `Bearer ${newToken}`;
                return http(original);
            }
            await tokenStore.clear();
            onSessionExpired();
        }
        return Promise.reject(error);
    },
);
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
    const e = err;
    if (e?.code === 'ECONNABORTED') return 'The server took too long to respond.';
    if (e?.message === 'Network Error') return `Can't reach the server at ${API_URL}. Check Wi-Fi and API_URL in src/config.ts.`;
    const msg = e?.response?.data?.message;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
    if (typeof msg === 'string' && msg.length) return msg;
    return fallback;
}
