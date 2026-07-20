// Powered by OnSpace.AI
// Standard Expo Metro configuration.
//
// Reverted to Expo's defaults on purpose. Earlier revisions added a custom
// resolveRequest that (a) deduped @react-navigation / react-native-screens /
// react-native-safe-area-context to a single copy and (b) rerouted those
// packages' native component specs to hand-ported Flow shims under shims/.
// Both workarounds targeted OnSpace's in-editor preview toolchain, but the
// spec-shim reroute ran ONLY on ios/android builds and fed the JS runtime view
// configs that did not match the components a real (EAS) build compiles
// natively - so the app hung on the splash screen when built outside OnSpace.
// getDefaultConfig already enables symlink-aware resolution and package
// "exports" in SDK 53, so no custom resolver is needed for a real build.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Route Babel transforms through a thin wrapper that forces every
// require('@react-native/codegen') to resolve to the STABLE copy react-native
// itself depends on, instead of the broken 0.79.0-rc.4 nested under
// @react-native/babel-plugin-codegen. That rc.4 parser throws
// "Could not find component config for native component" on valid
// codegenNativeComponent specs (react-native-safe-area-context / -screens) and
// aborts the Android/iOS bundle. The repo-level pnpm version pins are not
// honored by the build server for this transitive package (no committed
// lockfile, yet the override never changes the resolved rc.4), and
// package.json's pnpm.overrides is protected — so the fix is applied here, at
// the Metro transform step, which the build server does execute. The wrapper
// re-exports Expo's real transformer and falls back to default resolution if
// react-native cannot be located, so it never makes bundling worse.
config.transformer.babelTransformerPath = path.resolve(
  __dirname,
  'stubs/codegen-fix-transformer.js',
);

module.exports = config;
