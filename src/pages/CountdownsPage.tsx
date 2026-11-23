import React, { useEffect, useState } from 'react';
import { Plus, Timer, Trash2, X } from 'lucide-react';
import { useAddCountdown, useCountdowns, useDeleteCountdown } from '../hooks/useCoupleData';
import { formatDateId, getCountdownParts } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';

const EMOJI_CHOICES = ['✨', '🥂', '✈️', '🎂', '💍', '🌙', '💐'];

export const CountdownsPage: React.FC = () => {
  const { data: items = [], isLoading } = useCountdowns();
  const addCountdown = useAddCountdown();
  const deleteCountdown = useDeleteCountdown();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAt, setTargetAt] = useState('');
  const [emoji, setEmoji] = useState('🥂');

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAt) return;
    await addCountdown.mutateAsync({
      title: title.trim(),
      target_at: new Date(targetAt).toISOString(),
      emoji,
    });
    setTitle('');
    setTargetAt('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Hitung Mundur</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Menghitung hari menuju ulang tahun, liburan, atau pertemuan berikutnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Momen</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-36 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Timer className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada hitung mundur</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const cd = getCountdownParts(item.target_at, nowMs);
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-2xl">
                      {item.emoji}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatDateId(item.target_at, true)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCountdown.mutate(item.id)}
                    aria-label="Hapus hitung mundur"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {cd.isPast ? (
                  <p className="font-hand my-4 text-2xl text-emerald-500 dark:text-emerald-300">
                    Hari spesial ini sudah tiba!
                  </p>
                ) : (
                  <div className="my-4 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Hari', val: cd.days },
                      { label: 'Jam', val: cd.hours },
                      { label: 'Menit', val: cd.minutes },
                      { label: 'Detik', val: cd.seconds },
                    ].map((box) => (
                      <div
                        key={box.label}
                        className="rounded-2xl bg-[var(--bg-elevated)]/75 py-2.5"
                      >
                        <div className="font-display text-xl font-semibold text-amber-500 tabular-nums dark:text-amber-200">
                          {String(box.val).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)]">{box.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <ItemMeta createdBy={item.created_by} createdAt={item.created_at} />
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
              <h2 className="font-display text-xl font-semibold">Hitung Mundur Baru</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              <div className="flex gap-1.5">
                {EMOJI_CHOICES.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                      emoji === em
                        ? 'bg-rose-500/20 ring-1 ring-rose-400'
                        : 'bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nama momen (misal: Ketemu di Stasiun)"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <input
                type="datetime-local"
                required
                value={targetAt}
                onChange={(e) => setTargetAt(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addCountdown.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan Hitung Mundur
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
