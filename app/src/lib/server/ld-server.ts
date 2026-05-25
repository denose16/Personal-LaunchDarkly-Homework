import { init, type LDClient } from "@launchdarkly/node-server-sdk";
import { initAi, type LDAIClient } from "@launchdarkly/server-sdk-ai";

// Lazy singletons. Vercel serverless functions re-use these within a single
// instance; cold-start re-inits. Init is ~50ms so this is acceptable.
let _ldClient: LDClient | null = null;
let _aiClient: LDAIClient | null = null;

export async function getLDClient(): Promise<LDClient> {
  if (_ldClient) return _ldClient;

  const sdkKey = process.env.LD_SDK_KEY;
  if (!sdkKey) {
    throw new Error(
      "LD_SDK_KEY missing from environment — server-side LD client cannot init."
    );
  }

  _ldClient = init(sdkKey);
  await _ldClient.waitForInitialization({ timeout: 5 });
  return _ldClient;
}

export async function getAIClient(): Promise<LDAIClient> {
  if (_aiClient) return _aiClient;
  const ld = await getLDClient();
  _aiClient = initAi(ld);
  return _aiClient;
}
