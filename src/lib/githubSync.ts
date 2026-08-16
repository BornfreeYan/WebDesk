import type { SyncConfig } from '../types';

const API_BASE = 'https://api.github.com';
const DATA_FILE = 'webdesk-data.json';

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function buildHeaders(config: SyncConfig, extra?: Record<string, string>): HeadersInit {
  return {
    'Authorization': `Bearer ${config.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

export interface RemoteFile {
  content: string;
  sha: string;
}

export interface TestResult {
  ok: boolean;
  message: string;
}

/** 测试 token 与仓库的连通性 */
export async function testConnection(config: SyncConfig): Promise<TestResult> {
  try {
    const res = await fetch(`${API_BASE}/repos/${config.owner}/${config.repo}`, {
      headers: buildHeaders(config),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: 'Token is invalid or lacks permission. Please check your token.' };
    }
    if (res.status === 404) {
      return { ok: false, message: 'Repository not found. Please check the Owner / Repo names.' };
    }
    if (!res.ok) {
      return { ok: false, message: `Connection failed (HTTP ${res.status})` };
    }
    return { ok: true, message: 'Connection OK, token and repo are valid' };
  } catch (e) {
    return { ok: false, message: `Network error: ${(e as Error).message}` };
  }
}

/** 读取远程数据文件；不存在时返回 null */
export async function fetchRemoteFile(config: SyncConfig): Promise<RemoteFile | null> {
  const res = await fetch(`${API_BASE}/repos/${config.owner}/${config.repo}/contents/${DATA_FILE}?ref=${config.branch}`, {
    headers: buildHeaders(config),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Fetch failed (HTTP ${res.status})`);
  }
  const json = await res.json();
  return { content: decodeBase64(json.content), sha: json.sha };
}

/** 写入远程数据文件；sha 为空表示首次创建 */
export async function pushRemoteFile(config: SyncConfig, content: string, sha?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/${config.owner}/${config.repo}/contents/${DATA_FILE}`, {
    method: 'PUT',
    headers: buildHeaders(config, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message: `WebDesk sync ${new Date().toISOString()}`,
      content: encodeBase64(content),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Push failed (HTTP ${res.status})`);
  }
}
