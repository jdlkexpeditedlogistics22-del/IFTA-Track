// Powered by OnSpace.AI
//
// Pins @react-native/codegen to the STABLE version that matches
// react-native@0.79.6, everywhere it appears in the dependency graph.
//
// WHY THIS FILE EXISTS
// --------------------
// An Android/iOS build failed while Metro bundled the native component specs of
// react-native-safe-area-context (and react-native-screens):
//
//     SyntaxError: .../react-native-safe-area-context/src/specs/NativeSafeAreaView.ts:
//       Could not find component config for native component
//         at throwIfConfigNotfound (@react-native/codegen/lib/parsers/error-utils.js)
//         at findComponentConfig   (@react-native/codegen/lib/parsers/parsers-commons.js)
//
// ROOT CAUSE
// ----------
// The sandbox resolved @react-native/codegen@0.79.0-rc.4 - a PRERELEASE - for
// @react-native/babel-plugin-codegen (it nests its own copy of codegen). That
// release candidate's parser is broken and throws the error above on perfectly
// valid `codegenNativeComponent<NativeProps>(...)` specs, so the bundle aborts.
// react-native@0.79.6 expects the matching stable codegen, @react-native/codegen@0.79.6,
// whose parser reads those same specs correctly.
//
// WHY THIS APPROACH (instead of the old Flow shims)
// -------------------------------------------------
// Earlier revisions rerouted these packages' native specs to hand-ported Flow
// shims so the broken RC codegen would not choke. That fixed the build but fed
// the JS runtime view configs that did not match the components a real (EAS)
// build compiles natively - so the app hung on the splash screen when built
// outside OnSpace. Pinning codegen to the correct stable version fixes the build
// at its source: the real specs parse, and the generated view configs match the
// native components exactly. No shims, no runtime mismatch.
//
// readPackage runs during dependency resolution (pnpm), so rewriting the codegen
// spec on every package that depends on it forces a single, correct copy.

const CODEGEN = '@react-native/codegen';
const BABEL_CODEGEN = '@react-native/babel-plugin-codegen';
// Use a RANGE, not an exact version. @react-native/codegen is NOT published at
// every react-native patch, so an exact "0.79.6" cannot resolve and the pin
// silently no-ops (which is why the prerelease 0.79.0-rc.4 kept winning).
// ~0.79.0 (>=0.79.0 <0.80.0) resolves to whatever stable 0.79.x IS published
// and, per semver, EXCLUDES the broken 0.79.0-rc.4 prerelease.
const PINNED = '~0.79.0';

function pinCodegen(deps) {
  if (deps && typeof deps === 'object') {
    if (deps[CODEGEN] && deps[CODEGEN] !== PINNED) {
      deps[CODEGEN] = PINNED;
    }
    // The package that pulls the rc codegen — keep it on the same stable line.
    if (deps[BABEL_CODEGEN] && deps[BABEL_CODEGEN] !== PINNED) {
      deps[BABEL_CODEGEN] = PINNED;
    }
  }
}

// --- Keep expo-modules-core on its Expo SDK 53 line --------------------------
//
// WHY THIS EXISTS
// ---------------
// The Android build failed compiling expo-modules-core@2.5.0 with "cannot find
// symbol" for its ENTIRE classpath (androidx.annotation, kotlin,
// expo.modules.kotlin, com.facebook.react.bridge). expo-modules-core@2.5.0 is an
// Expo SDK 54 build; this project is SDK 53 (react-native 0.79.6), whose bundled
// expo-modules-core is on the 2.4.x line. When the frozen lockfile was disabled,
// a transitive `^2.4.0` range re-resolved UP to 2.5.0, and that newer module is
// compiled against a newer RN / Gradle toolchain than SDK 53 provides — so none
// of its dependencies land on the javac compile classpath.
//
// Capping every dependency spec to the 2.4.x line (>=2.4.0 <2.5.0) forces the
// resolver back onto the SDK-53-compatible expo-modules-core, wherever it is
// requested in the graph. readPackage runs during pnpm resolution, so this is
// applied once, consistently, for every dependent package.
const EMC = 'expo-modules-core';
const EMC_RANGE = '~2.4.0'; // >=2.4.0 <2.5.0 — the Expo SDK 53 line

function capExpoModulesCore(deps) {
  if (deps && typeof deps === 'object' && deps[EMC]) {
    deps[EMC] = EMC_RANGE;
  }
}

// --- Repair babel-plugin-syntax-hermes-parser's entry point ------------------
//
// WHY THIS EXISTS
// ---------------
// Web bundling aborted while babel-preset-expo loaded its Flow parser plugin:
//
//     SyntaxError: Cannot find module
//       '.../babel-preset-expo/node_modules/babel-plugin-syntax-hermes-parser/index.js'.
//       Please verify that the package.json has a valid "main" entry
//       (While processing: '.../babel-preset-expo/build/index.js')
//
// The installed copy of babel-plugin-syntax-hermes-parser declares its `main`
// as a bare "index.js", but the package actually ships its built entry at
// `dist/index.js` (there is no top-level index.js). So `require('babel-plugin-
// syntax-hermes-parser')` from babel-preset-expo resolves to a file that does
// not exist and the whole preset fails to load, taking every bundle with it.
//
// readPackage runs during pnpm resolution, so rewriting the manifest's `main`
// to the file that is genuinely present fixes the require at its source for
// every copy in the graph, with no node_modules patching.
const HERMES_PLUGIN = 'babel-plugin-syntax-hermes-parser';

function fixHermesParserMain(pkg) {
  if (pkg && pkg.name === HERMES_PLUGIN) {
    if (!pkg.main || pkg.main === 'index.js' || pkg.main === './index.js') {
      pkg.main = 'dist/index.js';
    }
  }
}

function readPackage(pkg) {
  // Never rewrite codegen's OWN manifest - only rewrite where OTHER packages
  // (notably @react-native/babel-plugin-codegen) depend on it.
  if (pkg && pkg.name !== CODEGEN) {
    pinCodegen(pkg.dependencies);
    pinCodegen(pkg.devDependencies);
    pinCodegen(pkg.optionalDependencies);
    pinCodegen(pkg.peerDependencies);
  }
  // Likewise, never rewrite expo-modules-core's OWN manifest — only cap the
  // version wherever OTHER packages depend on it, so it stays on the SDK 53 line.
  if (pkg && pkg.name !== EMC) {
    capExpoModulesCore(pkg.dependencies);
    capExpoModulesCore(pkg.devDependencies);
    capExpoModulesCore(pkg.optionalDependencies);
    capExpoModulesCore(pkg.peerDependencies);
  }
  fixHermesParserMain(pkg);
  return pkg;
}

module.exports = {
  hooks: { readPackage },
};
