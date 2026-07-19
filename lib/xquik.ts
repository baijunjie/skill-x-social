import type { ScriptResult } from './script.js';
import { extractTweetId } from './tweet.js';

const XQUIK_API_PATH = '/api/v1/x/tweets';
const XQUIK_DEFAULT_BASE_URL = 'https://xquik.com';

interface XquikPostInput {
  content: string;
  replyToTweetId?: string;
  successLabel: 'Tweet' | 'Reply';
}

interface XquikConfig {
  apiKey: string;
  account: string;
  baseUrl: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readXquikConfig(): XquikConfig | ScriptResult | undefined {
  const apiKey = readEnv('XQUIK_API_KEY');
  const account = readEnv('XQUIK_ACCOUNT');

  if (!apiKey && !account) {
    return undefined;
  }

  if (!apiKey || !account) {
    return {
      success: false,
      message: 'Set XQUIK_API_KEY and XQUIK_ACCOUNT to use the Xquik backend.'
    };
  }

  return {
    apiKey,
    account,
    baseUrl: readEnv('XQUIK_BASE_URL') ?? XQUIK_DEFAULT_BASE_URL
  };
}

function isScriptResult(value: ScriptResult | XquikConfig): value is ScriptResult {
  return 'success' in value;
}

function createTweetUrl(tweetId: string): string {
  return `https://x.com/i/status/${tweetId}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown; message?: unknown };
    const message = typeof body.error === 'string' ? body.error : body.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  } catch {
    // Fall back to the HTTP status below.
  }

  return `Xquik request failed with HTTP ${response.status}`;
}

export function shouldUseXquik(imagePaths?: string[]): boolean {
  if (imagePaths && imagePaths.length > 0) {
    return false;
  }

  return Boolean(readEnv('XQUIK_API_KEY') || readEnv('XQUIK_ACCOUNT'));
}

export async function postWithXquik(input: XquikPostInput): Promise<ScriptResult> {
  const config = readXquikConfig();
  if (!config) {
    return {
      success: false,
      message: 'Set XQUIK_API_KEY and XQUIK_ACCOUNT to use the Xquik backend.'
    };
  }

  if (isScriptResult(config)) {
    return config;
  }

  const endpoint = new URL(XQUIK_API_PATH, config.baseUrl);
  const payload: Record<string, string> = {
    account: config.account,
    text: input.content
  };

  if (input.replyToTweetId) {
    payload.reply_to_tweet_id = input.replyToTweetId;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return {
      success: false,
      message: `Xquik request failed: ${err instanceof Error ? err.message : 'unknown error'}`
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message: await readErrorMessage(response)
    };
  }

  let body: { tweetId?: unknown };
  try {
    body = await response.json() as { tweetId?: unknown };
  } catch {
    return {
      success: false,
      message: 'Xquik response was not valid JSON.'
    };
  }

  if (typeof body.tweetId !== 'string' || !body.tweetId.trim()) {
    return {
      success: false,
      message: 'Xquik response did not include a tweet ID.'
    };
  }

  return {
    success: true,
    message: `${input.successLabel} posted: ${createTweetUrl(body.tweetId)}`
  };
}
