import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesktopData, SyncConfig, SyncStatus } from '../types';
import { fetchRemoteFile, pushRemoteFile, testConnection as testRemoteConnection, type TestResult } from '../lib/githubSync';
import { sanitizeDesktopData } from '../lib/sanitize';

/**
 * 云端数据 → 本地可用的整份数据。
 * 云端可能被手改过或来自旧版本，过一遍 sanitize，坏节点丢掉而不是让桌面白屏。
 */
function mergeRemote(parsed: Partial<DesktopData>, local: DesktopData): DesktopData {
  const clean = sanitizeDesktopData(parsed);
  if (!clean) return local;
  let wallpaper = clean.settings.wallpaper;
  if (wallpaper === 'custom' && !local.settings.customWallpaper) {
    wallpaper = local.settings.wallpaper === 'custom' ? 'default' : local.settings.wallpaper;
  }
  return {
    ...clean,
    settings: { ...local.settings, ...clean.settings, wallpaper, showDock: true },
  };
}

/**
 * GitHub 同步逻辑：
 * - 配置有效时页面加载自动拉取（远端较新 → 提示用户加载；本地较新 → 自动推送）
 * - 本地数据变更后 debounce 5s 自动推送（写前重取 SHA 与 updatedAt，远端较新则跳过）
 * - 409 时重取远端：较新则提示加载，不盲覆盖
 * - 自定义壁纸（base64）不参与同步
 */
