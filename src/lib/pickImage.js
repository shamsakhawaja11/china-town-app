import { launchImageLibrary } from 'react-native-image-picker';
export async function pickImage() {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, maxWidth: 1400, maxHeight: 1400, selectionLimit: 1 });
    if (res.didCancel || res.errorCode || !res.assets?.[0]?.uri) {
        if (res.errorMessage) throw new Error(res.errorMessage);
        return null;
    }
    const a = res.assets[0];
    return { uri: a.uri, type: a.type, fileName: a.fileName };
}
