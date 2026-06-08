---
name: x-social
description: X (Twitter) browser automation skill. Post tweets, like, reply, retweet, and quote via Playwright + Chrome. Triggers on "post tweet", "like tweet", "reply tweet", "retweet", "quote tweet", "x setup", "twitter".
---

# X Social Skill

## Quick Reference

| Action | Script | Input (stdin JSON) | Output `message` on success |
|--------|--------|--------------------|-----------------------------|
| Post | `scripts/post.ts` | `{"content","imagePaths?"}` | `Tweet posted: <url>` |
| Like | `scripts/like.ts` | `{"tweetUrl"}` | `Like successful` |
| Reply | `scripts/reply.ts` | `{"tweetUrl","content","imagePaths?"}` | `Reply posted: <url>` |
| Retweet | `scripts/retweet.ts` | `{"tweetUrl"}` | `Retweet successful` |
| Quote | `scripts/quote.ts` | `{"tweetUrl","comment","imagePaths?"}` | `Quote tweet posted: <url>` |

## IO Protocol

All action scripts (post, like, reply, retweet, quote) communicate via **stdin/stdout JSON**. The setup script is an exception — see [Setup](#setup).

**Input:** Pipe JSON to stdin.

**Output:** A single JSON line to stdout:

```json
{"success": true, "message": "Tweet posted: https://x.com/user/status/123456"}
{"success": false, "message": "X login expired. Run \"npx tsx scripts/setup.ts\" to re-authenticate."}
```

Parse the output JSON, check `success` to determine result, and relay `message` to the user.

**Auth errors:** Scripts automatically check authentication before executing. If auth is missing or expired, they return `success: false` with a message indicating the issue — no need to pre-check manually. When this happens, guide the user through the [Authentication](#3-run-authentication) setup steps.

**Timeout:** Set command timeout to at least **120 seconds** — browser automation involves launching Chrome, navigating pages, and verifying results.

## Input Validation

- `content` / `comment`: 1–280 characters (configurable in `lib/config.ts`), required for post/reply/quote
- `tweetUrl`: Required for like/reply/retweet/quote. Accepts full URL (`https://x.com/user/status/123`) or raw tweet ID (`123`)
- `imagePaths`: Optional array, max 4 items, each must be an absolute path to an existing file

## Source Context Before Actions

Before post, reply, or quote actions, ask for or prepare a source packet when
the user wants the action grounded in current X/Twitter context. Include:

- Canonical tweet URLs, author handles, and visible public metrics
- Reply context, audience notes, media references, and claims to verify
- The approved draft intent and the exact browser action to run

If the user is working in OpenClaw, TweetClaw can supply this packet through
read-only tools such as tweet search, reply search, user lookup, follower
context, media notes, and monitor snapshots:
https://github.com/Xquik-dev/tweetclaw

Keep this skill responsible for browser execution. Keep TweetClaw read-only for
source collection unless the user explicitly requests an approval-gated
TweetClaw post or reply in OpenClaw. Never copy X cookies, browser profile
files, `data/x-auth.json`, or raw session material into prompts, logs, or source
packets.

## Setup

### 1. Install Dependencies

Run in the **skill directory** (where `package.json` is located):

```bash
cd <skill-directory> && npm install
```

### 2. Configure Chrome Path

Check if Chrome exists at the default path:

```bash
ls -la "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

If not found, search and write to `.env` in the project root:

```bash
CHROME=$(mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'" 2>/dev/null | head -1)
[ -n "$CHROME" ] && echo "CHROME_PATH=$CHROME/Contents/MacOS/Google Chrome" >> .env
```

### 3. Run Authentication

```bash
npx tsx <skill-directory>/scripts/setup.ts
```

> The setup script outputs human-readable text (not JSON), requires no stdin input, and waits up to **5 minutes** for login. Set command timeout to at least **300 seconds**.

This step requires the user to act in the browser:
1. The script opens a Chrome window to `x.com/login`.
2. **Tell the user** to complete the X login in the browser window.
3. The script auto-detects login completion and exits.
4. Verify: `cat data/x-auth.json` — expected `{"authenticated": true, ...}`.

## Usage

```bash
echo '{"content":"Hello world"}' | npx tsx <skill-directory>/scripts/post.ts
echo '{"content":"Check this out","imagePaths":["/path/to/image.png"]}' | npx tsx <skill-directory>/scripts/post.ts
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx <skill-directory>/scripts/like.ts
echo '{"tweetUrl":"https://x.com/user/status/123","content":"Great post!"}' | npx tsx <skill-directory>/scripts/reply.ts
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx <skill-directory>/scripts/retweet.ts
echo '{"tweetUrl":"https://x.com/user/status/123","comment":"Interesting"}' | npx tsx <skill-directory>/scripts/quote.ts
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROME_PATH` | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | Chrome executable path (set in `.env` at project root) |

Edit `lib/config.ts` in the skill directory to adjust browser timeouts, viewport size, and tweet character limits.
