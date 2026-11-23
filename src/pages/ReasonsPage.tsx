import React, { useMemo, useState } from 'react';
import { Heart, Plus, Shuffle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCouple } from '../context/CoupleContext';
import { useAddReason, useDeleteReason, useReasons } from '../hooks/useCoupleData';
import { ItemMeta } from '../components/ItemMeta';

export const ReasonsPage: React.FC = () => {
  const { user, partner, getMemberName } = useCouple();
  const { data: reasons = [], isLoading } = useReasons();
  const addReason = useAddReason();
  const deleteReason = useDeleteReason();

  const [newReason, setNewReason] = useState('');
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const partnerReasons = useMemo(() => {
    const fromPartner = reasons.filter((r) => !r.created_by || r.created_by !== user?.id);
    return fromPartner.length > 0 ? fromPartner : reasons;
  }, [reasons, user?.id]);

  const currentReason = reasons.find((r) => r.id === currentId) ?? partnerReasons[0] ?? null;

  const pickRandomReason = () => {
    if (partnerReasons.length === 0) return;
    let remaining = partnerReasons.filter((r) => !seenIds.includes(r.id) && r.id !== currentReason?.id);
    let nextSeen = seenIds;
    if (remaining.length === 0) {
      remaining = partnerReasons.filter((r) => r.id !== currentReason?.id);
      if (remaining.length === 0) remaining = partnerReasons;
      nextSeen = [];
    }
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrentId(chosen.id);
    setSeenIds([...nextSeen, chosen.id]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    await addReason.mutateAsync(newReason.trim());
    setNewReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          Alasan Aku Sayang Kamu
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ambil satu kartu acak dari {partner?.display_name || 'pasangan'} tanpa mengulang sampai semua terbaca.
        </p>
      </div>

      {/* Kartu Acak */}
      <section className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center sm:p-8">
        <AnimatePresence mode="wait">
          {currentReason ? (
            <motion.div
              key={currentReason.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-xl"
            >
              <Heart className="mx-auto h-7 w-7 fill-rose-400 text-rose-400" />
              <p className="font-hand mt-4 text-3xl leading-relaxed text-[var(--text-primary)] sm:text-4xl">
                "{currentReason.content}"
              </p>
              <p className="mt-4 text-xs text-[var(--text-secondary)]">
                Ditulis oleh {getMemberName(currentReason.created_by)}
              </p>
            </motion.div>
          ) : (
            <p className="py-6 text-sm text-[var(--text-secondary)]">
              Belum ada alasan yang ditulis. Mulailah menulis satu di bawah!
            </p>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={pickRandomReason}
          disabled={partnerReasons.length === 0}
          className="mx-auto mt-6 flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
        >
          <Shuffle className="h-4 w-4" />
          <span>Tampilkan Alasan Acak ({seenIds.length}/{partnerReasons.length})</span>
        </button>
      </section>

      {/* Form Tambah */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2.5 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:flex-row"
      >
        <input
          type="text"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="Tulis alasan baru kenapa kamu sayang dia..."
          className="min-h-[46px] flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-4 text-sm focus:border-rose-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={addReason.isPending || !newReason.trim()}
          className="flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Tambahkan</span>
        </button>
      </form>

      {/* Daftar Semua Alasan */}
      {!isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {reasons.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <div>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">{item.content}</p>
                <div className="mt-2">
                  <ItemMeta createdBy={item.created_by} createdAt={item.created_at} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteReason.mutate(item.id)}
                aria-label="Hapus alasan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
