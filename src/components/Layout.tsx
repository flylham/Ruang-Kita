import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookHeart,
  CalendarDays,
  CheckSquare,
  Clock,
  FileText,
  Gamepad2,
  Heart,
  Home,
  Images,
  Lock,
  Mail,
  Menu,
  MessageCircleHeart,
  Moon,
  Music2,
  Pause,
  Play,
  Settings,
  Sparkles,
  Sun,
  Timer,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useTheme } from '../hooks/usePWAInstall';
import { HugOverlay } from './HugOverlay';
import { SignedImage } from './SignedImage';

const SECONDARY_ROUTES = [
  { to: '/kapsul', label: 'Kapsul Waktu', desc: 'Pesan terkunci tanggal', icon: Lock },
  { to: '/linimasa', label: 'Linimasa', desc: 'Perjalanan momen kita', icon: Clock },
  { to: '/alasan', label: 'Alasan Sayang', desc: 'Catatan kecil penuh cinta', icon: Heart },
  { to: '/surat', label: 'Surat Cinta', desc: 'Amplop & segel lilin', icon: Mail },
  { to: '/kuis', label: 'Kuis Kita', desc: 'Tebak seberapa kenal', icon: Gamepad2 },
  { to: '/wishlist', label: 'Wishlist', desc: 'Rencana & mimpi berdua', icon: CheckSquare },
  { to: '/playlist', label: 'Playlist Kita', desc: 'Lagu bersejarah kita', icon: Music2 },
  { to: '/mundur', label: 'Hitung Mundur', desc: 'Menanti hari spesial', icon: Timer },
  { to: '/catatan', label: 'Catatan Bersama', desc: 'Edit berdua realtime', icon: FileText },
  { to: '/kalender', label: 'Kalender Kita', desc: 'Agenda & pengingat', icon: CalendarDays },
  { to: '/jurnal', label: 'Jurnal Harian', desc: 'Pribadi atau dibagikan', icon: BookHeart },
  { to: '/kejutan', label: 'Kejutan Terakhir', desc: 'Pertanyaan spesial', icon: Sparkles },
  { to: '/pengaturan', label: 'Pengaturan', desc: 'Profil, tema, & PWA', icon: Settings },
];

