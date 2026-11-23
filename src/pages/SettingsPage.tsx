import React, { useEffect, useState } from 'react';
import { BellRing, Camera, LogOut, Moon, Save, Sun } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useToast } from '../context/ToastContext';
import { useUpdateSettings } from '../hooks/useCoupleData';
import { useTheme } from '../hooks/usePWAInstall';
import { uploadCompressedImage } from '../lib/imageCompression';
import { supabase } from '../lib/supabase';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { SignedImage } from '../components/SignedImage';

export const SettingsPage: React.FC = () => {
  const { me, user, settings, refreshCoupleData, signOut } = useCouple();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const updateSettings = useUpdateSettings();

  const [displayName, setDisplayName] = useState(me?.display_name || '');
  const [coupleTitle, setCoupleTitle] = useState(settings?.couple_title || 'Ruang Kita');
  const [anniversaryDate, setAnniversaryDate] = useState(
    settings?.anniversary_date || '2024-02-14'
  );
  const [musicTitle, setMusicTitle] = useState(settings?.background_music_title || '');
  const [musicUrl, setMusicUrl] = useState(settings?.background_music_url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (me) setDisplayName(me.display_name);
  }, [me?.display_name]);

  useEffect(() => {
    if (settings) {
      setCoupleTitle(settings.couple_title);
      setAnniversaryDate(settings.anniversary_date);
      setMusicTitle(settings.background_music_title || '');
      setMusicUrl(settings.background_music_url || '');
    }
  }, [settings]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;
    try {
      setSavingProfile(true);
      const path = await uploadCompressedImage('photos', file, `avatars/${user.id}`);
      const { error } = await supabase
        .from('couple_members')
        .update({ avatar_url: path })
        .eq('user_id', user.id);
      if (error) throw error;
      await refreshCoupleData();
      showToast('Foto profil diperbarui!', 'success');
    } catch {
      showToast('Gagal mengunggah avatar.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !displayName.trim()) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('couple_members')
      .update({ display_name: displayName.trim() })
      .eq('user_id', user.id);
    setSavingProfile(false);
    if (error) {
      showToast('Gagal memperbarui nama.', 'error');
    } else {
      await refreshCoupleData();
      showToast('Nama panggilan diperbarui!', 'success');
    }
  };

  const handleSaveCoupleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      couple_title: coupleTitle.trim() || 'Ruang Kita',
      anniversary_date: anniversaryDate,
      background_music_title: musicTitle.trim(),
      background_music_url: musicUrl.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Pengaturan Ruang Kita</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Sesuaikan profil, tema tampilan, tanggal jadian, musik latar, dan instalasi aplikasi.
        </p>
      </div>

      {/* Profil Sendiri */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
      >
        <h2 className="font-display text-lg font-semibold">Profil Kamu</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {me?.avatar_url ? (
            <SignedImage
              bucket="photos"
              path={me.avatar_url}
              alt={me.display_name}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 font-display text-2xl font-semibold text-rose-400">
              {(me?.display_name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-4 text-xs font-semibold">
            <Camera className="h-4 w-4 text-amber-400" />
            <span>Ganti Avatar</span>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nama panggilanmu"
            className="min-h-[44px] flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
          />
          <button
            type="submit"
            disabled={savingProfile}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-500"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Nama</span>
          </button>
        </div>
      </form>

      {/* Pengaturan Bersama */}
      <form
        onSubmit={handleSaveCoupleSettings}
        className="space-y-4 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
      >
        <h2 className="font-display text-lg font-semibold">Identitas &amp; Tanggal Jadian</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Judul Ruang
            </label>
            <input
              type="text"
              value={coupleTitle}
              onChange={(e) => setCoupleTitle(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Tanggal Jadian
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Judul Musik Latar
            </label>
            <input
              type="text"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              placeholder="Misal: Lagu Favorit Kita"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              URL Audio MP3 Langsung (opsional)
            </label>
            <input
              type="url"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="https://.../lagu.mp3"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <Save className="h-4 w-4" />
          <span>Simpan Pengaturan Bersama</span>
        </button>
      </form>

      {/* Tema, PWA & Notifikasi */}
      <div className="space-y-4 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Tampilan &amp; Aplikasi HP</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Mode saat ini: {theme === 'dark' ? 'Ungu Malam (Gelap)' : 'Ivory Hangat (Terang)'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 text-sm font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-300" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Mode Gelap</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/50 p-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          <p className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <BellRing className="h-4 w-4 text-amber-400" />
            <span>Catatan Web Push di iPhone</span>
          </p>
          <p className="mt-1">
            Pada iPhone (iOS 16.4+), notifikasi Web Push lewat Supabase Edge Function hanya berjalan setelah aplikasi dipasang lewat Safari → <strong>Tambahkan ke Layar Utama</strong> dan dibuka dari ikon tersebut.
          </p>
        </div>

        <div className="border-t border-[var(--border-hairline)] pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 text-sm font-semibold text-rose-500 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
