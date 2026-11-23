import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { flushOfflineQueue, subscribeQueueCount } from '../lib/offlineQueue';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { useToast } from './ToastContext';
import type { CoupleMember, CoupleSettings } from '../types/database';

export type TypingLocation = 'chat' | 'notes' | null;

export interface ActiveHugEffect {
  id: string;
  kind: 'peluk' | 'cium';
  senderName: string;
  message?: string;
}

export interface UnreadBadges {
  chat: number;
  galeri: number;
  kenangan: number;
  lainnya: number;
}

interface CoupleContextValue {
  isConfigured: boolean;
  session: Session | null;
  user: User | null;
  members: CoupleMember[];
  me: CoupleMember | null;
  partner: CoupleMember | null;
  isAuthorizedMember: boolean;
  isLoadingAuth: boolean;
  memberCheckError: string | null;
  settings: CoupleSettings | null;
  partnerOnline: boolean;
  partnerTypingIn: TypingLocation;
  setTyping: (location: TypingLocation) => void;
  syncStatus: 'synced' | 'waiting' | 'syncing';
  pendingCount: number;
  isOnline: boolean;
  activeHug: ActiveHugEffect | null;
  clearActiveHug: () => void;
  triggerLocalHugEffect: (kind: 'peluk' | 'cium', senderName: string, message?: string) => void;
  unreadBadges: UnreadBadges;
  clearBadge: (key: keyof UnreadBadges) => void;
  registerEditingId: (id: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCoupleData: () => Promise<{ count: number; error: string | null }>;
  getMemberName: (userId: string | null | undefined) => string;
  getMemberAvatar: (userId: string | null | undefined) => string | null;
  isMusicPlaying: boolean;
  toggleMusic: () => void;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

const TABLE_TO_QUERY_KEYS: Record<string, string[][]> = {
  couple_members: [['couple_members']],
  settings: [['settings']],
  albums: [['albums'], ['activities']],
  photos: [['photos'], ['activities']],
  photo_reactions: [['photo_reactions']],
  messages: [['time_capsules'], ['activities']],
  reasons: [['reasons']],
  timeline: [['timeline'], ['activities']],
  letters: [['letters'], ['activities']],
  quiz: [['quiz']],
  quiz_answers: [['quiz_answers']],
  wishlist: [['wishlist'], ['activities']],
  songs: [['songs']],
  countdowns: [['countdowns']],
  notes: [['notes'], ['activities']],
  events: [['events']],
  journal: [['journal']],
  chat_messages: [['chat_messages'], ['activities']],
  moods: [['moods'], ['activities']],
  hugs: [['hugs'], ['activities']],
};

const TABLE_NOTIF_LABEL: Record<string, { label: string; badge?: keyof UnreadBadges }> = {
  photos: { label: 'menambahkan foto baru', badge: 'galeri' },
  albums: { label: 'memperbarui album foto', badge: 'galeri' },
  chat_messages: { label: 'mengirim pesan baru', badge: 'chat' },
  moods: { label: 'memperbarui mood hari ini' },
  timeline: { label: 'menambahkan momen di linimasa', badge: 'kenangan' },
  messages: { label: 'menitipkan kapsul waktu', badge: 'kenangan' },
  letters: { label: 'menulis surat cinta', badge: 'kenangan' },
  reasons: { label: 'menambahkan alasan sayang', badge: 'kenangan' },
  wishlist: { label: 'memperbarui wishlist kita', badge: 'lainnya' },
  notes: { label: 'mengedit catatan bersama', badge: 'lainnya' },
  events: { label: 'menambahkan acara kalender', badge: 'lainnya' },
  songs: { label: 'menambahkan lagu ke playlist', badge: 'lainnya' },
  countdowns: { label: 'membuat hitung mundur baru', badge: 'lainnya' },
  quiz: { label: 'membuat pertanyaan kuis baru', badge: 'lainnya' },
  journal: { label: 'menulis jurnal baru', badge: 'lainnya' },
};

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [settings, setSettings] = useState<CoupleSettings | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [memberCheckError, setMemberCheckError] = useState<string | null>(null);

  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTypingIn, setPartnerTypingIn] = useState<TypingLocation>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  const [activeHug, setActiveHug] = useState<ActiveHugEffect | null>(null);
  const [unreadBadges, setUnreadBadges] = useState<UnreadBadges>({
    chat: 0,
    galeri: 0,
    kenangan: 0,
    lainnya: 0,
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const dbChannelRef = useRef<RealtimeChannel | null>(null);
  const editingIdRef = useRef<string | null>(null);
  const currentTypingRef = useRef<TypingLocation>(null);
  const membersRef = useRef<CoupleMember[]>([]);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Monitor IndexedDB offline queue
  useEffect(() => {
    return subscribeQueueCount(setPendingCount);
  }, []);

  const runQueueFlush = useCallback(async () => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    setIsSyncingQueue(true);
    try {
      const { processed } = await flushOfflineQueue();
      if (processed > 0) {
        showToast(`${processed} perubahan offline berhasil disinkronkan.`, 'success');
        queryClient.invalidateQueries();
      }
    } finally {
      setIsSyncingQueue(false);
    }
  }, [queryClient, showToast]);

  const fetchCoupleMetadata = useCallback(async (): Promise<{ count: number; error: string | null }> => {
    if (!supabase) return { count: 0, error: 'Supabase belum dikonfigurasi' };
    const [membersRes, settingsRes] = await Promise.all([
      supabase.from('couple_members').select('*').order('created_at', { ascending: true }),
      supabase.from('settings').select('*').limit(1).maybeSingle(),
    ]);
    if (membersRes.error) {
      setMemberCheckError(`${membersRes.error.message} (${membersRes.error.code || 'ERR'})`);
      return { count: 0, error: membersRes.error.message };
    }
    setMemberCheckError(null);
    const rows = (membersRes.data ?? []) as CoupleMember[];
    setMembers(rows);
    if (settingsRes.data) {
      setSettings(settingsRes.data as CoupleSettings);
    }
    return { count: rows.length, error: null };
  }, []);

  // Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoadingAuth(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await fetchCoupleMetadata();
      }
      setIsLoadingAuth(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setMembers([]);
        setSettings(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCoupleMetadata();
    }
  }, [session?.user?.id, fetchCoupleMetadata]);

  const user = session?.user ?? null;
  const me = useMemo(
    () => members.find((m) => m.user_id === user?.id) ?? null,
    [members, user?.id]
  );
  const partner = useMemo(
    () => members.find((m) => m.user_id !== user?.id) ?? null,
    [members, user?.id]
  );
  const isAuthorizedMember = Boolean(user && me);

  const getMemberName = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) return 'Kita berdua';
      const found = membersRef.current.find((m) => m.user_id === userId);
      if (found) return found.display_name;
      return userId === user?.id ? 'Aku' : 'Pasangan';
    },
    [user?.id]
  );

  const getMemberAvatar = useCallback((userId: string | null | undefined) => {
    if (!userId) return null;
    return membersRef.current.find((m) => m.user_id === userId)?.avatar_url ?? null;
  }, []);

  const triggerLocalHugEffect = useCallback(
    (kind: 'peluk' | 'cium', senderName: string, message?: string) => {
      setActiveHug({
        id: `${Date.now()}`,
        kind,
        senderName,
        message,
      });
    },
    []
  );

  const clearActiveHug = useCallback(() => setActiveHug(null), []);

  const clearBadge = useCallback((key: keyof UnreadBadges) => {
    setUnreadBadges((prev) => (prev[key] === 0 ? prev : { ...prev, [key]: 0 }));
  }, []);

  const registerEditingId = useCallback((id: string | null) => {
    editingIdRef.current = id;
  }, []);

  const userId = user?.id ?? null;

  // Realtime Postgres Changes + Presence
  const connectRealtime = useCallback(() => {
    if (!supabase || !userId || !isAuthorizedMember) return;

    // Bersihkan channel lama bila reconnect
    if (dbChannelRef.current) {
      supabase.removeChannel(dbChannelRef.current);
      dbChannelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }

    const dbChannel = supabase
      .channel('ruang-kita-db')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          const keys = TABLE_TO_QUERY_KEYS[table];
          if (keys) {
            keys.forEach((qk) => queryClient.invalidateQueries({ queryKey: qk }));
          }

          if (table === 'settings' || table === 'couple_members') {
            fetchCoupleMetadata();
          }

          const newRecord = (payload.new || {}) as Record<string, unknown>;
          const oldRecord = (payload.old || {}) as Record<string, unknown>;
          const actorId = (newRecord.created_by as string | undefined) ?? (oldRecord.created_by as string | undefined);
          const recordId = (newRecord.id as string | undefined) ?? (oldRecord.id as string | undefined);

          // Deteksi konflik last-write-wins saat sedang mengedit item yang sama
          if (
            payload.eventType === 'UPDATE' &&
            editingIdRef.current &&
            recordId === editingIdRef.current &&
            actorId !== userId
          ) {
            showToast(
              `Item yang sedang kamu buka baru diperbarui oleh ${getMemberName(actorId)}.`,
              'info'
            );
          }

          // Efek peluk/cium realtime dari pasangan
          if (table === 'hugs' && payload.eventType === 'INSERT' && actorId && actorId !== userId) {
            const kind = newRecord.kind === 'cium' ? 'cium' : 'peluk';
            const sender = getMemberName(actorId);
            triggerLocalHugEffect(kind, sender, (newRecord.message as string) || undefined);
            showToast(`${sender} mengirimkan ${kind} hangat untukmu!`, 'love');
            return;
          }

          // Notifikasi toast + badge untuk perubahan dari pasangan
          if (payload.eventType === 'INSERT' && actorId && actorId !== userId) {
            const meta = TABLE_NOTIF_LABEL[table];
            if (meta) {
              const sender = getMemberName(actorId);
              showToast(`${sender} ${meta.label}`, 'info');
              if (meta.badge) {
                const badgeKey = meta.badge;
                setUnreadBadges((prev) => ({ ...prev, [badgeKey]: prev[badgeKey] + 1 }));
              }
            }
          }
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel('ruang-kita-presence', {
      config: { presence: { key: userId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{
          user_id: string;
          display_name: string;
          typing_in: TypingLocation;
        }>();
        let pOnline = false;
        let pTyping: TypingLocation = null;

        Object.entries(state).forEach(([key, entries]) => {
          if (key !== userId && entries.length > 0) {
            pOnline = true;
            const latest = entries[entries.length - 1];
            if (latest.typing_in) {
              pTyping = latest.typing_in;
            }
          }
        });
        setPartnerOnline(pOnline);
        setPartnerTypingIn(pTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            display_name: me?.display_name || 'Aku',
            typing_in: currentTypingRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    dbChannelRef.current = dbChannel;
    presenceChannelRef.current = presenceChannel;
  }, [
    fetchCoupleMetadata,
    getMemberName,
    isAuthorizedMember,
    me?.display_name,
    queryClient,
    showToast,
    triggerLocalHugEffect,
    userId,
  ]);

  useEffect(() => {
    connectRealtime();
    return () => {
      if (supabase && dbChannelRef.current) {
        supabase.removeChannel(dbChannelRef.current);
      }
      if (supabase && presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [connectRealtime]);

  // Auto-sync saat online kembali atau tab aktif kembali
  const wasOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (isOnline && !wasOnlineRef.current && isAuthorizedMember) {
      runQueueFlush();
      queryClient.invalidateQueries();
      connectRealtime();
    }
    wasOnlineRef.current = isOnline;
  }, [isOnline, isAuthorizedMember, runQueueFlush, queryClient, connectRealtime]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isAuthorizedMember) {
        runQueueFlush();
        queryClient.invalidateQueries();
        connectRealtime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isAuthorizedMember, runQueueFlush, queryClient, connectRealtime]);

  const setTyping = useCallback(
    (location: TypingLocation) => {
      if (currentTypingRef.current === location) return;
      currentTypingRef.current = location;
      if (presenceChannelRef.current && user) {
        presenceChannelRef.current.track({
          user_id: user.id,
          display_name: me?.display_name || 'Aku',
          typing_in: location,
          online_at: new Date().toISOString(),
        });
      }
    },
    [me?.display_name, user]
  );

  // Global background music player
  useEffect(() => {
    const url = settings?.background_music_url;
    if (!url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsMusicPlaying(false);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    } else if (audioRef.current.src !== url) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = url;
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsMusicPlaying(false));
      }
    }
  }, [settings?.background_music_url]);

  const toggleMusic = useCallback(() => {
    const url = settings?.background_music_url;
    if (!url) {
      showToast('Tambahkan URL audio MP3 di Pengaturan untuk memutar musik latar.', 'info');
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => {
          showToast('Gagal memutar audio. Pastikan link merupakan file MP3/audio langsung.', 'error');
          setIsMusicPlaying(false);
        });
    }
  }, [isMusicPlaying, settings?.background_music_url, showToast]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await fetchCoupleMetadata();
    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsMusicPlaying(false);
    await supabase.auth.signOut();
  };

  const syncStatus: 'synced' | 'waiting' | 'syncing' = isSyncingQueue
    ? 'syncing'
    : !isOnline || pendingCount > 0
      ? 'waiting'
      : 'synced';

  const contextValue = useMemo<CoupleContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      session,
      user,
      members,
      me,
      partner,
      isAuthorizedMember,
      isLoadingAuth,
      memberCheckError,
      settings,
      partnerOnline,
      partnerTypingIn,
      setTyping,
      syncStatus,
      pendingCount,
      isOnline,
      activeHug,
      clearActiveHug,
      triggerLocalHugEffect,
      unreadBadges,
      clearBadge,
      registerEditingId,
      signIn,
      signOut,
      refreshCoupleData: fetchCoupleMetadata,
      getMemberName,
      getMemberAvatar,
      isMusicPlaying,
      toggleMusic,
    }),
    [
      session,
      user,
      members,
      me,
      partner,
      isAuthorizedMember,
      isLoadingAuth,
      memberCheckError,
      settings,
      partnerOnline,
      partnerTypingIn,
      setTyping,
      syncStatus,
      pendingCount,
      isOnline,
      activeHug,
      clearActiveHug,
      triggerLocalHugEffect,
      unreadBadges,
      clearBadge,
      registerEditingId,
      fetchCoupleMetadata,
      getMemberName,
      getMemberAvatar,
      isMusicPlaying,
      toggleMusic,
    ]
  );

  return (
    <CoupleContext.Provider value={contextValue}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCouple harus digunakan di dalam CoupleProvider');
  return ctx;
}
