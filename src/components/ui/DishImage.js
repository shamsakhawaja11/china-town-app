import React from 'react';
import { Image, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { assetUri } from '../../api/client';
import { dishVisual } from '../../utils/dishVisual';
import { Icon } from './Icon';
export function DishImage({ uri, category, size = 72, radius = 16, style, iconScale = 0.45 }) {
    const dim = typeof size === 'number' ? { width: size, height: size } : { width: '100%', height: '100%' };
    const src = assetUri(uri);
    if (src) {
        return <Image source={{ uri: src }} style={[dim, { borderRadius: radius }, style]} resizeMode="cover" />;
    }
    const v = dishVisual(category);
    const iconSize = typeof size === 'number' ? size * iconScale : 72;
    return (
        <View style={[dim, { borderRadius: radius, overflow: 'hidden' }, style]}>
            <LinearGradient
                colors={v.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
                <View
                    style={{
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        borderRadius: 999,
                        backgroundColor: 'rgba(255,255,255,0.14)',
                    }}
                />
                <Icon name={v.icon} size={iconSize} color="rgba(255,255,255,0.95)" />
            </LinearGradient>
        </View>
    );
}
