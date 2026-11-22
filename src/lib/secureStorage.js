import * as Keychain from 'react-native-keychain';
export const secureStorage = {
    async getItem(key) {
        try {
            const res = await Keychain.getGenericPassword({ service: key });
            return res ? res.password : null;
        } catch {
            return null;
        }
    },
    async setItem(key, value) {
        try {
            await Keychain.setGenericPassword('chinatown', value, { service: key });
        } catch {}
    },
    async deleteItem(key) {
        try {
            await Keychain.resetGenericPassword({ service: key });
        } catch {}
    },
};
