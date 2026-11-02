module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // The web bundle loads as a classic script, where `import.meta` is a
          // syntax error. From SDK 54 Metro resolves packages' ES-module
          // builds, and zustand's middleware reads `import.meta.env`: CI's
          // clean build rendered a blank page ("Cannot use 'import.meta'
          // outside a module"), while a stale local cache hid it (2026-11-02).
          unstable_transformImportMeta: true,
        },
      ],
      'nativewind/babel',
    ],
    plugins: [
      // Must be listed last. Reanimated 4 (Expo SDK 54) moved its worklets
      // into react-native-worklets; the old path only re-exports this one.
      'react-native-worklets/plugin',
    ],
  };
};
