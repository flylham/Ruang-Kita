import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" />
        <span>{compact ? 'Pasang' : 'Tambahkan ke Layar Utama'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <Share className="h-4 w-4 text-amber-400" />
          <span>{compact ? 'Pasang iOS' : 'Pasang di iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Pasang di iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                <li>1. Buka halaman ini di browser <strong>Safari</strong>.</li>
                <li>
                  2. Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah Safari.
                </li>
                <li>
                  3. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
                </li>
              </ol>
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                Setelah terpasang, aplikasi terbuka penuh tanpa bilah browser dan siap mendukung notifikasi di iOS 16.4+.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
