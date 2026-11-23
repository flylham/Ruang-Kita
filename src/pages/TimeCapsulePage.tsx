import React, { useEffect, useState } from 'react';
import { Lock, LockOpen, Plus, Trash2, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useCreateTimeCapsule,
  useDeleteTimeCapsule,
  useTimeCapsules,
} from '../hooks/useCoupleData';
import { formatDateId, getCountdownParts } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';

export const TimeCapsulePage: React.FC = () => {
  const { user, clearBadge } = useCouple();
  const { data: capsules = [], isLoading } = useTimeCapsules();
  const createCapsule = useCreateTimeCapsule();
  const deleteCapsule = useDeleteTimeCapsule();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    clearBadge('kenangan');
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [clearBadge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !unlockAt) return;
    await createCapsule.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      unlock_at: new Date(unlockAt).toISOString(),
    });
    setTitle('');
    setContent('');
    setUnlockAt('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Pesan Rahasia &amp; Kapsul Waktu
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Isi pesan dikunci langsung di server database hingga waktu buka tiba.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Kapsul</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-amber-400/70" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada kapsul waktu</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Tulis pesan untuk dibuka saat ulang tahun atau anniversary berikutnya.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {capsules.map((cap) => {
            const cd = getCountdownParts(cap.unlock_at, nowMs);
            const isCreator = cap.created_by === user?.id;
            return (
              <div
                key={cap.id}
                className="flex flex-col justify-between rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          cap.is_unlocked
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-amber-400/15 text-amber-500 dark:text-amber-300'
                        }`}
                      >
                        {cap.is_unlocked ? (
                          <LockOpen className="h-5 w-5" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold">{cap.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Terbuka pada {formatDateId(cap.unlock_at, true)}
                        </p>
                      </div>
                    </div>

                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => deleteCapsule.mutate(cap.id)}
                        aria-label="Hapus kapsul"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {cap.is_readable && cap.content ? (
                    <div className="mt-4 rounded-2xl bg-[var(--bg-elevated)]/70 p-4">
                      {!cap.is_unlocked && isCreator && (
                        <p className="mb-2 text-[11px] font-semibold text-amber-500 dark:text-amber-300">
                          Pratinjau penulis (pasangan belum bisa membaca sebelum waktunya)
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                        {cap.content}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-5 text-center">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Pesan masih tersegel rapat di server
                      </p>
                      <p className="font-display mt-2 text-2xl font-semibold text-amber-500 tabular-nums dark:text-amber-200">
                        {cd.days}h {String(cd.hours).padStart(2, '0')}j{' '}
                        {String(cd.minutes).padStart(2, '0')}m{' '}
                        {String(cd.seconds).padStart(2, '0')}d
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <ItemMeta createdBy={cap.created_by} createdAt={cap.created_at} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Kunci Pesan Baru</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Judul Kapsul
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Untuk Anniversary Kita ke-3"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Tanggal &amp; Jam Terbuka
                </label>
                <input
                  type="datetime-local"
                  required
                  value={unlockAt}
                  onChange={(e) => setUnlockAt(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Isi Pesan Rahasia
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan doa, harapan, atau cerita yang ingin dibuka nanti..."
                  className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createCapsule.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              {createCapsule.isPending ? 'Menyegel...' : 'Kunci Kapsul Waktu'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
