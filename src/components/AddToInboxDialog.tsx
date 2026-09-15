import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardPaste, Inbox } from 'lucide-react';
import { normalizeBookmarkUrl } from '../lib/openUrl';
import { deriveNameFromUrl } from '../lib/inbox';
import { FaviconImg } from './FaviconImg';

interface AddToInboxDialogProps {
  isDark: boolean;
  accentColor: string;
  onSubmit: (url: string, note: string) => void;
  onClose: () => void;
}

/**
 * 快速捕获：URL 框自动聚焦，Ctrl+V 贴链接，按一次 Enter 直接入库。
 * 名称由 URL 自动推导，想写备注则 Tab 过去。
 */
export function AddToInboxDialog({ isDark, accentColor, onSubmit, onClose }: AddToInboxDialogProps) {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlRef.current?.focus();
  }, []);

  // 预览：解析成功时让用户先看到将要采用的名称与图标
  const preview = useMemo(() => {
    const normalized = normalizeBookmarkUrl(url);
    if (!normalized) return null;
    return { url: normalized, name: deriveNameFromUrl(normalized) };
  }, [url]);

  const submit = () => {
    const normalized = normalizeBookmarkUrl(url);
    if (!normalized) {
      setError('Only http:// and https:// links can be saved.');
      urlRef.current?.focus();
      return;
    }
    onSubmit(normalized, note);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError('Clipboard is empty.');
        return;
      }
      setError(null);
      setUrl(text.trim());
      noteRef.current?.focus();
    } catch {
      setError('Clipboard blocked by the browser — press Ctrl+V in the field instead.');
      urlRef.current?.focus();
    }
  };

  const inputClass = `w-full p-3 rounded-xl text-sm outline-none transition-all border ${
    isDark
      ? 'bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-blue-300'
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-6 w-96 shadow-2xl ${
          isDark ? 'bg-gray-800/90 text-white border border-white/10' : 'bg-white/90 text-gray-800 border border-white/50'
        } backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <Inbox size={15} className="opacity-60" />
          <h2 className="text-lg font-semibold">Save to Inbox</h2>
        </div>
        <p className="text-[11px] opacity-50 mb-4">
          Paste a link and press Enter — the name is derived automatically.
        </p>

        <div className="relative">
          <input
            ref={urlRef}
            type="text"
            placeholder="Paste URL (e.g. bilibili.com/video/BV1xx)"
            value={url}
            onChange={(e) => {
              setError(null);
              setUrl(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onClose();
            }}
            className={`${inputClass} pr-11`}
          />
          <button
            onClick={pasteFromClipboard}
            tabIndex={-1}
            title="Paste from clipboard"
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-gray-500'
            }`}
          >
            <ClipboardPaste size={14} />
          </button>
        </div>

        {preview && (
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <span className="w-5 h-5 shrink-0 rounded-md flex items-center justify-center overflow-hidden">
              <FaviconImg
                pageUrl={preview.url}
                name={preview.name}
                className="w-4 h-4 rounded"
                letterClassName="text-[10px] font-bold opacity-70"
              />
            </span>
            <span className="text-[11px] opacity-50 truncate">{preview.name}</span>
          </div>
        )}

        <input
          ref={noteRef}
          type="text"
          placeholder="Note (optional, e.g. watch the Go generics part later)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onClose();
          }}
          className={`${inputClass} mt-3`}
        />

        {error ? (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        ) : (
          <p className="text-[10px] opacity-40 mt-2">Enter saves right away — Tab first if you want a note.</p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!url.trim()}
            className="px-4 py-2 rounded-xl text-sm text-white hover:brightness-110 transition-all disabled:opacity-40 disabled:hover:brightness-100"
            style={{ backgroundColor: accentColor }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
