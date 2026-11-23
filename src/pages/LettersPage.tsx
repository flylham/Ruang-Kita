import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mail, Plus, Trash2, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useAddLetter,
  useDeleteLetter,
  useLetters,
  useMarkLetterOpened,
} from '../hooks/useCoupleData';
import { ItemMeta } from '../components/ItemMeta';
import type { LoveLetter } from '../types/database';

export const LettersPage: React.FC = () => {
  const { partner, getMemberName } = useCouple();
  const { data: letters = [], isLoading } = useLetters();
  const addLetter = useAddLetter();
  const markOpened = useMarkLetterOpened();
  const deleteLetter = useDeleteLetter();

  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [openedLetter, setOpenedLetter] = useState<LoveLetter | null>(null);

  const handleOpenEnvelope = (letter: LoveLetter) => {
    setOpenedLetter(letter);
    if (!letter.is_opened) {
      markOpened.mutate(letter.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await addLetter.mutateAsync({ title: title.trim(), body: body.trim() });
    setTitle('');
    setBody('');
    setShowEditor(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Surat Cinta</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Ketuk amplop bersegel lilin untuk membuka surat dari {partner?.display_name || 'pasangan'}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEditor(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Surat</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-56 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-rose-400/70" />
          <p className="mt-3 font-display text-lg font-medium">Kotak surat masih kosong</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Tulis surat panjang penuh rasa syukur atau rindu untuk dia baca pelan-pelan.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="group overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
            >
              <button
                type="button"
                onClick={() => handleOpenEnvelope(letter)}
                className="relative block h-44 w-full overflow-hidden text-left"
              >
                <img
                  src="/src/assets/images/envelope_wax_seal_1795395773138.jpg"
                  alt="Amplop surat bersegel lilin"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute right-4 bottom-3 left-4 text-white">
                  <p className="text-[11px] text-amber-200">
                    {letter.is_opened ? 'Sudah dibuka' : 'Amplop baru · Ketuk untuk membuka'}
                  </p>
                  <h3 className="font-display text-lg font-semibold">{letter.title}</h3>
                </div>
              </button>
              <div className="flex items-center justify-between px-4 py-3">
                <ItemMeta createdBy={letter.created_by} createdAt={letter.created_at} />
                <button
                  type="button"
                  onClick={() => deleteLetter.mutate(letter.id)}
                  aria-label="Hapus surat"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animasi Amplop Terbuka */}
      <AnimatePresence>
        {openedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenedLetter(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-300/25 bg-[#fcf7f2] p-6 text-[#2c1d2e] shadow-2xl sm:p-8 dark:bg-[#1e1533] dark:text-[#f6eff8]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-hand text-xl text-rose-500 dark:text-amber-300">
                    Untuk yang tersayang,
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-semibold">{openedLetter.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenedLetter(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 whitespace-pre-wrap text-base leading-relaxed">
                {openedLetter.body}
              </div>
              <p className="font-hand mt-6 text-right text-2xl text-rose-600 dark:text-rose-300">
                — Dengan cinta, {getMemberName(openedLetter.created_by)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Surat */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Tulis Surat Cinta</h2>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
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
                placeholder="Judul surat..."
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <textarea
                rows={7}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tulis isi hatimu di sini..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 p-3.5 text-sm leading-relaxed"
              />
            </div>
            <button
              type="submit"
              disabled={addLetter.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              {addLetter.isPending ? 'Menyegel Amplop...' : 'Segel & Kirim Surat'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
