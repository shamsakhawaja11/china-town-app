import { Platform } from 'react-native';
import { USE_CUSTOM_FONTS } from '../config';
export const colors = {
    primary: '#D7372B',
    primaryDark: '#A8231A',
    primaryLight: '#FBE3DF',
    primarySoft: '#FDF0EC',
    gold: '#E6A93A',
    goldSoft: '#FDF3DE',
    bg: '#FBF4EF',
    surface: '#FFFFFF',
    surfaceAlt: '#F6ECE6',
    border: '#EFE1D9',
    text: '#1E1714',
    textMuted: '#8B7D75',
    textFaint: '#B9ABA3',
    success: '#2E9E5B',
    successSoft: '#E3F5EA',
    warning: '#E59A1C',
    warningSoft: '#FDF1DC',
    danger: '#D7372B',
    dangerSoft: '#FCE4E1',
    info: '#3A7BD5',
    infoSoft: '#E4EEFB',
    dark: '#1A0B09',
    darkRed: '#3B0D08',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(20, 8, 6, 0.45)',
};
const systemSerif = Platform.select({ ios: 'Georgia', default: 'serif' });
export const fonts = USE_CUSTOM_FONTS
    ? {
          regular: 'Poppins-Regular',
          medium: 'Poppins-Medium',
          semibold: 'Poppins-SemiBold',
          bold: 'Poppins-Bold',
          display: 'PlayfairDisplay-Bold',
      }
    : { regular: undefined, medium: undefined, semibold: undefined, bold: undefined, display: systemSerif };
const w = (weight) => (USE_CUSTOM_FONTS ? {} : { fontWeight: weight });
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 };
export const type = {
    display: { ...w('700'), fontFamily: fonts.display, fontSize: 34, lineHeight: 42, color: colors.text },
    h1: { ...w('700'), fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: colors.text },
    h2: { ...w('600'), fontFamily: fonts.semibold, fontSize: 19, lineHeight: 26, color: colors.text },
    h3: { ...w('600'), fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
    body: { ...w('400'), fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.text },
    bodyMedium: { ...w('500'), fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.text },
    small: { ...w('400'), fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    smallMedium: { ...w('500'), fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.textMuted },
    tiny: { ...w('500'), fontFamily: fonts.medium, fontSize: 10.5, lineHeight: 14, color: colors.textMuted },
    button: { ...w('600'), fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
    price: { ...w('700'), fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.primary },
};
export const shadow = (level = 1) =>
    Platform.select({
        ios: {
            shadowColor: '#5A2A1E',
            shadowOpacity: [0.06, 0.1, 0.16][level - 1],
            shadowRadius: [6, 12, 20][level - 1],
            shadowOffset: { width: 0, height: [2, 6, 10][level - 1] },
        },
        default: { elevation: [2, 5, 10][level - 1], shadowColor: '#5A2A1E' },
    });
export const theme = { colors, fonts, spacing, radius, type, shadow };
