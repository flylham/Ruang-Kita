import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, ImagePlus, Send, Smile, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import {
  useChatMessages,
  useMarkChatRead,
  useSendChatMessage,
} from '../hooks/useCoupleData';
import { formatShortTime } from '../lib/formatters';
import { SignedImage } from '../components/SignedImage';

const QUICK_EMOJIS = ['❤️', '😘', '🫂', '🥰', '😂', '🥺', '✨', '☕', '🌙', '💐'];

export const ChatPage: React.FC = () => {
  const { user, partner, partnerOnline, partnerTypingIn, setTyping, clearBadge, getMemberName } =
    useCouple();
  const { data: messages = [], isLoading } = useChatMessages();
  const sendMessage = useSendChatMessage();
  const markRead = useMarkChatRead();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    clearBadge('chat');
  }, [clearBadge]);

  const lastMarkedRef = useRef<string>('');

  // Tandai pesan dari pasangan sebagai terbaca saat chat dibuka
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unreadPartnerIds = messages
      .filter((m) => m.created_by && m.created_by !== user.id && !m.read_at && !m._optimistic)
      .map((m) => m.id);
    const key = unreadPartnerIds.join(',');
    if (unreadPartnerIds.length > 0 && key !== lastMarkedRef.current) {
      lastMarkedRef.current = key;
      markRead.mutate(unreadPartnerIds);
    }
  }, [messages, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, partnerTypingIn]);

  const handleTextChange = (val: string) => {
    setText(val);
    setTyping(val.trim() ? 'chat' : null);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setTyping(null), 2600);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    const currentText = text;
    const currentFile = selectedFile ?? undefined;

    setText('');
    setTyping(null);
    setShowEmojis(false);
    clearSelectedFile();

    sendMessage.mutate({ content: currentText, photoFile: currentFile });
  };

  return (
    <div className="flex h-[calc(100dvh-146px)] flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] lg:h-[calc(100dvh-64px)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-3.5 sm:px-6">
        <div>
          <h1 className="font-display text-lg font-semibold sm:text-xl">
            Chat Berdua dengan {partner?.display_name || 'Pasangan'}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span
              className={`h-2 w-2 rounded-full ${
                partnerOnline ? 'bg-emerald-400' : 'bg-slate-400/50'
              }`}
            />
            <span>
              {partnerTypingIn === 'chat'
                ? `${partner?.display_name || 'Pasangan'} sedang mengetik...`
                : partnerOnline
                  ? `${partner?.display_name || 'Pasangan'} sedang online`
                  : 'Pesan tetap tersimpan dan tersinkron'}
            </span>
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
            <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-[var(--bg-elevated)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-hand text-2xl text-amber-400">Ruang chat masih sepi</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Kirim sapaan manis pertama kalian hari ini.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.created_by === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <span className="mb-1 px-1 text-[11px] text-[var(--text-secondary)]">
                  {getMemberName(msg.created_by)}
                </span>
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[68%] ${
                    isMine
                      ? 'rounded-br-sm bg-rose-600 text-white'
                      : 'rounded-bl-sm border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  }`}
                >
                  {msg.photo_path && (
                    <SignedImage
                      bucket="chat"
                      path={msg.photo_path}
                      alt="Foto di chat"
                      className="mb-2 max-h-64 w-full rounded-xl object-cover"
                    />
                  )}
                  {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums ${
                      isMine ? 'text-rose-100/80' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>{formatShortTime(msg.created_at)}</span>
                    {isMine &&
                      (msg.read_at ? (
                        <span className="flex items-center gap-0.5 text-amber-200">
                          <CheckCheck className="h-3 w-3" />
                          <span>Dibaca</span>
                        </span>
                      ) : (
                        <Check className="h-3 w-3 opacity-80" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {partnerTypingIn === 'chat' && (
          <div className="flex items-center gap-2 text-xs italic text-[var(--text-secondary)]">
            <span>{partner?.display_name || 'Pasangan'} sedang mengetik...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Photo Preview Bar */}
      {previewUrl && (
        <div className="flex items-center gap-3 border-t border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-4 py-2">
          <img src={previewUrl} alt="Pratinjau foto" className="h-14 w-14 rounded-xl object-cover" />
          <span className="flex-1 truncate text-xs text-[var(--text-secondary)]">
            Siap dikirim (otomatis dikompres)
          </span>
          <button
            type="button"
            onClick={clearSelectedFile}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Emoji Quick Strip */}
      {showEmojis && (
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--border-hairline)] bg-[var(--bg-elevated)]/40 px-4 py-2">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleTextChange(text + em)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl hover:bg-black/5 dark:hover:bg-white/10"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-[var(--border-hairline)] p-3 sm:px-4"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFilePick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Kirim foto"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ImagePlus className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojis((v) => !v)}
          aria-label="Pilih emoji"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Smile className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Tulis pesan manis..."
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 px-3.5 text-sm focus:border-rose-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={sendMessage.isPending || (!text.trim() && !selectedFile)}
          aria-label="Kirim pesan"
          className="flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-rose-600 px-4 text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
