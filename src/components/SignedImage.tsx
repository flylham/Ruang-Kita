import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getSignedStorageUrl } from '../lib/imageCompression';

interface SignedImageProps {
  bucket: 'photos' | 'chat';
  path: string | null | undefined;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const SignedImage: React.FC<SignedImageProps> = ({
  bucket,
  path,
  alt,
  className = '',
  onClick,
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    if (!path) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    getSignedStorageUrl(bucket, path)
      .then((signed) => {
        if (!active) return;
        if (signed) {
          setUrl(signed);
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [bucket, path]);

  if (status === 'error' || !path) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#261a42] via-[#1b1230] to-[#321b36] p-4 text-center text-xs text-rose-200/70 ${className}`}
      >
        <ImageOff className="h-5 w-5 opacity-70" />
        <span className="line-clamp-1">{alt || 'Foto kenangan'}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[var(--bg-elevated)] ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-[var(--bg-elevated)]" />
      )}
      {url && (
        <img
          src={url}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onClick={onClick}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${onClick ? 'cursor-pointer' : ''}`}
        />
      )}
    </div>
  );
};
