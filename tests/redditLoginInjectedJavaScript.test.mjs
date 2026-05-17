import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const loginSource = readFileSync(
  `${repoRoot}/components/Modals/Login.tsx`,
  "utf8",
);

test("reddit login injection leaves Reddit consent and form DOM untouched", () => {
  assert.doesNotMatch(
    loginSource,
    /modifyThroughShadowDOM|MutationObserver|querySelectorAll|display:\s*['"]none['"]/,
    "Reddit login and cookie controls are provider-owned Shadow DOM; mutating or hiding them can desync visible controls from WebView touch targets",
  );
  assert.doesNotMatch(
    loginSource,
    /auth-flow-manager[\s\S]*z-index/,
    "auth-flow-manager is a full-screen Reddit custom element; forcing its z-index can place an invisible layer over the cookie/login controls and swallow touches",
  );
  assert.match(
    loginSource,
    /true;\s*`;/,
    "react-native-webview injectedJavaScript should finish with a truthy value on Android",
  );
});
