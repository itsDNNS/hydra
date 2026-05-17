import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const loginSource = readFileSync(
  `${repoRoot}/components/Modals/Login.tsx`,
  "utf8",
);

test("reddit login WebView opts into Android hardware layer for reliable touch dispatch", () => {
  assert.match(
    loginSource,
    /<WebView[\s\S]*androidLayerType="hardware"/,
    "Android WebView touch dispatch can fail inside the login modal unless the WebView owns a hardware layer",
  );
});