export const Layout: React.FC = () => {
  const {
    settings,
    me,
    partner,
    partnerOnline,
    syncStatus,
    pendingCount,
    unreadBadges,
    clearBadge,
    isMusicPlaying,
    toggleMusic,
  } = useCouple();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const handleLogoTap = () => {
    const next = logoTapCount + 1;
    if (next >= 5) {
      setLogoTapCount(0);
      setShowEasterEgg(true);
    } else {
      setLogoTapCount(next);
      window.setTimeout(() => setLogoTapCount(0), 2200);
    }
  };

  const title = settings?.couple_title || 'Ruang Kita';

  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--border-hairline)] lg:bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={handleLogoTap}
            title="Ketuk 5 kali untuk kejutan"
            className="text-left focus-visible:outline-none"
          >
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Status Pasangan & Sinkronisasi (Real Presence & Offline Queue) */}
        <div className="mx-4 mb-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/65 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            {partner?.avatar_url ? (
              <SignedImage
                bucket="photos"
                path={partner.avatar_url}
                alt={partner.display_name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 font-semibold text-rose-400">
                {(partner?.display_name || 'P').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--text-primary)]">
                {partner?.display_name || 'Menunggu Pasangan'}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    partnerOnline ? 'bg-emerald-400' : 'bg-slate-400/50'
                  }`}
                />
                <span>{partnerOnline ? `${partner?.display_name || 'Pasangan'} sedang online` : 'Sedang offline'}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-hairline)] pt-2 text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              {syncStatus === 'waiting' ? (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-500 dark:text-amber-300">
                    Menunggu sinyal{pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Tersinkron'}</span>
                </>
              )}
            </span>
            {settings?.background_music_url && (
              <button
                type="button"
                onClick={toggleMusic}
                className="flex items-center gap-1 font-medium text-rose-500 hover:underline dark:text-rose-300"
              >
                {isMusicPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>Musik</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {[
            { to: '/', label: 'Beranda', icon: Home, badge: 0 },
            { to: '/chat', label: 'Chat Kecil', icon: MessageCircleHeart, badge: unreadBadges.chat },
            { to: '/galeri', label: 'Galeri Foto', icon: Images, badge: unreadBadges.galeri },
            ...SECONDARY_ROUTES,
          ].map((item) => {
            const Icon = item.icon;
            const badge = 'badge' in item ? item.badge : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  if (item.to === '/chat') clearBadge('chat');
                  if (item.to === '/galeri') clearBadge('galeri');
                }}
                className={({ isActive }) =>
                  `flex min-h-[42px] items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-200'
                      : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/5'
                  }`
                }
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {badge > 0 && (
                  <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white tabular-nums">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-hairline)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          Masuk sebagai <span className="font-semibold text-[var(--text-primary)]">{me?.display_name || 'Anggota'}</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Mobile Top Header (<= 52px) */}
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={handleLogoTap}
            className="font-display text-lg font-semibold tracking-tight whitespace-nowrap shrink-0"
          >
            {title}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span
                className={`h-2 w-2 rounded-full ${
                  partnerOnline ? 'bg-emerald-400' : 'bg-slate-400/50'
                }`}
              />
              <span className="max-w-[96px] truncate">
                {syncStatus === 'waiting'
                  ? 'Menunggu sinyal'
                  : partnerOnline
                    ? `${partner?.display_name || 'Pasangan'} online`
                    : 'Tersinkron'}
              </span>
            </span>

            {settings?.background_music_url && (
              <button
                type="button"
                onClick={toggleMusic}
                aria-label={isMusicPlaying ? 'Jeda musik latar' : 'Putar musik latar'}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
              >
                {isMusicPlaying ? (
                  <Pause className="h-4 w-4 text-rose-400" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 pb-24 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Navigasi utama"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className="grid h-16 grid-cols-5 items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? 'text-rose-500 dark:text-rose-300' : 'text-[var(--text-secondary)]'
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span>Beranda</span>
          </NavLink>

          <NavLink
            to="/chat"
            onClick={() => clearBadge('chat')}
            className={({ isActive }) =>
              `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? 'text-rose-500 dark:text-rose-300' : 'text-[var(--text-secondary)]'
              }`
            }
          >
            <div className="relative">
              <MessageCircleHeart className="h-5 w-5" />
              {unreadBadges.chat > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white tabular-nums">
                  {unreadBadges.chat}
                </span>
              )}
            </div>
            <span>Chat</span>
          </NavLink>

          <NavLink
            to="/galeri"
            onClick={() => clearBadge('galeri')}
            className={({ isActive }) =>
              `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? 'text-rose-500 dark:text-rose-300' : 'text-[var(--text-secondary)]'
              }`
            }
          >
            <div className="relative">
              <Images className="h-5 w-5" />
              {unreadBadges.galeri > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white tabular-nums">
                  {unreadBadges.galeri}
                </span>
              )}
            </div>
            <span>Galeri</span>
          </NavLink>

          <NavLink
            to="/linimasa"
            onClick={() => clearBadge('kenangan')}
            className={({ isActive }) =>
              `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                isActive ? 'text-rose-500 dark:text-rose-300' : 'text-[var(--text-secondary)]'
              }`
            }
          >
            <div className="relative">
              <Clock className="h-5 w-5" />
              {unreadBadges.kenangan > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white tabular-nums">
                  {unreadBadges.kenangan}
                </span>
              )}
            </div>
            <span>Linimasa</span>
          </NavLink>

          <button
            type="button"
            onClick={() => {
              clearBadge('lainnya');
              setDrawerOpen(true);
            }}
            className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              drawerOpen ? 'text-rose-500 dark:text-rose-300' : 'text-[var(--text-secondary)]'
            }`}
          >
            <div className="relative">
              <Menu className="h-5 w-5" />
              {unreadBadges.lainnya > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white tabular-nums">
                  {unreadBadges.lainnya}
                </span>
              )}
            </div>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Sheet untuk Semua Fitur */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-xs lg:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82dvh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 pt-2 pb-8 pb-safe"
            >
              <div className="mx-auto my-2 h-1.5 w-10 rounded-full bg-[var(--text-secondary)]/30" />
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="font-display text-lg font-semibold">Semua Ruang Kita</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Tutup menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-secondary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SECONDARY_ROUTES.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate(item.to);
                      }}
                      className={`flex min-h-[68px] flex-col items-start justify-center gap-1 rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? 'border-rose-400/50 bg-rose-500/15 text-rose-500 dark:text-rose-200'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="line-clamp-1 text-[11px] text-[var(--text-secondary)]">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg Modal (Ketuk Logo 5x) */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEasterEgg(false)}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-amber-300/30 bg-[#1b1230] p-7 text-center text-white shadow-2xl"
            >
              <Sparkles className="mx-auto h-8 w-8 text-amber-300" />
              <h3 className="font-display mt-3 text-2xl font-semibold text-amber-200">
                Pesan Rahasia Untukmu
              </h3>
              <p className="font-hand mt-3 text-2xl leading-relaxed text-rose-200">
                "Di antara miliaran detik di dunia ini, detik yang paling kutunggu selalu detik saat kita bertemu lagi."
              </p>
              <p className="mt-4 text-xs text-purple-200/70">
                Kamu menemukan rahasia kecil dengan mengetuk logo 5 kali.
              </p>
              <button
                type="button"
                onClick={() => setShowEasterEgg(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Simpan di Hati
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HugOverlay />
    </div>
  );
};
