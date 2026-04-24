import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:4000';
const DEFAULT_TIMEOUT_MS = 16000;

function normalizeBaseUrl(url) {
  return (url || '').replace(/\/+$/, '');
}

function inferExpoHostBaseUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const match = scriptURL.match(/^[a-z]+:\/\/([^/:]+)(?::\d+)?/i);
  if (!match?.[1]) return null;
  return `http://${match[1]}:4000`;
}

function getCandidateBaseUrls() {
  const configured = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL);
  const inferred = normalizeBaseUrl(inferExpoHostBaseUrl());

  return [configured, inferred].filter((value, index, list) => value && list.indexOf(value) === index);
}

export function getApiBaseUrl() {
  return getCandidateBaseUrls()[0] || DEFAULT_API_URL;
}

async function fetchWithBaseUrl(baseUrl, path, { token, method = 'GET', body, headers } = {}) {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiFetch(path, options = {}) {
  const baseUrls = getCandidateBaseUrls();
  let lastError;

  for (const baseUrl of baseUrls) {
    try {
      return await fetchWithBaseUrl(baseUrl, path, options);
    } catch (error) {
      lastError = error;

      // Try the next server address only for timeout or network errors.
      if (error.name !== 'AbortError' && error.message !== 'Network request failed') {
        throw error;
      }
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error(
      `Server took too long to respond. Tried: ${baseUrls.join(', ')}. Check that the backend is running and reachable from your phone.`
    );
  }

  if (lastError?.message === 'Network request failed') {
    throw new Error(
      `Cannot reach the backend. Tried: ${baseUrls.join(', ')}. Make sure the server is running and your phone is on the same network.`
    );
  }

  throw lastError;
}
