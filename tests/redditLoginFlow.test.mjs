import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const buildDir = mkdtempSync(path.join(tmpdir(), "hydra-reddit-login-flow-"));

writeFileSync(path.join(buildDir, "package.json"), '{"type":"module"}\n');
process.on("exit", () => rmSync(buildDir, { recursive: true, force: true }));

execFileSync(
  path.join(repoRoot, "node_modules", ".bin", "tsc"),
  [
    "utils/RedditLoginFlow.ts",
    "--target",
    "ES2022",
    "--module",
    "ES2022",
    "--moduleResolution",
    "Bundler",
    "--outDir",
    buildDir,
  ],
  { cwd: repoRoot, stdio: "inherit" },
);

const { shouldFinishRedditLogin } = await import(
  pathToFileURL(path.join(buildDir, "RedditLoginFlow.js"))
);

test("Reddit login does not finish on the post-login destination URL without a session cookie", () => {
  assert.equal(
    shouldFinishRedditLogin({
      hasSessionCookie: false,
      url: "https://www.reddit.com/r/HydraClient",
    }),
    false,
  );
});

test("Reddit login does not finish on signup, consent, policy, or challenge flow URLs without a session cookie", () => {
  const intermediateUrls = [
    "https://www.reddit.com/register/",
    "https://www.reddit.com/account/register/",
    "https://www.reddit.com/account/login/",
    "https://www.reddit.com/login/?experiment=login_webview",
    "https://www.reddit.com/account/login/challenge/",
    "https://www.reddit.com/account/login/2fa/",
    "https://www.redditinc.com/policies/user-agreement",
    "https://www.redditinc.com/policies/privacy-policy",
    "https://www.reddit.com/policies/privacy-policy",
  ];

  for (const url of intermediateUrls) {
    assert.equal(
      shouldFinishRedditLogin({ hasSessionCookie: false, url }),
      false,
      `${url} should stay inside the login WebView until Reddit sets reddit_session`,
    );
  }
});

test("Reddit login finishes after the reddit_session cookie is present", () => {
  assert.equal(
    shouldFinishRedditLogin({
      hasSessionCookie: true,
      url: "https://www.reddit.com/r/HydraClient",
    }),
    true,
  );
});
