import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useMoods,
  useSendHug,
  useUpsertMood,
} from '../hooks/useCoupleData';
import { getTimeGreeting } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';
import { SignedImage } from '../components/SignedImage';

const MOOD_EMOJIS = ['🥰', '🌸', '☀️', '😴', '☕', '🌧️', '🥺', '✨'];

export const HomePage: React.FC = () => {
  const { me, partner, user } = useCouple();

  const { data: moods = [], isLoading: loadingMoods } = useMoods();
  const upsertMood = useUpsertMood();
  const sendHug = useSendHug();

  const [now, setNow] = useState(() => new Date());
  const [myEmoji, setMyEmoji] = useState('🥰');
  const [myNote, setMyNote] = useState('');
  const [hugNote, setHugNote] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const myMoodRow = moods.find((m) => m.created_by === user?.id);
  const partnerMoodRow = moods.find((m) => m.created_by && m.created_by !== user?.id);

  useEffect(() => {
    if (myMoodRow) {
      setMyEmoji(myMoodRow.emoji);
      setMyNote(myMoodRow.note || '');
    }
  }, [myMoodRow?.emoji, myMoodRow?.note]);

  const greeting = getTimeGreeting(now);

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMood.mutate({ emoji: myEmoji, note: myNote.trim() });
  };

  const handleSendHug = (kind: 'peluk' | 'cium') => {
    sendHug.mutate(
      { kind, message: hugNote.trim() || undefined },
      { onSuccess: () => setHugNote('') }
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner Sapaan */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[#19102b] text-white">
        <img
          src="/src/assets/images/ruang_kita_hero_1795395774569.jpg"
          alt="Balkon senja Ruang Kita"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120b20] via-[#120b20]/65 to-[#120b20]/30" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-amber-200 sm:text-4xl">
            {greeting}, {me?.display_name || 'Sayang'}
          </h1>
        </div>
      </section>

      {/* Mood Hari Ini + Kirim Peluk/Cium */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Mood Hari Ini (Kedua Sisi) */}
        <section className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Mood Hari Ini</h2>
            <span className="text-xs text-[var(--text-secondary)]">Sinkron berdua</span>
          </div>

          {loadingMoods ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="h-32 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
              <div className="h-32 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Mood Saya */}
              <form
                onSubmit={handleSaveMood}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-500 dark:text-rose-300">
                      {me?.display_name || 'Mood Kamu'}
                    </span>
                    <span className="text-2xl">{myEmoji}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {MOOD_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setMyEmoji(em);
                          upsertMood.mutate({ emoji: em, note: myNote.trim() });
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                          myEmoji === em
                            ? 'bg-rose-500/20 ring-1 ring-rose-400'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    maxLength={80}
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="Lagi merasa apa hari ini..."
                    className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-xs focus:border-rose-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={upsertMood.isPending}
                    className="flex min-h-[42px] shrink-0 items-center justify-center rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500"
                  >
                    Simpan
                  </button>
                </div>
              </form>

              {/* Mood Pasangan */}
              <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/40 p-4">
                <div className="flex items-center gap-3">
                  {partner?.avatar_url ? (
                    <SignedImage
                      bucket="photos"
                      path={partner.avatar_url}
                      alt={partner.display_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 font-semibold text-amber-500 dark:text-amber-200">
                      {(partner?.display_name || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{partner?.display_name || 'Pasangan'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {partnerMoodRow ? 'Baru saja diperbarui' : 'Belum mengisi mood'}
                    </p>
                  </div>
                </div>

                <div className="my-4 flex items-center gap-3">
                  <span className="text-4xl">{partnerMoodRow?.emoji || '🌙'}</span>
                  <p className="font-hand text-2xl leading-snug text-[var(--text-primary)]">
                    {partnerMoodRow?.note || 'Menunggu kabarmu hari ini...'}
                  </p>
                </div>

                {partnerMoodRow && (
                  <ItemMeta createdBy={partnerMoodRow.created_by} createdAt={partnerMoodRow.updated_at} />
                )}
              </div>
            </div>
          )}
        </section>

        {/* Kirim Peluk / Cium Realtime */}
        <section className="flex flex-col justify-between rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
              <h2 className="font-display text-xl font-semibold">Kirim Peluk &amp; Cium</h2>
            </div>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Ketuk salah satu tombol untuk memunculkan animasi hati secara langsung di layar{' '}
              {partner?.display_name || 'pasanganmu'}.
            </p>
            <input
              type="text"
              maxLength={90}
              value={hugNote}
              onChange={(e) => setHugNote(e.target.value)}
              placeholder="Sisipkan pesan singkat (opsional)..."
              className="mt-4 min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handleSendHug('peluk')}
              disabled={sendHug.isPending}
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              <span aria-hidden="true">🫂</span>
              <span>Kirim Peluk</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handleSendHug('cium')}
              disabled={sendHug.isPending}
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-400/25 dark:text-amber-200"
            >
              <span aria-hidden="true">😘</span>
              <span>Kirim Cium</span>
            </motion.button>
          </div>
        </section>
      </div>
    </div>
  );
};
