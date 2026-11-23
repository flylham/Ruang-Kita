import React, { useState } from 'react';
import { CheckCircle2, Gamepad2, Plus, Trash2, X, XCircle } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useAddQuiz,
  useDeleteQuiz,
  useQuiz,
  useQuizAnswers,
  useSubmitQuizAnswer,
} from '../hooks/useCoupleData';
import { ItemMeta } from '../components/ItemMeta';

export const QuizPage: React.FC = () => {
  const { user, me, partner } = useCouple();
  const { data: questions = [], isLoading } = useQuiz();
  const { data: answers = [] } = useQuizAnswers();
  const addQuiz = useAddQuiz();
  const submitAnswer = useSubmitQuizAnswer();
  const deleteQuiz = useDeleteQuiz();

  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  const myScore = answers.filter((a) => a.created_by === user?.id && a.is_correct).length;
  const partnerScore = answers.filter(
    (a) => a.created_by && a.created_by !== user?.id && a.is_correct
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    await addQuiz.mutateAsync({
      question: question.trim(),
      options: cleaned,
      correct_index: Math.min(correctIndex, cleaned.length - 1),
    });
    setQuestion('');
    setOptions(['', '', '']);
    setCorrectIndex(0);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Kuis Tentang Kita</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Buat pertanyaan untuk satu sama lain dan lihat siapa yang paling hafal detail kecil kita.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Pertanyaan</span>
        </button>
      </div>

      {/* Papan Skor Berdua */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 text-center">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            {me?.display_name || 'Skor Kamu'}
          </p>
          <p className="font-display mt-1 text-3xl font-semibold text-rose-500 tabular-nums dark:text-rose-300">
            {myScore}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 text-center">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            {partner?.display_name || 'Skor Pasangan'}
          </p>
          <p className="font-display mt-1 text-3xl font-semibold text-amber-500 tabular-nums dark:text-amber-300">
            {partnerScore}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-[var(--bg-elevated)]" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <Gamepad2 className="mx-auto h-8 w-8 text-[var(--text-secondary)]/50" />
          <p className="mt-3 font-display text-lg font-medium">Belum ada pertanyaan kuis</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Misal: "Apa makanan yang kupesan waktu kencan pertama kita?"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const myAns = answers.find((a) => a.quiz_id === q.id && a.created_by === user?.id);
            const isCreator = q.created_by === user?.id;
            return (
              <div
                key={q.id}
                className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{q.question}</h3>
                    <div className="mt-1">
                      <ItemMeta createdBy={q.created_by} createdAt={q.created_at} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteQuiz.mutate(q.id)}
                    aria-label="Hapus pertanyaan"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(q.options || []).map((opt, idx) => {
                    const picked = myAns?.selected_index === idx;
                    const showResult = Boolean(myAns) || isCreator;
                    const isCorrectOpt = idx === q.correct_index;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={Boolean(myAns) || isCreator}
                        onClick={() =>
                          submitAnswer.mutate({
                            quiz_id: q.id,
                            selected_index: idx,
                            is_correct: idx === q.correct_index,
                          })
                        }
                        className={`flex min-h-[46px] items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                          showResult && isCorrectOpt
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : picked && !isCorrectOpt
                              ? 'border-rose-500/60 bg-rose-500/15 text-rose-500'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]/50 hover:border-rose-400/50'
                        }`}
                      >
                        <span>{opt}</span>
                        {showResult && isCorrectOpt && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        {picked && !isCorrectOpt && <XCircle className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {isCreator && (
                  <p className="mt-2.5 text-xs text-[var(--text-secondary)]">
                    Pertanyaan buatanmu · menunggu jawaban {partner?.display_name || 'pasangan'}.
                  </p>
                )}
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
              <h2 className="font-display text-xl font-semibold">Buat Pertanyaan Kuis</h2>
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
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pertanyaan tentang kita..."
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                    aria-label={`Tandai opsi ${idx + 1} benar`}
                    className="h-4 w-4 accent-rose-600"
                  />
                  <input
                    type="text"
                    required={idx < 2}
                    value={opt}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                    }
                    placeholder={`Pilihan ${idx + 1}${idx === 2 ? ' (opsional)' : ''}`}
                    className="min-h-[42px] flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
                  />
                </div>
              ))}
              <p className="text-[11px] text-[var(--text-secondary)]">
                Pilih bulatan di kiri untuk menandai jawaban yang benar.
              </p>
            </div>
            <button
              type="submit"
              disabled={addQuiz.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan Pertanyaan
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
