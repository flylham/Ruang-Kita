import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useAddEvent, useDeleteEvent, useEvents } from '../hooks/useCoupleData';
import { formatDateId } from '../lib/formatters';
import { ItemMeta } from '../components/ItemMeta';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const CalendarPage: React.FC = () => {
  const { data: events = [], isLoading } = useEvents();
  const addEvent = useAddEvent();
  const deleteEvent = useDeleteEvent();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('kencan');
  const [reminderNote, setReminderNote] = useState('');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, typeof events>();
    events.forEach((ev) => {
      const d = new Date(ev.event_date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), ev]);
      }
    });
    return map;
  }, [events, year, month]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    await addEvent.mutateAsync({
      title: title.trim(),
      event_date: new Date(eventDate).toISOString(),
      category,
      reminder_note: reminderNote.trim(),
    });
    setTitle('');
    setEventDate('');
    setReminderNote('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Kalender Kita</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Tanggal penting, jadwal kencan, dan pengingat bersama.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Acara</span>
        </button>
      </div>

      {/* Grid Kalender Bulanan */}
      <section className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="Bulan sebelumnya"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="Bulan berikutnya"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-secondary)]">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
            <div key={d} className="py-1.5">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            const hasEvents = day ? (eventsByDay.get(day)?.length ?? 0) > 0 : false;
            const today = new Date();
            const isToday =
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={idx}
                className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border text-xs tabular-nums ${
                  day === null
                    ? 'border-transparent'
                    : isToday
                      ? 'border-rose-400 bg-rose-500/15 font-bold text-rose-500 dark:text-rose-200'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]/35'
                }`}
              >
                {day && (
                  <>
                    <span>{day}</span>
                    {hasEvents && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Daftar Agenda & Pengingat */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Agenda &amp; Pengingat</h2>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-[var(--text-secondary)]/50" />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Belum ada agenda tercantum.</p>
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <div>
                <p className="text-xs font-semibold text-amber-500 dark:text-amber-300">
                  {formatDateId(ev.event_date, true)} · {ev.category}
                </p>
                <h3 className="font-display mt-0.5 text-lg font-semibold">{ev.title}</h3>
                {ev.reminder_note && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Bell className="h-3.5 w-3.5 text-rose-400" />
                    <span>{ev.reminder_note}</span>
                  </p>
                )}
                <div className="mt-2">
                  <ItemMeta createdBy={ev.created_by} createdAt={ev.created_at} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteEvent.mutate(ev.id)}
                aria-label="Hapus acara"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Tambah Acara Kalender</h2>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nama acara / rencana"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3 text-sm"
              >
                <option value="kencan">Kencan</option>
                <option value="anniversary">Anniversary</option>
                <option value="ulang-tahun">Ulang Tahun</option>
                <option value="liburan">Liburan</option>
              </select>
              <input
                type="text"
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Pengingat (misal: Bawa jaket hangat)"
                className="min-h-[44px] w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addEvent.isPending}
              className="mt-5 min-h-[46px] w-full rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Simpan ke Kalender
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
