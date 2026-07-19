const RAW_TWEET_ID_PATTERN = /^\d{1,25}$/;
const TWEET_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/(?:[A-Za-z0-9_]+|i\/web)\/status\/(\d{1,25})(?:[/?#]|$)/i;

export function extractTweetId(input: string): string | undefined {
  const trimmed = input.trim();
  if (RAW_TWEET_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return TWEET_URL_PATTERN.exec(trimmed)?.[1];
}

export function resolveTweetUrl(input: string): string | undefined {
  const tweetId = extractTweetId(input);
  return tweetId ? `https://x.com/i/status/${tweetId}` : undefined;
}
