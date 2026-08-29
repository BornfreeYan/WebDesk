import { useState, useEffect } from 'react';

function quotaMessage(err: unknown): string {
  const isQuota =
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
  if (isQuota) {
    return 'Browser storage is full. Use a smaller wallpaper (max 2MB) or free some space.';
  }
  return 'Failed to save data locally.';
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setValue = (value: React.SetStateAction<T>) => {
    setStoredValue((prev) => {
      const next =
        typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        setSaveError(null);
        return next;
      } catch (e) {
        console.error(`[useLocalStorage] save error:`, e);
        setSaveError(quotaMessage(e));
        return prev;
      }
    });
  };

  return [storedValue, setValue, saveError] as const;
}
