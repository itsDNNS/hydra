import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const modalContextSource = readFileSync(
  `${repoRoot}/contexts/ModalContext.tsx`,
  "utf8",
);

test("modal animation moves login WebViews with layout instead of a transform", () => {
  assert.doesNotMatch(
    modalContextSource,
    /transform\s*:/,
    "Android WebView children do not receive touches reliably when a native parent transform visually moves them",
  );
  assert.match(
    modalContextSource,
    /position:\s*"absolute"/,
    "the modal layer must be an absolute overlay; a relative view rendered after app children starts below the screen instead of covering it",
  );
  assert.match(
    modalContextSource,
    /bottom:\s*0/,
    "the modal layer must have a real full-screen native hit-test box; absolute children do not give their parent touch bounds for Android WebViews",
  );
  assert.match(
    modalContextSource,
    /top:\s*modalPosition/,
    "the modal container should animate layout position so native WebView hit regions match the visible screen position",
  );
  assert.match(
    modalContextSource,
    /useNativeDriver:\s*false/,
    "layout-position animation cannot use the native transform driver",
  );
});

test("modal container is rendered after app children so it owns Android hit testing", () => {
  assert.match(
    modalContextSource,
    /<ModalContext\.Provider value=\{value\}>\s*\{children\}\s*\{modal \? \(\s*<Animated\.View/,
    "Android zIndex can draw a native WebView modal above siblings while touch/accessibility hit testing still sees the later app children; render the modal after children",
  );
  assert.match(
    modalContextSource,
    /pointerEvents="auto"/,
    "the active top-level modal layer should own touches",
  );
  assert.match(
    modalContextSource,
    /\) : null\}/,
    "do not render an empty top-level modal layer when no modal is active because it can block the underlying app on Android",
  );
});
