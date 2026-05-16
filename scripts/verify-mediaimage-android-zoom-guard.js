const fs = require("fs");

const path = "components/UI/MediaViewer.tsx/MediaImage.tsx";
const source = fs.readFileSync(path, "utf8");

const withoutComments = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const zoomCallCount = (withoutComments.match(/scrollResponderZoomTo\s*\(/g) || []).length;

assert(
  withoutComments.includes('Platform } from "react-native"') ||
    withoutComments.includes("Platform } from 'react-native'") ||
    /import\s+\{[^}]*\bPlatform\b[^}]*\}\s+from\s+["']react-native["']/.test(
      withoutComments,
    ),
  "MediaImage must import Platform so Android-specific zoom behavior is explicit.",
);

assert(
  /const\s+resetZoom\s*=\s*useCallback\s*\(/.test(withoutComments),
  "MediaImage should centralize recycled/unmount zoom reset in a resetZoom callback.",
);

assert(
  /if\s*\(\s*Platform\.OS\s*!==\s*["']ios["']\s*\)\s*return\s*;[\s\S]*scrollResponderZoomTo\s*\(/.test(
    withoutComments,
  ),
  "resetZoom must return before calling scrollResponderZoomTo outside iOS.",
);

assert(
  /if\s*\(\s*Platform\.OS\s*===\s*["']ios["']\s*\)\s*\{[\s\S]*scrollResponderZoomTo\s*\(/.test(
    withoutComments,
  ),
  "Double-tap zoom must only call scrollResponderZoomTo on iOS.",
);

assert(
  zoomCallCount === 2,
  `Expected exactly two guarded scrollResponderZoomTo call sites; found ${zoomCallCount}.`,
);

console.log("MediaImage Android zoom guard present");
