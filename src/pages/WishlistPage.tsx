import React, { useState } from 'react';
import { Check, CheckSquare, Plus, Trash2, X } from 'lucide-react';
import {
  useAddWishlist,
  useDeleteWishlist,
  useToggleWishlist,
  useWishlist,
} from '../hooks/useCoupleData';
import { formatDateId } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';
import type { WishlistCategory } from '../types/database';

const CATEGORIES: { id: WishlistCategory | 'semua'; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'makan', label: 'Makan' },
  { id: 'jalan-jalan', label: 'Jalan-jalan' },
  { id: 'film', label: 'Film' },
  { id: 'rumah', label: 'Rumah' },
  { id: 'lainnya', label: 'Lainnya' },
];

export const WishlistPage: React.FC = () => {
  const { data: items = [], isLoading } = useWishlist();
  const addWishlist = useAddWishlist();
  const toggleWishlist = useToggleWishlist();
  const deleteWishlist = useDeleteWishlist();

  const [filterCat, setFilterCat] = useState<string>('semua');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WishlistCategory>('jalan-jalan');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const filtered =
    filterCat === 'semua' ? items : items.filter((w) => w.category === filterCat);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addWishlist.mutateAsync({
      title: title.trim(),
      category,
      target_date: targetDate || undefined,
      notes: notes.trim(),
    });
    setTitle('');
    setTargetDate('');
    setNotes('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Wishlist &amp; Rencana Kita
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Hal-hal sederhana hingga impian besar yang ingin kita centang bersama.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Rencana</span>
        </button>
      </div>

      {/* Filter Kategori */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilterCat(c.id)}
            className={`min-h-[40px] shrink-0 rounded-xl px-3.5 text-xs font-semibold transition whitespace-nowrap ${
              filterCat === c.id
                ? 'bg-rose-600 text-white'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <CheckSquare className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada wishlist di kategori ini</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <button
                type="button"
                onClick={() => toggleWishlist.mutate(item)}
                aria-label={item.is_done ? 'Tandai belum selesai' : 'Tandai selesai'}
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                  item.is_done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 text-transparent hover:border-rose-400'
                }`}
              >
                <Check className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    item.is_done ? 'line-through opacity-60' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {item.title}
                </p>
                {item.notes && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.notes}</p>
                )}
                <div className="mt-2">
                  <ItemMeta
                    createdBy={item.created_by}
                    createdAt={item.created_at}
                    extra={`${item.category}${item.target_date ? ` · target ${formatDateId(item.target_date)}` : ''}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteWishlist.mutate(item.id)}
                aria-label="Hapus wishlist"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Tambah Wishlist</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Apa yang ingin dilakukan bersama?"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WishlistCategory)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
              >
                {CATEGORIES.filter((c) => c.id !== 'semua').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan (opsional)..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addWishlist.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan Rencana
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
