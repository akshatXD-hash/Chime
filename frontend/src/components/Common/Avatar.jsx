import React, { useState } from 'react';

const DEFAULT_AVATAR = '/default-avatar.svg';

export function Avatar({ src, name = 'User', className = '' }) {
  const [failedSource, setFailedSource] = useState(null);
  const source = typeof src === 'string' && src.trim() && !src.includes('icon-library.com/images/anonymous-avatar-icon/')
    ? src : DEFAULT_AVATAR;
  return <img
    src={source === failedSource ? DEFAULT_AVATAR : source}
    alt={`${name || 'User'} profile picture`}
    className={`w-full h-full object-cover ${className}`}
    onError={() => setFailedSource(source)}
    decoding="async"
  />;
}
