import assert from 'node:assert/strict';
import test from 'node:test';

import { extractTweetId, resolveTweetUrl } from '../lib/tweet.js';

test('resolves raw IDs and supported tweet URLs to a canonical URL', () => {
  const references = [
    '1234567890',
    'https://x.com/example/status/1234567890',
    'https://x.com/i/web/status/1234567890',
    'https://twitter.com/example/status/1234567890?ref=share'
  ];

  for (const reference of references) {
    assert.equal(extractTweetId(reference), '1234567890');
    assert.equal(resolveTweetUrl(reference), 'https://x.com/i/status/1234567890');
  }
});

test('rejects lookalike domains and unrelated URLs', () => {
  const references = [
    'https://example.com/status/1234567890',
    'https://x.com/example/profile',
    'not-a-tweet'
  ];

  for (const reference of references) {
    assert.equal(extractTweetId(reference), undefined);
    assert.equal(resolveTweetUrl(reference), undefined);
  }
});
