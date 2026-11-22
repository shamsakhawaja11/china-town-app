import { Platform } from 'react-native';
const LAN_API_URL = 'http://192.168.0.106:3000/api/v1';
const USE_EMULATOR_DEFAULTS = false;
export const API_URL = USE_EMULATOR_DEFAULTS
    ? Platform.OS === 'android'
        ? 'http://10.0.2.2:3000/api/v1'
        : 'http://localhost:3000/api/v1'
    : LAN_API_URL;
export const USE_CUSTOM_FONTS = false;
