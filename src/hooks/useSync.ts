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

  const doPush = useCallback(async () => {
    const cfg = configRef.current;
    if (!isConfigured(cfg)) return;
    setStatus({ type: 'syncing' });
    try {
      // 写前重新拉取最新 SHA 与内容，避免覆盖远端更新
      let sha: string | undefined;
      let remoteTime = 0;
      const remote = await fetchRemoteFile(cfg);
      if (remote) {
        sha = remote.sha;
        try {
          const parsed = JSON.parse(remote.content) as Partial<DesktopData>;
          remoteTime = parsed.updatedAt ?? 0;
        } catch {
          remoteTime = 0;
        }
      }
      // 只有远端严格更新才跳过：本地时间戳只在推送成功后更新，
      // 本地内容变更（如删除）不会刷新时间戳，相等时必须推送
      if (remote && remoteTime > (dataRef.current.updatedAt ?? 0)) {
        setStatus({ type: 'success', message: '云端已是最新，跳过推送' });
        return;
      }
      const now = Date.now();
      const payload: DesktopData = {
        ...dataRef.current,
        updatedAt: now,
        settings: { ...dataRef.current.settings, customWallpaper: undefined },
      };
      await pushRemoteFile(cfg, JSON.stringify(payload), sha);
      // 同步本地时间戳，避免下次推送误判"云端已是最新"
      setData((prev) => ({ ...prev, updatedAt: now }));
      setStatus({ type: 'success', message: `已同步 ${new Date(now).toLocaleTimeString()}` });
    } catch (e) {
      setStatus({ type: 'error', message: (e as Error).message });
    }
  }, []);

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
        setStatus({ type: 'success', message: '发现云端更新' });
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
