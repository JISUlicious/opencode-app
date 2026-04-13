/**
 * Local model auto-detection for OpenAI-compatible servers.
 * Probes well-known local endpoints (Ollama, LM Studio, vLLM)
 * and returns any that respond to /v1/models.
 */

export interface LocalProviderInfo {
  name: string;
  baseUrl: string;
  modelsEndpoint: string;
  models: string[];
  detected: boolean;
}

const LOCAL_ENDPOINTS: Omit<LocalProviderInfo, "models" | "detected">[] = [
  {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    modelsEndpoint: "http://localhost:11434/v1/models",
  },
  {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    modelsEndpoint: "http://localhost:1234/v1/models",
  },
  {
    name: "vLLM",
    baseUrl: "http://localhost:8000/v1",
    modelsEndpoint: "http://localhost:8000/v1/models",
  },
];

async function probeEndpoint(
  endpoint: Omit<LocalProviderInfo, "models" | "detected">,
): Promise<LocalProviderInfo> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(endpoint.modelsEndpoint, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ...endpoint, models: [], detected: false };
    }

    const data = (await response.json()) as { data?: { id: string }[] };
    const models = (data.data ?? []).map((m) => m.id).filter(Boolean);

    return { ...endpoint, models, detected: true };
  } catch {
    return { ...endpoint, models: [], detected: false };
  }
}

/**
 * Probe all known local endpoints in parallel.
 * Returns only those that are running and responded.
 */
export async function detectLocalProviders(): Promise<LocalProviderInfo[]> {
  const results = await Promise.all(LOCAL_ENDPOINTS.map(probeEndpoint));
  return results.filter((r) => r.detected);
}

/**
 * Test a custom OpenAI-compatible endpoint.
 * Returns model list on success, empty array on failure.
 */
export async function testCustomEndpoint(
  baseUrl: string,
  apiKey?: string,
): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const url = baseUrl.replace(/\/+$/, "") + "/models";
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, models: [], error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = (await response.json()) as { data?: { id: string }[] };
    const models = (data.data ?? []).map((m) => m.id).filter(Boolean);

    return { ok: true, models };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return { ok: false, models: [], error: message };
  }
}