export function useSync(
  data: DesktopData,
  setData: (updater: React.SetStateAction<DesktopData>) => void,
  config: SyncConfig
) {
  const [status, setStatus] = useState<SyncStatus>({ type: 'idle' });
  const [pendingRemote, setPendingRemote] = useState<DesktopData | null>(null);

  const configRef = useRef(config);
  configRef.current = config;
  const dataRef = useRef(data);
  dataRef.current = data;
  const wasConfigured = useRef(false);
  const lastPushedKey = useRef('');

  const isConfigured = (cfg: SyncConfig) => !!(cfg.token && cfg.owner && cfg.repo);

  /** 参与同步的内容指纹：只包含书签、Dock 与基本设置（自定义壁纸不同步）。 */
  const contentKey = (d: DesktopData) =>
    JSON.stringify({
      bookmarks: d.bookmarks,
      dockItems: d.dockItems,
      settings: {
        theme: d.settings.theme,
        accentColor: d.settings.accentColor,
        wallpaper: d.settings.wallpaper,
        showDock: true,
      },
    });

  /**
   * 推送本地数据。
   *
   * 返回值表示「这份数据现在是否已经安全地反映在云端」：
   * - true：推送成功，或云端内容本来就与本地一致（无需推）
   * - false：确定没有推上去（网络失败、权限不足、远端更新被跳过等）
   *
   * 调用方据此决定要不要记 `lastPushedKey`——以前是先记账再推，
   * 推送失败后同样的数据再也不会被防抖触发，只能靠手动同步兜底。
   */
  const doPush = useCallback(async (): Promise<boolean> => {
    const cfg = configRef.current;
    if (!isConfigured(cfg)) return false;
    setStatus({ type: 'syncing' });
    try {
      let sha: string | undefined;
      let remoteTime = 0;
      let remoteContent = '';
      const remote = await fetchRemoteFile(cfg);
      if (remote) {
        sha = remote.sha;
        remoteContent = remote.content;
        try {
          const parsed = JSON.parse(remote.content) as Partial<DesktopData>;
          remoteTime = parsed.updatedAt ?? 0;
        } catch {
          remoteTime = 0;
        }
      }
      if (remote) {
        try {
          if (contentKey(dataRef.current) === contentKey(JSON.parse(remoteContent) as DesktopData)) {
            setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
            return true; // 云端已是这份内容，算式"已同步"
          }
        } catch {
          // 远端 JSON 损坏则继续尝试覆盖写入
        }
      }
      if (remote && remoteTime > (dataRef.current.updatedAt ?? 0)) {
        setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
        return false; // 云端更新，本机这份没推上去
      }
      const stamp = dataRef.current.updatedAt ?? Date.now();
      const payload: DesktopData = {
        ...dataRef.current,
        updatedAt: stamp,
        settings: { ...dataRef.current.settings, customWallpaper: undefined, showDock: true },
      };
      const payloadStr = JSON.stringify(payload);
      try {
        await pushRemoteFile(cfg, payloadStr, sha);
      } catch (e) {
        const msg = (e as Error).message;
        if (/does not match|sha|conflict/i.test(msg)) {
          const latest = await fetchRemoteFile(cfg);
          if (!latest) {
            await pushRemoteFile(cfg, payloadStr);
          } else {
            let latestTime = 0;
            let latestParsed: Partial<DesktopData> | null = null;
            try {
              latestParsed = JSON.parse(latest.content) as Partial<DesktopData>;
              latestTime = latestParsed.updatedAt ?? 0;
            } catch {
              latestTime = 0;
            }
            if (latestTime > (dataRef.current.updatedAt ?? 0)) {
              if (latestParsed?.bookmarks && latestParsed.settings && latestParsed.dockItems) {
                setPendingRemote(mergeRemote(latestParsed, dataRef.current));
                setStatus({ type: 'success', message: 'Cloud update found' });
                return false;
              }
              setStatus({ type: 'error', message: 'Cloud changed; reload and try again' });
              return false;
            }
            await pushRemoteFile(cfg, payloadStr, latest.sha);
          }
        } else {
          throw e;
        }
      }
      if (!dataRef.current.updatedAt) {
        setData((prev) => ({ ...prev, updatedAt: stamp }));
      }
      setStatus({ type: 'success', message: `Synced at ${new Date(stamp).toLocaleTimeString()}` });
      return true;
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
      return false;
    }
  }, [setData]);

  const loadRemote = useCallback(async (): Promise<boolean> => {
    const cfg = configRef.current;
    if (!isConfigured(cfg)) return false;
    setStatus({ type: 'syncing' });
    try {
      const remote = await fetchRemoteFile(cfg);
      if (!remote) {
        const local = dataRef.current;
        if (local.bookmarks.length > 0 || local.dockItems.length > 0) {
          await doPush();
        } else {
          setStatus({ type: 'idle' });
        }
        return false;
      }

      const parsed = JSON.parse(remote.content) as Partial<DesktopData>;
      const remoteTime = parsed.updatedAt ?? 0;
      const localTime = dataRef.current.updatedAt ?? 0;

      if (remoteTime > localTime) {
        if (parsed.bookmarks && parsed.settings && parsed.dockItems) {
          const remoteFull = parsed as DesktopData;
          if (contentKey(remoteFull) === contentKey(dataRef.current)) {
            setData((prev) => ({ ...prev, updatedAt: remoteTime }));
            setStatus({ type: 'idle' });
            return false;
          }
        }
        const merged = mergeRemote(parsed, dataRef.current);
        setPendingRemote(merged);
        setStatus({ type: 'success', message: 'Cloud update found' });
        return true;
      }

      if (localTime > remoteTime) {
        await doPush();
      } else {
        setStatus({ type: 'idle' });
      }
      return false;
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
      return false;
    }
  }, [doPush, setData]);

  useEffect(() => {
    const cfg = configRef.current;
    const configured = isConfigured(cfg);
    if (configured && !wasConfigured.current) {
      loadRemote();
    }
    wasConfigured.current = configured;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.token, config.owner, config.repo]);

  useEffect(() => {
    if (!wasConfigured.current) return;
    if (!isConfigured(configRef.current)) return;
    const pendingKey = contentKey(data);
    if (pendingKey === lastPushedKey.current) return;
    const t = setTimeout(async () => {
      // 只有真的落到云端才记账。以前先记后推，一旦这次失败（断网 / 403 / 远端更新），
      // 同样的数据再也不会被防抖触发，只能等手动同步。
      const ok = await doPush();
      if (ok) lastPushedKey.current = pendingKey;
    }, 5000);
    return () => clearTimeout(t);
  }, [data, doPush]);

  useEffect(() => {
    const flush = async () => {
      if (!wasConfigured.current || !isConfigured(configRef.current)) return;
      const key = contentKey(dataRef.current);
      if (key === lastPushedKey.current) return;
      if (await doPush()) lastPushedKey.current = key;
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [doPush]);

  const applyPendingRemote = useCallback(() => {
    setPendingRemote((p) => {
      if (p) setData(p);
      return null;
    });
  }, [setData]);

  const dismissPendingRemote = useCallback(() => setPendingRemote(null), []);

  const testConnection = useCallback((cfg: SyncConfig): Promise<TestResult> => testRemoteConnection(cfg), []);

  return {
    status,
    pendingRemote,
    testConnection,
    manualSync: loadRemote,
    applyPendingRemote,
    dismissPendingRemote,
  };
}
