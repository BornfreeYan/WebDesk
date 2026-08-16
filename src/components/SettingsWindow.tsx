import { useState, useRef, useEffect } from 'react';
import type { DesktopSettings, SyncConfig, SyncStatus, WidgetsData } from '../types';
import type { TestResult } from '../lib/githubSync';
import { X, Moon, Sun, Cloud, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsWindowProps {
  settings: DesktopSettings;
  onSettingsChange: (settings: DesktopSettings) => void;
  onClose: () => void;
  isDark: boolean;
  syncConfig: SyncConfig;
  onSyncConfigChange: (config: SyncConfig) => void;
  syncStatus: SyncStatus;
  onTestConnection: (config: SyncConfig) => Promise<TestResult>;
  onManualSync: () => void;
  widgets: WidgetsData;
  onWidgetsChange: (widgets: WidgetsData) => void;
  onExportData: () => void;
}

const WALLPAPER_OPTIONS = [
  { key: 'mesh', label: 'Mesh' },
  { key: 'gradient', label: 'Gradient' },
  { key: 'dawn', label: 'Dawn' },
  { key: 'custom', label: 'Custom' },
];

export function SettingsWindow({ settings, onSettingsChange, onClose, isDark, syncConfig, onSyncConfigChange, syncStatus, onTestConnection, onManualSync, widgets, onWidgetsChange, onExportData }: SettingsWindowProps) {
  const [position, setPosition] = useState({ x: Math.max(20, window.innerWidth / 2 - 200), y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击标题栏空白处才拖拽，不点击按钮
    if ((e.target as HTMLElement).closest('.window-title-bar') && !(e.target as HTMLElement).closest('.window-btn')) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 500, e.clientY - dragStart.current.y)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const accentColors = [
    { name: 'Blue', value: '#007AFF' },
    { name: 'Purple', value: '#AF52DE' },
    { name: 'Pink', value: '#FF2D55' },
    { name: 'Orange', value: '#FF9500' },
    { name: 'Green', value: '#34C759' },
    { name: 'Cyan', value: '#5AC8FA' },
  ];

  const bgClass = isDark ? 'bg-gray-800/85 border-white/10 text-white' : 'bg-white/85 border-white/50 text-gray-800';

  const inputClass = `w-full px-3 py-2 rounded-lg text-xs outline-none transition-all border ${
    isDark
      ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-300'
  }`;

  const handleTestConnection = async () => {
    if (!syncConfig.token || !syncConfig.owner || !syncConfig.repo) {
      setTestResult({ ok: false, message: 'Please fill in Token / Owner / Repo first' });
      return;
    }
    setTesting(true);
    const result = await onTestConnection(syncConfig);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div
      className="fixed z-50 animate-window-enter"
      style={{ 
        left: isMaximized ? '50%' : position.x, 
        top: isMaximized ? '50%' : position.y, 
        width: isMaximized ? '560px' : '380px',
        transform: isMaximized ? 'translate(-50%, -50%)' : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${bgClass}`}>
        {/* 标题栏 */}
        <div className="window-title-bar flex items-center gap-2 px-4 py-3 cursor-move border-b border-white/5">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="window-btn w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center group cursor-default"
            >
              <X size={8} className="text-black/40 opacity-0 group-hover:opacity-100" />
            </button>
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="window-btn w-3 h-3 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all flex items-center justify-center group cursor-default"
            >
              <span className="text-black/40 opacity-0 group-hover:opacity-100 text-[8px] font-bold">−</span>
            </button>
            <button
              onClick={() => setIsMaximized((v) => !v)}
              className="window-btn w-3 h-3 rounded-full bg-[#28C840] hover:brightness-90 transition-all flex items-center justify-center group cursor-default"
            >
              <span className="text-black/40 opacity-0 group-hover:opacity-100 text-[8px] font-bold">+</span>
            </button>
          </div>
          <span className="ml-3 text-xs font-medium opacity-50 tracking-wide">SETTINGS</span>
        </div>

        {/* 内容 */}
        {!isMinimized && (
        <div className={`px-5 py-5 space-y-6 ${isMaximized ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
          {/* SYSTEM */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">System</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  Night mode
                </span>
                <button
                  onClick={() => onSettingsChange({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: settings.theme === 'dark' ? settings.accentColor : '#d1d5db' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      settings.theme === 'dark' ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* WALLPAPER */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">Wallpaper</h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {WALLPAPER_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onSettingsChange({ ...settings, wallpaper: key })}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all border ${
                    settings.wallpaper === key
                      ? 'text-white border-transparent'
                      : isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-black/5 border-black/10 hover:bg-black/10'
                  }`}
                  style={settings.wallpaper === key ? { backgroundColor: settings.accentColor } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            {settings.wallpaper === 'custom' && (
              <div className="space-y-2">
                {settings.customWallpaper ? (
                  <div className="space-y-2">
                    <div
                      className="w-full h-24 rounded-xl bg-cover bg-center border"
                      style={{
                        backgroundImage: `url(${settings.customWallpaper})`,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      }}
                    />
                    <div className="flex gap-2">
                      <label
                        className="flex-1 px-3 py-2 rounded-lg text-xs text-center cursor-pointer transition-colors border"
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // 限制 5MB
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Image size cannot exceed 5MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              onSettingsChange({ ...settings, customWallpaper: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        Replace Image
                      </label>
                      <button
                        onClick={() => onSettingsChange({ ...settings, customWallpaper: undefined })}
                        className="px-3 py-2 rounded-lg text-xs text-red-400 transition-colors border"                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                    style={{
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image size cannot exceed 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          onSettingsChange({ ...settings, customWallpaper: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <span className="text-xs opacity-60">Click to upload (max 5MB)</span>
                    <span className="text-[10px] opacity-40 mt-1">JPG, PNG, WebP supported</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* ACCENT */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">Accent</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">System accent</span>
              <div className="flex gap-2">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onSettingsChange({ ...settings, accentColor: color.value })}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      settings.accentColor === color.value ? 'ring-2 ring-offset-2 ring-offset-transparent scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: color.value,
                      ...(settings.accentColor === color.value ? { '--tw-ring-color': color.value } : {}),
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* DOCK */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">Dock</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showDock}
                onChange={(e) => onSettingsChange({ ...settings, showDock: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm">Show dock</span>
            </label>
          </div>

          {/* WIDGETS */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">Widgets</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={widgets.clock.enabled}
                  onChange={(e) => onWidgetsChange({ ...widgets, clock: { ...widgets.clock, enabled: e.target.checked } })}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm">Clock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={widgets.todo.enabled}
                  onChange={(e) => onWidgetsChange({ ...widgets, todo: { ...widgets.todo, enabled: e.target.checked } })}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm">Todo</span>
              </label>
            </div>
          </div>

          {/* GITHUB SYNC */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Cloud size={12} /> GitHub Sync
            </h3>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Fine-grained Token"
                value={syncConfig.token}
                onChange={(e) => onSyncConfigChange({ ...syncConfig, token: e.target.value })}
                className={inputClass}
              />
              <div className="flex gap-2">
                <input
                  placeholder="Owner"
                  value={syncConfig.owner}
                  onChange={(e) => onSyncConfigChange({ ...syncConfig, owner: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Repo"
                  value={syncConfig.repo}
                  onChange={(e) => onSyncConfigChange({ ...syncConfig, repo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <input
                placeholder="Branch (default main)"
                value={syncConfig.branch}
                onChange={(e) => onSyncConfigChange({ ...syncConfig, branch: e.target.value })}
                className={inputClass}
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors border ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'
                  }`}
                >
                  {testing ? 'Testing…' : 'Test Connection'}
                </button>
                <button
                  onClick={onManualSync}
                  className="flex-1 px-3 py-2 rounded-lg text-xs text-white hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  <RefreshCw size={11} /> Sync Now
                </button>
              </div>

              {testResult && (
                <p className={`text-[11px] flex items-center gap-1 ${testResult.ok ? 'text-green-500' : 'text-red-400'}`}>
                  {testResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {testResult.message}
                </p>
              )}
              {syncStatus.type === 'syncing' && (
                <p className="text-[11px] flex items-center gap-1 opacity-70">
                  <Loader2 size={12} className="animate-spin" /> Syncing…
                </p>
              )}
              {syncStatus.type === 'success' && (
                <p className="text-[11px] flex items-center gap-1 text-green-500">
                  <CheckCircle2 size={12} /> {syncStatus.message}
                </p>
              )}
              {syncStatus.type === 'error' && (
                <p className="text-[11px] flex items-center gap-1 text-red-400">
                  <AlertCircle size={12} /> {syncStatus.message}
                </p>
              )}

              <p className="text-[10px] opacity-40 leading-relaxed">
                Create a Fine-grained Token (Settings → Developer settings → Fine-grained tokens), granting this repo
                Contents: Read &amp; Write only. Bookmark data is written publicly to <code className="opacity-60">webdesk-data.json</code> in
                the repo root. Custom wallpapers are not synced.
              </p>
            </div>
          </div>

          {/* DATA */}
          <div>
            <h3 className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-3">Data</h3>
            <button
              onClick={onExportData}
              className={`w-full px-3 py-2 rounded-lg text-xs transition-colors border ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'
              }`}
            >
              Export bookmarks as JSON
            </button>
            <p className="text-[10px] opacity-40 leading-relaxed mt-2">
              Downloads a local backup of your bookmarks, layout and settings. Custom wallpapers are excluded.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
