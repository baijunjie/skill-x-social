import assert from 'node:assert/strict';
import test from 'node:test';

import { postWithXquik, shouldUseXquik } from '../lib/xquik.js';

test('posts text with the configured account and API key', async (context) => {
  const originalApiKey = process.env.XQUIK_API_KEY;
  const originalAccount = process.env.XQUIK_ACCOUNT;
  const originalFetch = globalThis.fetch;

  process.env.XQUIK_API_KEY = 'test-key';
  process.env.XQUIK_ACCOUNT = '@example';

  context.after(() => {
    if (originalApiKey === undefined) delete process.env.XQUIK_API_KEY;
    else process.env.XQUIK_API_KEY = originalApiKey;
    if (originalAccount === undefined) delete process.env.XQUIK_ACCOUNT;
    else process.env.XQUIK_ACCOUNT = originalAccount;
    globalThis.fetch = originalFetch;
  });

  let requestBody: unknown;
  let requestHeaders: Headers | undefined;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    requestHeaders = new Headers(init?.headers);
    return new Response(JSON.stringify({ tweetId: '1234567890' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  const result = await postWithXquik({
    content: 'Hello',
    replyToTweetId: '9876543210',
    successLabel: 'Reply'
  });

  assert.deepEqual(requestBody, {
    account: '@example',
    text: 'Hello',
    reply_to_tweet_id: '9876543210'
  });
  assert.equal(requestHeaders?.get('x-api-key'), 'test-key');
  assert.deepEqual(result, {
    success: true,
    message: 'Reply posted: https://x.com/i/status/1234567890'
  });
  assert.equal(shouldUseXquik(), true);
  assert.equal(shouldUseXquik(['/tmp/image.png']), false);
});
