import { useState } from 'react';
import { getFaviconUrl, initialLetter, isGenericFaviconPlaceholder } from '../lib/favicon';

interface FaviconImgProps {
  pageUrl?: string;
  name: string;
  className: string;
  letterClassName: string;
  fallbackSrc?: string;
}

export function FaviconImg({ pageUrl, name, className, letterClassName, fallbackSrc }: FaviconImgProps) {
  const [failed, setFailed] = useState(false);
  const src = fallbackSrc || getFaviconUrl(pageUrl || '');

  if (!src || failed) {
    return <span className={letterClassName}>{initialLetter(name)}</span>;
  }

  return (
    <img
      src={src}
      alt={name}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
      onLoad={(e) => {
        if (isGenericFaviconPlaceholder(e.currentTarget)) setFailed(true);
      }}
    />
  );
}
