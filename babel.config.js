// Powered by OnSpace.AI
//
// Minimal Babel config for Expo SDK 53 / React Native 0.79.
//
// WHY THIS IS MINIMAL (do not re-add a hermes-parser override):
//   A previous revision reinforced `babel-plugin-syntax-hermes-parser` here,
//   scoped to react-native / @react-native source AND to our local Flow shims,
//   to work around pnpm setups where the preset's hermes wiring seemed not to
//   take effect (which broke parsing of React Native 0.79 Flow `as` casts).
//
//   In the current toolchain, `babel-preset-expo` (via @react-native/babel-preset)
//   ALREADY registers `babel-plugin-syntax-hermes-parser` for every `@flow` file
//   it processes. Adding our own copy meant TWO plugins registered a
//   `parserOverride`, so Babel aborts bundling with:
//
//       "More than one plugin attempted to override parsing."
//
//   (observed on web while parsing
//    node_modules/@react-native/js-polyfills/error-guard.js, an `@flow` file).
//
//   So we rely solely on the preset, which registers a SINGLE parserOverride:
//     * React Native's Flow `as` casts (node_modules `@flow` source)
//         -> handled by the preset's hermes-parser.
//     * Our shims/**/*.js  (they carry an `@flow` pragma and use ONLY standard
//       Flow syntax -- generic calls like codegenNativeComponent<Props>(...),
//       $ReadOnly<{...}> and React.ElementRef<T>; NO `as` casts)
//         -> handled by the same preset (hermes-parser / flow-strip-types).
//   babel-plugin-codegen still re-parses those shims with its own (working)
//   Flow parser, which is the whole reason the shims are `.js`/Flow.

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
