import { useState, useEffect } from 'react';

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

  // 监听 storage 变化（多标签页同步）
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
      const next = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error(`[useLocalStorage] save error:`, e);
      }
      return next;
    });
  };

  return [storedValue, setValue] as const;
}
