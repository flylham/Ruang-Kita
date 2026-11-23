import React, { useState } from 'react';
import { Copy, Lock, LogOut, Moon, RefreshCw, ShieldAlert, Sun } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../hooks/usePWAInstall';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const LoginPage: React.FC = () => {
  const {
    isConfigured,
    user,
    isAuthorizedMember,
    memberCheckError,
    signIn,
    signOut,
    refreshCoupleData,
  } = useCouple();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [checkingMember, setCheckingMember] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setErrorMsg('Email atau kata sandi tidak cocok. Pastikan akun sudah dibuat di Supabase.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] lg:flex-row">
      {/* Left Visual Column */}
      <div className="relative h-56 w-full shrink-0 overflow-hidden lg:h-auto lg:w-1/2">
        <img
          src="/src/assets/images/login_twilight_arch_1795395773306.jpg"
          alt="Jendela senja menuju ruang berdua"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120b20] via-[#120b20]/45 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#120b20]/30 lg:to-[#120b20]" />
        <div className="absolute right-6 bottom-5 left-6 text-white lg:bottom-12 lg:left-12">
          <p className="font-hand text-2xl text-amber-200 sm:text-3xl">Hanya untuk kita berdua</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ruang Kita
          </h1>
        </div>
      </div>

      {/* Right Form / Setup Column */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Akses Privat Pasangan
          </span>
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          {!isConfigured ? (
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-500 dark:text-amber-300">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  Hubungkan Supabase Terlebih Dahulu
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Variabel lingkungan <code className="font-mono text-xs">VITE_SUPABASE_URL</code> dan{' '}
                <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> belum diisi.
              </p>
              <ol className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>1. Buat project di Supabase lalu jalankan <code className="font-mono text-xs">supabase/schema.sql</code>.</li>
                <li>2. Matikan pendaftaran publik di Authentication, lalu buat 2 akun manual.</li>
                <li>3. Masukkan kedua UUID akun ke tabel <code className="font-mono text-xs">couple_members</code>.</li>
                <li>4. Isi <code className="font-mono text-xs">VITE_SUPABASE_URL</code> dan <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> di file <code className="font-mono text-xs">.env</code> atau Netlify.</li>
              </ol>
            </div>
          ) : user && !isAuthorizedMember ? (
            <div className="rounded-3xl border border-rose-500/30 bg-[var(--bg-surface)] p-6">
              <div className="flex items-center gap-3 text-rose-500">
                <Lock className="h-5 w-5" />
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  Akun Belum Terdaftar di Pasangan
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Ruang ini hanya terbuka untuk 2 anggota yang tercantum di tabel{' '}
                <code className="font-mono text-xs">couple_members</code>.
              </p>
              <div className="mt-4 rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
                <p className="text-[var(--text-secondary)]">UUID Akun Kamu:</p>
                <p className="mt-1 font-mono break-all select-all text-[var(--text-primary)]">
                  {user.id}
                </p>
              </div>
              {memberCheckError ? (
                <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-200">
                  <p className="font-semibold">Error dari Supabase:</p>
                  <p className="mt-1 font-mono break-words">{memberCheckError}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                  UUID di atas belum ada di tabel <code className="font-mono">public.couple_members</code>. Salin SQL di bawah, jalankan di <strong>SQL Editor Supabase</strong>, lalu ketuk <strong>Cek Ulang</strong>.
                </p>
              )}
              <button
                type="button"
                onClick={async () => {
                  const sql = `insert into public.couple_members (user_id, display_name)\nvalues ('${user.id}', 'Nama Kamu')\non conflict (user_id) do nothing;`;
                  try {
                    await navigator.clipboard.writeText(sql);
                    showToast('SQL pendaftaran disalin! Tempel di SQL Editor Supabase.', 'success');
                  } catch {
                    showToast('Salin UUID secara manual di kotak atas.', 'info');
                  }
                }}
                className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-semibold text-amber-600 dark:text-amber-200"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Salin SQL untuk SQL Editor Supabase</span>
              </button>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={checkingMember}
                  onClick={async () => {
                    setCheckingMember(true);
                    const res = await refreshCoupleData();
                    setCheckingMember(false);
                    if (res.error) {
                      showToast(`Gagal memeriksa: ${res.error}`, 'error');
                    } else if (res.count === 0) {
                      showToast('UUID belum ditemukan di tabel couple_members.', 'info');
                    }
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${checkingMember ? 'animate-spin' : ''}`} />
                  <span>{checkingMember ? 'Memeriksa...' : 'Cek Ulang'}</span>
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Masuk ke Ruang Kita
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Pendaftaran publik dinonaktifkan. Masuk menggunakan salah satu dari dua akun pasangan kalian.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="mt-1.5 min-h-[46px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Kata Sandi
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 min-h-[46px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:border-rose-400 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p role="alert" className="rounded-xl bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-500 dark:text-rose-300">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                >
                  {submitting ? 'Memeriksa akses...' : 'Masuk Bersama'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] lg:text-left">
          Semua data terlindungi Row Level Security & terenkripsi saat transit.
        </p>
      </div>
    </div>
  );
};
