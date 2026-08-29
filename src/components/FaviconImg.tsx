import { useState } from 'react';
import { getFaviconUrl, initialLetter, isGenericFaviconPlaceholder, nameStartsWithEmoji } from '../lib/favicon';

interface FaviconImgProps {
  pageUrl?: string;
  name: string;
  className: string;
  letterClassName: string;
  fallbackSrc?: string;
}

export function FaviconImg({ pageUrl, name, className, letterClassName, fallbackSrc }: FaviconImgProps) {
  const [failed, setFailed] = useState(false);
  const preferEmoji = nameStartsWithEmoji(name);
  const src = preferEmoji ? '' : fallbackSrc || getFaviconUrl(pageUrl || '');

  if (!src || failed || preferEmoji) {
    return (
      <span className={`${letterClassName} leading-none`} style={preferEmoji ? { fontSize: '1.35em' } : undefined}>
        {initialLetter(name)}
      </span>
    );
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
