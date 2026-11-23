import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Heart,
  ImagePlus,
  Trash2,
  X,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useAlbums,
  useCreateAlbum,
  useDeletePhoto,
  usePhotoReactions,
  usePhotos,
  useSetPhotoReaction,
  useTogglePhotoFavorite,
  useUploadPhotos,
} from '../hooks/useCoupleData';
import { formatDateId } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';
import { SignedImage } from '../components/SignedImage';

const PHOTO_EMOJIS = ['❤️', '🥰', '🥹', '😂', '✨'];

export const GalleryPage: React.FC = () => {
  const { user, clearBadge, getMemberName } = useCouple();
  const { data: albums = [] } = useAlbums();
  const { data: photos = [], isLoading } = usePhotos();
  const { data: reactions = [] } = usePhotoReactions();

  const createAlbum = useCreateAlbum();
  const uploadPhotos = useUploadPhotos();
  const toggleFav = useTogglePhotoFavorite();
  const setReaction = useSetPhotoReaction();
  const deletePhoto = useDeletePhoto();

  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);

  const [albumTitle, setAlbumTitle] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    clearBadge('galeri');
  }, [clearBadge]);

  const filteredPhotos =
    selectedAlbum === 'all'
      ? photos
      : selectedAlbum === 'fav'
        ? photos.filter((p) => user && p.favorite_by.includes(user.id))
        : photos.filter((p) => p.album_id === selectedAlbum);

  const activePhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] ?? null : null;

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    await uploadPhotos.mutateAsync({
      files: uploadFiles,
      albumId: uploadAlbumId || null,
      caption: uploadCaption.trim(),
      takenAt: uploadDate,
    });
    setUploadFiles([]);
    setUploadCaption('');
    setShowUpload(false);
  };

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) return;
    await createAlbum.mutateAsync({ title: albumTitle.trim() });
    setAlbumTitle('');
    setShowAlbumForm(false);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
  };

  const prevPhoto = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Galeri Foto Kita</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Foto pribadi terkompresi otomatis dan tersimpan di bucket privat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAlbumForm(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium"
          >
            <FolderPlus className="h-4 w-4 text-amber-400" />
            <span>Album</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
          >
            <ImagePlus className="h-4 w-4" />
            <span>Unggah Foto</span>
          </button>
        </div>
      </div>

      {/* Filter Album */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Semua (${photos.length})` },
          { id: 'fav', label: 'Favoritku' },
          ...albums.map((a) => ({ id: a.id, label: a.title })),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedAlbum(tab.id)}
            className={`min-h-[40px] shrink-0 rounded-xl px-3.5 text-xs font-semibold transition whitespace-nowrap ${
              selectedAlbum === tab.id
                ? 'bg-rose-600 text-white'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Foto */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-square animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <ImagePlus className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada foto di sini</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Ketuk "Unggah Foto" untuk memilih banyak kenangan sekaligus dari HP kalian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo, idx) => {
            const isFav = user ? photo.favorite_by.includes(user.id) : false;
            const photoReacts = reactions.filter((r) => r.photo_id === photo.id);
            return (
              <div
                key={photo.id}
                className="group overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
              >
                <div className="relative aspect-square">
                  <SignedImage
                    bucket="photos"
                    path={photo.storage_path}
                    alt={photo.caption || 'Kenangan kita'}
                    onClick={() => setLightboxIndex(idx)}
                    className="h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFav.mutate(photo)}
                    aria-label="Tandai favorit"
                    className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-xs"
                  >
                    <Heart
                      className={`h-4 w-4 ${isFav ? 'fill-rose-400 text-rose-400' : 'text-white'}`}
                    />
                  </button>
                  {photoReacts.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white backdrop-blur-xs">
                      {photoReacts.map((r) => (
                        <span key={r.id}>{r.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-xs font-semibold text-[var(--text-primary)]">
                    {photo.caption || formatDateId(photo.taken_at)}
                  </p>
                  <div className="mt-1">
                    <ItemMeta createdBy={photo.created_by} createdAt={photo.created_at} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Album */}
      {showAlbumForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAlbumSubmit}
            className="w-full max-w-sm rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <h2 className="font-display text-xl font-semibold">Buat Album Baru</h2>
            <input
              type="text"
              required
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Misal: Liburan ke Bandung"
              className="mt-4 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm focus:border-rose-400 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAlbumForm(false)}
                className="min-h-[44px] rounded-xl px-4 text-sm text-[var(--text-secondary)]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createAlbum.isPending}
                className="min-h-[44px] rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white"
              >
                Buat Album
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Unggah Multi-Foto */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUploadSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Unggah Foto Kenangan</h2>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Pilih Foto (bisa banyak sekaligus)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                  className="mt-1.5 block w-full text-xs text-[var(--text-secondary)] file:mr-3 file:rounded-xl file:border-0 file:bg-rose-600 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white"
                />
                {uploadFiles.length > 0 && (
                  <p className="mt-1 text-xs text-amber-500 dark:text-amber-300">
                    {uploadFiles.length} foto dipilih · akan dikompres otomatis sebelum unggah
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Album (opsional)
                </label>
                <select
                  value={uploadAlbumId}
                  onChange={(e) => setUploadAlbumId(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
                >
                  <option value="">Tanpa Album</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Caption
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Cerita singkat di balik foto ini..."
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Tanggal Foto
                </label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploadPhotos.isPending || uploadFiles.length === 0}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {uploadPhotos.isPending ? 'Mengompres & Mengunggah...' : 'Simpan ke Galeri'}
            </button>
          </form>
        </div>
      )}

      {/* Lightbox dengan Swipe & Reaksi */}
      {activePhoto && (
        <div
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (diff > 50) prevPhoto();
            if (diff < -50) nextPhoto();
            touchStartX.current = null;
          }}
          className="fixed inset-0 z-[70] flex flex-col justify-between bg-black/95 p-4 text-white"
        >
          <div className="flex items-center justify-between pt-safe">
            <div className="text-xs text-white/75">
              {formatDateId(activePhoto.taken_at)} · oleh {getMemberName(activePhoto.created_by)}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  deletePhoto.mutate(activePhoto);
                  setLightboxIndex(null);
                }}
                aria-label="Hapus foto"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Tutup lightbox"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative my-auto flex max-h-[68dvh] items-center justify-center">
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Foto sebelumnya"
              className="absolute left-1 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <SignedImage
              bucket="photos"
              path={activePhoto.storage_path}
              alt={activePhoto.caption || 'Foto'}
              className="max-h-[66dvh] max-w-full rounded-2xl object-contain"
            />

            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Foto berikutnya"
              className="absolute right-1 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="mx-auto w-full max-w-lg space-y-3 pb-safe text-center">
            {activePhoto.caption && (
              <p className="font-hand text-2xl text-amber-200">{activePhoto.caption}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => toggleFav.mutate(activePhoto)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-xs font-semibold"
              >
                <Heart
                  className={`h-4 w-4 ${
                    user && activePhoto.favorite_by.includes(user.id)
                      ? 'fill-rose-400 text-rose-400'
                      : 'text-white'
                  }`}
                />
                <span>Favorit ({activePhoto.favorite_by.length})</span>
              </button>

              {PHOTO_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setReaction.mutate({ photoId: activePhoto.id, emoji: em })}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg hover:bg-white/20"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
