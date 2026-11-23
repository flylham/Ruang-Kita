import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Edit3, Heart, Sparkles } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useUpdateSettings } from '../hooks/useCoupleData';

export const SurprisePage: React.FC = () => {
  const { settings, partner } = useCouple();
  const updateSettings = useUpdateSettings();

  const [accepted, setAccepted] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(
    settings?.proposal_question || 'Mau terus berjalan bersamaku selamanya?'
  );
  const [subtext, setSubtext] = useState(
    settings?.proposal_subtext || 'Terima kasih sudah menjadi tempat pulang yang paling tenang.'
  );

  const dodgeNoButton = () => {
    const x = Math.round((Math.random() - 0.5) * 200);
    const y = Math.round((Math.random() - 0.5) * 140);
    setNoPos({ x, y });
  };

  const handleAccept = () => {
    setAccepted(true);
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#e37b99', '#e5b971', '#f472b6', '#ffffff'],
    });
  };

  const handleSaveText = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      proposal_question: question.trim(),
      proposal_subtext: subtext.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Kejutan Terakhir</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Halaman spesial yang isinya bisa kalian ubah kapan saja.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setQuestion(settings?.proposal_question || question);
            setSubtext(settings?.proposal_subtext || subtext);
            setEditing((v) => !v);
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 text-sm font-medium"
        >
          <Edit3 className="h-4 w-4 text-amber-400" />
          <span>Ubah Teks</span>
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSaveText}
          className="space-y-3 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pertanyaan spesial..."
            className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
          />
          <input
            type="text"
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="Subteks romantis..."
            className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
          />
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="min-h-[44px] rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white"
          >
            Simpan Teks Kejutan
          </button>
        </form>
      )}

      <div className="relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center">
        <Sparkles className="h-9 w-9 text-amber-400" />
        <h2 className="font-display mt-4 max-w-lg text-3xl font-semibold text-balance sm:text-4xl">
          {settings?.proposal_question || question}
        </h2>
        <p className="font-hand mt-3 max-w-md text-2xl text-[var(--text-secondary)]">
          {settings?.proposal_subtext || subtext}
        </p>

        {accepted ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-6 py-4"
          >
            <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-200">
              <Heart className="h-5 w-5 fill-current" />
              <span className="font-display text-lg font-semibold">
                Selamanya bersama {partner?.display_name || 'kamu'}!
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleAccept}
              className="min-h-[50px] min-w-[140px] rounded-2xl bg-rose-600 px-7 text-base font-semibold text-white shadow-lg transition hover:bg-rose-500"
            >
              Mau ❤️
            </button>
            <motion.button
              type="button"
              animate={{ x: noPos.x, y: noPos.y }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              onMouseEnter={dodgeNoButton}
              onTouchStart={dodgeNoButton}
              onClick={dodgeNoButton}
              className="min-h-[50px] min-w-[120px] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-6 text-sm font-medium text-[var(--text-secondary)]"
            >
              Tidak
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
