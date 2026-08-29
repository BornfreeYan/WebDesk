import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesktopData, SyncConfig, SyncStatus } from '../types';
import { fetchRemoteFile, pushRemoteFile, testConnection as testRemoteConnection, type TestResult } from '../lib/githubSync';

function mergeRemote(parsed: Partial<DesktopData>, local: DesktopData): DesktopData {
  let wallpaper = parsed.settings?.wallpaper ?? local.settings.wallpaper;
  if (wallpaper === 'custom' && !local.settings.customWallpaper) {
    wallpaper = local.settings.wallpaper === 'custom' ? 'default' : local.settings.wallpaper;
  }
  return {
    version: parsed.version ?? local.version,
    updatedAt: parsed.updatedAt ?? Date.now(),
    settings: { ...local.settings, ...parsed.settings, wallpaper, showDock: true },
    bookmarks: parsed.bookmarks ?? [],
    dockItems: parsed.dockItems ?? [],
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

  const normalizeContent = (d: DesktopData) =>
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

  const doPush = useCallback(async () => {
    const cfg = configRef.current;
    if (!isConfigured(cfg)) return;
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
          if (normalizeContent(dataRef.current) === normalizeContent(JSON.parse(remoteContent) as DesktopData)) {
            setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
            return;
          }
        } catch {
          // 远端 JSON 损坏则继续尝试覆盖写入
        }
      }
      if (remote && remoteTime > (dataRef.current.updatedAt ?? 0)) {
        setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
        return;
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
                return;
              }
              setStatus({ type: 'error', message: 'Cloud changed; reload and try again' });
              return;
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
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
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
          if (normalizeContent(remoteFull) === normalizeContent(dataRef.current)) {
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
    const t = setTimeout(() => {
      const key = contentKey(data);
      if (key === lastPushedKey.current) return;
      lastPushedKey.current = key;
      doPush();
    }, 5000);
    return () => clearTimeout(t);
  }, [data, doPush]);

  useEffect(() => {
    const flush = () => {
      if (!wasConfigured.current || !isConfigured(configRef.current)) return;
      void doPush();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
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
