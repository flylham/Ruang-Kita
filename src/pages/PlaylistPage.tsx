import React, { useState } from 'react';
import { ExternalLink, Music2, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useAddSong, useDeleteSong, useSongs } from '../hooks/useCoupleData';
import { sanitizeExternalUrl } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';

export const PlaylistPage: React.FC = () => {
  const { settings, isMusicPlaying, toggleMusic } = useCouple();
  const { data: songs = [], isLoading } = useSongs();
  const addSong = useAddSong();
  const deleteSong = useDeleteSong();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const safe = sanitizeExternalUrl(url);
    if (!title.trim() || !safe) return;
    await addSong.mutateAsync({
      title: title.trim(),
      artist: artist.trim(),
      url: safe,
      reason: reason.trim(),
    });
    setTitle('');
    setArtist('');
    setUrl('');
    setReason('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Playlist Kita</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Lagu-lagu yang selalu membawa kita kembali ke momen spesial.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Lagu</span>
        </button>
      </div>

      {/* Pemutar Musik Latar */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-500 dark:text-amber-300">
            Pemutar Musik Latar
          </p>
          <p className="truncate font-display text-lg font-semibold">
            {settings?.background_music_title || 'Musik Latar Ruang Kita'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {settings?.background_music_url
              ? 'Dapat dinyalakan atau dimatikan kapan saja'
              : 'Atur URL audio langsung di halaman Pengaturan'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMusic}
          className="flex h-12 min-w-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isMusicPlaying ? 'Matikan' : 'Putar'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Music2 className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Playlist masih kosong</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {songs.map((song) => {
            const safeHref = sanitizeExternalUrl(song.url);
            return (
              <div
                key={song.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{song.title}</h3>
                      {song.artist && (
                        <p className="text-xs font-medium text-amber-500 dark:text-amber-300">
                          {song.artist}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSong.mutate(song.id)}
                      aria-label="Hapus lagu"
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {song.reason && (
                    <p className="font-hand mt-2 text-xl text-[var(--text-primary)]">
                      "{song.reason}"
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3">
                  <ItemMeta createdBy={song.created_by} createdAt={song.created_at} />
                  {safeHref && (
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-[var(--bg-elevated)] px-3 text-xs font-semibold text-rose-500 dark:text-rose-300"
                    >
                      <span>Dengar</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
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
              <h2 className="font-display text-xl font-semibold">Tambah Lagu Spesial</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul lagu"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Penyanyi / Band"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link Spotify atau YouTube (https://...)"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Kenapa lagu ini spesial untuk kita?"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addSong.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan Lagu
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
