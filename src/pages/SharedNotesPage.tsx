import React, { useEffect, useRef, useState } from 'react';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useToast } from '../context/ToastContext';
import {
  useAddNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '../hooks/useCoupleData';
import { ItemMeta } from '../components/ItemMeta';

export const SharedNotesPage: React.FC = () => {
  const { partner, partnerTypingIn, setTyping, registerEditingId } = useCouple();
  const { showToast } = useToast();
  const { data: notes = [], isLoading } = useNotes();
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const typingTimerRef = useRef<number | null>(null);

  const activeNote = notes.find((n) => n.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    if (activeNote) {
      setSelectedId(activeNote.id);
      setTitle(activeNote.title);
      setContent(activeNote.content);
      registerEditingId(activeNote.id);
    } else {
      registerEditingId(null);
    }
    return () => registerEditingId(null);
  }, [activeNote?.id, activeNote?.updated_at]);

  const handleTyping = () => {
    setTyping('notes');
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setTyping(null), 2200);
  };

  const handleCreateNote = async () => {
    const res = await addNote.mutateAsync({
      title: 'Catatan Baru',
      content: '',
    });
    if (res.data && typeof res.data === 'object' && 'id' in res.data) {
      setSelectedId((res.data as { id: string }).id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote) return;
    setTyping(null);
    await updateNote.mutateAsync({
      id: activeNote.id,
      title: title.trim() || 'Tanpa Judul',
      content,
    });
    showToast('Catatan bersama tersimpan & tersinkron!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Catatan Bersama</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {partnerTypingIn === 'notes'
              ? `${partner?.display_name || 'Pasangan'} sedang mengetik di catatan...`
              : 'Daftar belanja, rencana liburan, atau catatan kecil yang bisa diedit berdua.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateNote}
          disabled={addNote.isPending}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Catatan Baru</span>
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada catatan bersama</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Daftar Catatan */}
          <div className="space-y-2 lg:col-span-4">
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedId(n.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  activeNote?.id === n.id
                    ? 'border-rose-400/60 bg-rose-500/10'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]/40'
                }`}
              >
                <p className="truncate text-sm font-semibold">{n.title}</p>
                <p className="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">
                  {n.content || 'Catatan kosong'}
                </p>
              </button>
            ))}
          </div>

          {/* Editor */}
          {activeNote && (
            <form
              onSubmit={handleSave}
              className="flex flex-col rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 lg:col-span-8"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    handleTyping();
                  }}
                  className="font-display min-w-0 flex-1 bg-transparent text-xl font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => deleteNote.mutate(activeNote.id)}
                  aria-label="Hapus catatan"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1">
                <ItemMeta createdBy={activeNote.created_by} createdAt={activeNote.updated_at} />
              </div>

              <textarea
                rows={12}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  handleTyping();
                }}
                placeholder="Tulis bersama di sini..."
                className="mt-4 w-full flex-1 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/45 p-4 text-sm leading-relaxed focus:border-rose-400 focus:outline-none"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-secondary)]">
                  {partnerTypingIn === 'notes'
                    ? `${partner?.display_name || 'Pasangan'} sedang mengetik...`
                    : 'Sinkron last-write-wins aktif'}
                </span>
                <button
                  type="submit"
                  disabled={updateNote.isPending}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-500"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateNote.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
