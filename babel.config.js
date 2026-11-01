module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Must be listed last. Reanimated 4 (Expo SDK 54) moved its worklets
      // into react-native-worklets; the old path only re-exports this one.
      'react-native-worklets/plugin',
    ],
  };
};
