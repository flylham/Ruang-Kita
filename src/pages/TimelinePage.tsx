import React, { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useAddTimeline, useDeleteTimeline, useTimeline } from '../hooks/useCoupleData';
import { formatDateId } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';
import { SignedImage } from '../components/SignedImage';

export const TimelinePage: React.FC = () => {
  const { clearBadge } = useCouple();
  const { data: items = [], isLoading } = useTimeline();
  const addTimeline = useAddTimeline();
  const deleteTimeline = useDeleteTimeline();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [story, setStory] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    clearBadge('kenangan');
  }, [clearBadge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTimeline.mutateAsync({
      event_date: eventDate,
      title: title.trim(),
      story: story.trim(),
      photoFile,
    });
    setTitle('');
    setStory('');
    setPhotoFile(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Linimasa Kenangan</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Jejak hari-hari bersejarah yang kita bangun berdua.
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
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-36 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Linimasa masih kosong</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Catat momen pertemuan pertama, jalan-jalan pertama, atau hal kecil yang berkesan.
          </p>
        </div>
      ) : (
        <div className="relative space-y-6 pl-5 before:absolute before:top-3 before:bottom-3 before:left-1.5 before:w-px before:bg-[var(--border-hairline)]">
          {items.map((item) => (
            <article
              key={item.id}
              className="relative rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
            >
              <span className="absolute top-6 -left-[22px] h-3 w-3 rounded-full border-2 border-rose-400 bg-[var(--bg-canvas)]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-amber-500 dark:text-amber-300">
                    {formatDateId(item.event_date)}
                  </p>
                  <h3 className="font-display mt-0.5 text-xl font-semibold">{item.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTimeline.mutate(item.id)}
                  aria-label="Hapus momen"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {item.photo_path && (
                <SignedImage
                  bucket="photos"
                  path={item.photo_path}
                  alt={item.title}
                  className="mt-3 max-h-72 w-full rounded-2xl object-cover"
                />
              )}

              {item.story && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.story}
                </p>
              )}

              <div className="mt-4">
                <ItemMeta createdBy={item.created_by} createdAt={item.created_at} />
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Tambah Momen Linimasa</h2>
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
                  Tanggal Momen
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Judul Momen
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Malam Pertama Hujan-Hujanan"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Cerita
                </label>
                <textarea
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Ceritakan kembali rasanya waktu itu..."
                  className="mt-1 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Foto (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-xs text-[var(--text-secondary)]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addTimeline.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              {addTimeline.isPending ? 'Menyimpan...' : 'Simpan ke Linimasa'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
