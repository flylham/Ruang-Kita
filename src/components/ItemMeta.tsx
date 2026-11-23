import React from 'react';
import { useCouple } from '../context/CoupleContext';
import { formatRelativeTime } from '../lib/formatters';
import { SignedImage } from './SignedImage';

interface ItemMetaProps {
  createdBy: string | null | undefined;
  createdAt: string;
  extra?: string;
}

export const ItemMeta: React.FC<ItemMetaProps> = ({ createdBy, createdAt, extra }) => {
  const { getMemberName, getMemberAvatar } = useCouple();
  const name = getMemberName(createdBy);
  const avatarPath = getMemberAvatar(createdBy);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      {avatarPath ? (
        <SignedImage
          bucket="photos"
          path={avatarPath}
          alt={name}
          className="h-4 w-4 shrink-0 rounded-full"
        />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-semibold text-rose-500 dark:text-rose-300">
          {initial}
        </span>
      )}
      <span>oleh {name}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">{formatRelativeTime(createdAt)}</span>
      {extra && (
        <>
          <span aria-hidden="true">·</span>
          <span>{extra}</span>
        </>
      )}
    </div>
  );
};
