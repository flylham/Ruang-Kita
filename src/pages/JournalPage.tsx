import React, { useState } from 'react';
import { BookHeart, Globe, Lock, Plus, Trash2, X } from 'lucide-react';
import { useAddJournal, useDeleteJournal, useJournal } from '../hooks/useCoupleData';
import { formatDateId } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';

export const JournalPage: React.FC = () => {
  const { data: entries = [], isLoading } = useJournal();
  const addJournal = useAddJournal();
  const deleteJournal = useDeleteJournal();

  const [showForm, setShowForm] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('🌙');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await addJournal.mutateAsync({
      entry_date: entryDate,
      title: title.trim(),
      content: content.trim(),
      mood_emoji: moodEmoji,
      is_private: isPrivate,
    });
    setTitle('');
    setContent('');
    setIsPrivate(false);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Jurnal Harian</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Entri bertanda "Pribadi" dijaga oleh Row Level Security dan hanya bisa dibaca oleh penulisnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Jurnal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <BookHeart className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada catatan jurnal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span>{entry.mood_emoji || '🌙'}</span>
                    <span>{formatDateId(entry.entry_date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-300">
                      {entry.is_private ? (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>Pribadi (hanya kamu)</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3" />
                          <span>Dibagikan</span>
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="font-display mt-1 text-xl font-semibold">{entry.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => deleteJournal.mutate(entry.id)}
                  aria-label="Hapus jurnal"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {entry.content}
              </p>

              <div className="mt-4">
                <ItemMeta createdBy={entry.created_by} createdAt={entry.created_at} />
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
              <h2 className="font-display text-xl font-semibold">Tulis Jurnal Hari Ini</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
                />
                <select
                  value={moodEmoji}
                  onChange={(e) => setMoodEmoji(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
                >
                  <option value="🌙">🌙 Tenang</option>
                  <option value="🥰">🥰 Bahagia</option>
                  <option value="🌧️">🌧️ Melankolis</option>
                  <option value="🙏">🙏 Bersyukur</option>
                  <option value="✨">✨ Bersemangat</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul hari ini..."
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ceritakan apa yang kamu rasakan hari ini..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold ${
                    !isPrivate
                      ? 'border-rose-400 bg-rose-500/15 text-rose-500 dark:text-rose-200'
                      : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Dibagikan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-xs font-semibold ${
                    isPrivate
                      ? 'border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-200'
                      : 'border-[var(--border-hairline)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Pribadi</span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={addJournal.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan Jurnal
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
