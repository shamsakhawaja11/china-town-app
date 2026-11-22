let reanimatedPlugin = 'react-native-reanimated/plugin';
try {
  require.resolve('react-native-worklets/plugin');
  reanimatedPlugin = 'react-native-worklets/plugin';
} catch (e) {}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [reanimatedPlugin],
};
