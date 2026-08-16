import { useCallback, useEffect, useRef, useState } from 'react';
import type { DesktopData, SyncConfig, SyncStatus } from '../types';
import { fetchRemoteFile, pushRemoteFile, testConnection as testRemoteConnection, type TestResult } from '../lib/githubSync';

/**
 * GitHub 同步逻辑：
 * - 配置有效时页面加载自动拉取（远端较新 → 提示用户加载；本地较新 → 自动推送）
 * - 本地数据变更后 debounce 5s 自动推送（写前重取 SHA 与 updatedAt，远端较新则跳过）
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

  // 内容归一化：忽略 updatedAt 与自定义壁纸，用于比较"内容是否相同"
  const normalizeContent = (d: DesktopData) =>
    JSON.stringify({
      bookmarks: d.bookmarks,
      dockItems: d.dockItems,
      settings: {
        theme: d.settings.theme,
        accentColor: d.settings.accentColor,
        wallpaper: d.settings.wallpaper,
        showDock: d.settings.showDock,
      },
    });

  const doPush = useCallback(async () => {
    const cfg = configRef.current;
    if (!isConfigured(cfg)) return;
    setStatus({ type: 'syncing' });
    try {
      // 写前重新拉取最新 SHA 与内容，避免覆盖远端更新
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
      // 内容相同 → 跳过（避免加载云端后 debounce 生成无意义的 commit）
      if (remote && normalizeContent(dataRef.current) === normalizeContent(JSON.parse(remoteContent) as DesktopData)) {
        setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
        return;
      }
      // 远端时间戳严格更新 → 跳过（不覆盖他人改动）
      if (remote && remoteTime > (dataRef.current.updatedAt ?? 0)) {
        setStatus({ type: 'success', message: 'Cloud is up to date, skipped push' });
        return;
      }
      const now = Date.now();
      const payload: DesktopData = {
        ...dataRef.current,
        updatedAt: now,
        settings: { ...dataRef.current.settings, customWallpaper: undefined },
      };
      const payloadStr = JSON.stringify(payload);
      try {
        await pushRemoteFile(cfg, payloadStr, sha);
      } catch (e) {
        const msg = (e as Error).message;
        // 409 SHA 冲突：另一设备刚推送过，重取最新 SHA 再试一次
        if (/does not match|sha|conflict/i.test(msg)) {
          const latest = await fetchRemoteFile(cfg);
          if (latest) {
            await pushRemoteFile(cfg, payloadStr, latest.sha);
          } else {
            await pushRemoteFile(cfg, payloadStr);
          }
        } else {
          throw e;
        }
      }
      // 同步本地时间戳，避免下次推送误判"云端已是最新"
      setData((prev) => ({ ...prev, updatedAt: now }));
      setStatus({ type: 'success', message: `Synced at ${new Date(now).toLocaleTimeString()}` });
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
        // 首次使用：本地有数据则初始化云端
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
        // 内容相同（仅时间戳不同）→ 静默对齐时间戳，不提示
        if (parsed.bookmarks && parsed.settings && parsed.dockItems) {
          const remoteFull = parsed as DesktopData;
          if (normalizeContent(remoteFull) === normalizeContent(dataRef.current)) {
            setData((prev) => ({ ...prev, updatedAt: remoteTime }));
            setStatus({ type: 'idle' });
            return false;
          }
        }
        // 远端较新：合并（保留本地自定义壁纸），提示用户确认加载
        const local = dataRef.current;
        let wallpaper = parsed.settings?.wallpaper ?? local.settings.wallpaper;
        if (wallpaper === 'custom' && !local.settings.customWallpaper) {
          wallpaper = local.settings.wallpaper === 'custom' ? 'default' : local.settings.wallpaper;
        }
        const merged: DesktopData = {
          version: parsed.version ?? local.version,
          updatedAt: parsed.updatedAt ?? Date.now(),
          settings: { ...local.settings, ...parsed.settings, wallpaper },
          bookmarks: parsed.bookmarks ?? [],
          dockItems: parsed.dockItems ?? [],
        };
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
  }, [doPush]);

  // 配置有效（含首次配置）时自动拉取
  useEffect(() => {
    const cfg = configRef.current;
    const configured = isConfigured(cfg);
    if (configured && !wasConfigured.current) {
      loadRemote();
    }
    wasConfigured.current = configured;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.token, config.owner, config.repo]);

  // 本地变更 debounce 5s 自动推送
  useEffect(() => {
    if (!wasConfigured.current) return;
    if (!isConfigured(configRef.current)) return;
    const t = setTimeout(() => {
      const key = JSON.stringify({
        bookmarks: data.bookmarks,
        dockItems: data.dockItems,
        settings: {
          theme: data.settings.theme,
          accentColor: data.settings.accentColor,
          wallpaper: data.settings.wallpaper,
          showDock: data.settings.showDock,
        },
      });
      if (key === lastPushedKey.current) return;
      lastPushedKey.current = key;
      doPush();
    }, 5000);
    return () => clearTimeout(t);
  }, [data, doPush]);

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
