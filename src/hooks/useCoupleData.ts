import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { mutateWithOfflineFallback } from '../lib/offlineQueue';
import { uploadCompressedImage } from '../lib/imageCompression';
import { useCouple } from '../context/CoupleContext';
import { useToast } from '../context/ToastContext';
import type {
  ActivityFeedItem,
  Album,
  CalendarEvent,
  ChatMessage,
  CountdownItem,
  CoupleSettings,
  HugEvent,
  JournalEntry,
  LoveLetter,
  MoodItem,
  Photo,
  PhotoReaction,
  QuizAnswer,
  QuizQuestion,
  Reason,
  SharedNote,
  SongItem,
  TimeCapsuleSafe,
  TimelineItem,
  WishlistCategory,
  WishlistItem,
} from '../types/database';

function assertClient() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  return supabase;
}

// ============================================================================
// MOODS & HUGS (BERANDA)
// ============================================================================
export function useMoods() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['moods'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client.from('moods').select('*');
      if (error) throw error;
      return (data ?? []) as MoodItem[];
    },
  });
}

export function useUpsertMood() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (input: { emoji: string; note: string }) => {
      if (!user) throw new Error('Belum login');
      return mutateWithOfflineFallback({
        table: 'moods',
        operation: 'upsert',
        payload: {
          created_by: user.id,
          emoji: input.emoji,
          note: input.note,
          updated_at: new Date().toISOString(),
        },
        upsertOptions: { onConflict: 'created_by' },
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['moods'] });
      const prev = qc.getQueryData<MoodItem[]>(['moods']) ?? [];
      const optimistic: MoodItem = {
        id: `opt-${user?.id}`,
        emoji: input.emoji,
        note: input.note,
        created_by: user?.id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<MoodItem[]>(['moods'], [
        ...prev.filter((m) => m.created_by !== user?.id),
        optimistic,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['moods'], ctx.prev);
      showToast('Gagal memperbarui mood. Perubahan dikembalikan.', 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['moods'] }),
  });
}

export function useHugs() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['hugs'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('hugs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as HugEvent[];
    },
  });
}

export function useSendHug() {
  const qc = useQueryClient();
  const { user, me, triggerLocalHugEffect } = useCouple();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (input: { kind: 'peluk' | 'cium'; message?: string }) => {
      if (!user) throw new Error('Belum login');
      return mutateWithOfflineFallback({
        table: 'hugs',
        operation: 'insert',
        payload: {
          kind: input.kind,
          message: input.message ?? '',
          created_by: user.id,
        },
      });
    },
    onSuccess: (_res, vars) => {
      triggerLocalHugEffect(vars.kind, me?.display_name || 'Aku', vars.message);
      qc.invalidateQueries({ queryKey: ['hugs'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal mengirim peluk/cium.', 'error'),
  });
}

// ============================================================================
// CHAT KECIL
// ============================================================================
export function useChatMessages() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['chat_messages'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (input: { content?: string; photoFile?: File }) => {
      if (!user) throw new Error('Belum login');
      let photoPath: string | null = null;
      if (input.photoFile) {
        photoPath = await uploadCompressedImage('chat', input.photoFile, user.id);
      }
      return mutateWithOfflineFallback({
        table: 'chat_messages',
        operation: 'insert',
        payload: {
          content: input.content?.trim() || null,
          photo_path: photoPath,
          created_by: user.id,
        },
      });
    },
    onMutate: async (input) => {
      if (input.photoFile) return;
      await qc.cancelQueries({ queryKey: ['chat_messages'] });
      const prev = qc.getQueryData<ChatMessage[]>(['chat_messages']) ?? [];
      const opt: ChatMessage = {
        id: `opt-${Date.now()}`,
        content: input.content?.trim() || null,
        photo_path: null,
        read_at: null,
        created_by: user?.id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _optimistic: true,
      };
      qc.setQueryData<ChatMessage[]>(['chat_messages'], [...prev, opt]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['chat_messages'], ctx.prev);
      showToast('Pesan gagal dikirim.', 'error');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['chat_messages'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  const { user } = useCouple();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user || messageIds.length === 0) return;
      const client = assertClient();
      const { error } = await client
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat_messages'] }),
  });
}

// ============================================================================
// GALERI FOTO & ALBUM
// ============================================================================
export function useAlbums() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['albums'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('albums')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Album[];
    },
  });
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      return mutateWithOfflineFallback({
        table: 'albums',
        operation: 'insert',
        payload: {
          title: input.title,
          description: input.description ?? '',
          created_by: user?.id,
        },
      });
    },
    onError: () => showToast('Gagal membuat album.', 'error'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['albums'] }),
  });
}

export function usePhotos() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['photos'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('photos')
        .select('*')
        .order('taken_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
  });
}

export function useUploadPhotos() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      files: File[];
      albumId: string | null;
      caption: string;
      takenAt: string;
    }) => {
      if (!user) throw new Error('Belum login');
      const client = assertClient();
      const inserted = [];
      for (const file of input.files) {
        const storagePath = await uploadCompressedImage('photos', file, user.id);
        const { data, error } = await client
          .from('photos')
          .insert({
            album_id: input.albumId || null,
            storage_path: storagePath,
            caption: input.caption,
            taken_at: input.takenAt,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        inserted.push(data);
      }
      return inserted;
    },
    onSuccess: (rows) => {
      showToast(`${rows.length} foto berhasil diunggah!`, 'success');
      qc.invalidateQueries({ queryKey: ['photos'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal mengunggah foto. Periksa koneksi Anda.', 'error'),
  });
}

export function useTogglePhotoFavorite() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (photo: Photo) => {
      if (!user) throw new Error('Belum login');
      const exists = photo.favorite_by.includes(user.id);
      const nextFavs = exists
        ? photo.favorite_by.filter((id) => id !== user.id)
        : [...photo.favorite_by, user.id];

      return mutateWithOfflineFallback({
        table: 'photos',
        operation: 'update',
        payload: { favorite_by: nextFavs },
        match: { id: photo.id },
      });
    },
    onMutate: async (photo) => {
      await qc.cancelQueries({ queryKey: ['photos'] });
      const prev = qc.getQueryData<Photo[]>(['photos']) ?? [];
      if (user) {
        const exists = photo.favorite_by.includes(user.id);
        const nextFavs = exists
          ? photo.favorite_by.filter((id) => id !== user.id)
          : [...photo.favorite_by, user.id];
        qc.setQueryData<Photo[]>(
          ['photos'],
          prev.map((p) => (p.id === photo.id ? { ...p, favorite_by: nextFavs } : p))
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['photos'], ctx.prev);
      showToast('Gagal menyimpan favorit.', 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (photo: Photo) => {
      const client = assertClient();
      await client.storage.from('photos').remove([photo.storage_path]);
      return mutateWithOfflineFallback({
        table: 'photos',
        operation: 'delete',
        match: { id: photo.id },
      });
    },
    onSuccess: () => {
      showToast('Foto dihapus.', 'info');
      qc.invalidateQueries({ queryKey: ['photos'] });
    },
    onError: () => showToast('Gagal menghapus foto.', 'error'),
  });
}

export function usePhotoReactions() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['photo_reactions'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client.from('photo_reactions').select('*');
      if (error) throw error;
      return (data ?? []) as PhotoReaction[];
    },
  });
}

export function useSetPhotoReaction() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: { photoId: string; emoji: string }) => {
      if (!user) throw new Error('Belum login');
      return mutateWithOfflineFallback({
        table: 'photo_reactions',
        operation: 'upsert',
        payload: {
          photo_id: input.photoId,
          emoji: input.emoji,
          created_by: user.id,
        },
        upsertOptions: { onConflict: 'photo_id,created_by' },
      });
    },
    onError: () => showToast('Gagal memberi reaksi emoji.', 'error'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['photo_reactions'] }),
  });
}

// ============================================================================
// TIME CAPSULE (PESAN RAHASIA)
// ============================================================================
export function useTimeCapsules() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['time_capsules'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('messages_safe')
        .select('*')
        .order('unlock_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TimeCapsuleSafe[];
    },
  });
}

export function useCreateTimeCapsule() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: { title: string; content: string; unlock_at: string }) => {
      return mutateWithOfflineFallback({
        table: 'messages',
        operation: 'insert',
        payload: {
          title: input.title,
          content: input.content,
          unlock_at: input.unlock_at,
          created_by: user?.id,
        },
      });
    },
    onSuccess: () => {
      showToast('Kapsul waktu berhasil dikunci!', 'success');
      qc.invalidateQueries({ queryKey: ['time_capsules'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal menyimpan kapsul waktu.', 'error'),
  });
}

export function useDeleteTimeCapsule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'messages', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['time_capsules'] }),
  });
}

// ============================================================================
// LINIMASA KENANGAN
// ============================================================================
export function useTimeline() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['timeline'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('timeline')
        .select('*')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimelineItem[];
    },
  });
}

export function useAddTimeline() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      event_date: string;
      title: string;
      story: string;
      photoFile?: File | null;
    }) => {
      let photoPath: string | null = null;
      if (input.photoFile && user) {
        photoPath = await uploadCompressedImage('photos', input.photoFile, `timeline/${user.id}`);
      }
      return mutateWithOfflineFallback({
        table: 'timeline',
        operation: 'insert',
        payload: {
          event_date: input.event_date,
          title: input.title,
          story: input.story,
          photo_path: photoPath,
          created_by: user?.id,
        },
      });
    },
    onSuccess: () => {
      showToast('Momen linimasa ditambahkan.', 'success');
      qc.invalidateQueries({ queryKey: ['timeline'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal menambah momen.', 'error'),
  });
}

export function useDeleteTimeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'timeline', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['timeline'] }),
  });
}

// ============================================================================
// ALASAN AKU SAYANG KAMU
// ============================================================================
export function useReasons() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['reasons'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('reasons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reason[];
    },
  });
}

export function useAddReason() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (content: string) =>
      mutateWithOfflineFallback({
        table: 'reasons',
        operation: 'insert',
        payload: { content, created_by: user?.id },
      }),
    onSuccess: () => {
      showToast('Alasan manis ditambahkan!', 'love');
      qc.invalidateQueries({ queryKey: ['reasons'] });
    },
    onError: () => showToast('Gagal menyimpan alasan.', 'error'),
  });
}

export function useDeleteReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'reasons', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['reasons'] }),
  });
}

// ============================================================================
// SURAT CINTA
// ============================================================================
export function useLetters() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['letters'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('letters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LoveLetter[];
    },
  });
}

export function useAddLetter() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      mutateWithOfflineFallback({
        table: 'letters',
        operation: 'insert',
        payload: { title: input.title, body: input.body, created_by: user?.id },
      }),
    onSuccess: () => {
      showToast('Surat cinta terkirim ke amplop!', 'love');
      qc.invalidateQueries({ queryKey: ['letters'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal mengirim surat.', 'error'),
  });
}

export function useMarkLetterOpened() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({
        table: 'letters',
        operation: 'update',
        payload: { is_opened: true, opened_at: new Date().toISOString() },
        match: { id },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['letters'] }),
  });
}

export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'letters', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['letters'] }),
  });
}

// ============================================================================
// KUIS TENTANG KITA
// ============================================================================
export function useQuiz() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['quiz'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('quiz')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuizQuestion[];
    },
  });
}

export function useQuizAnswers() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['quiz_answers'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client.from('quiz_answers').select('*');
      if (error) throw error;
      return (data ?? []) as QuizAnswer[];
    },
  });
}

export function useAddQuiz() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { question: string; options: string[]; correct_index: number }) =>
      mutateWithOfflineFallback({
        table: 'quiz',
        operation: 'insert',
        payload: {
          question: input.question,
          options: input.options,
          correct_index: input.correct_index,
          created_by: user?.id,
        },
      }),
    onSuccess: () => {
      showToast('Pertanyaan kuis ditambahkan!', 'success');
      qc.invalidateQueries({ queryKey: ['quiz'] });
    },
    onError: () => showToast('Gagal membuat pertanyaan kuis.', 'error'),
  });
}

export function useSubmitQuizAnswer() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { quiz_id: string; selected_index: number; is_correct: boolean }) =>
      mutateWithOfflineFallback({
        table: 'quiz_answers',
        operation: 'upsert',
        payload: {
          quiz_id: input.quiz_id,
          selected_index: input.selected_index,
          is_correct: input.is_correct,
          created_by: user?.id,
        },
        upsertOptions: { onConflict: 'quiz_id,created_by' },
      }),
    onSuccess: (_res, vars) => {
      showToast(
        vars.is_correct ? 'Benar sekali! +1 poin' : 'Ups, kurang tepat, tapi tetap seru!',
        vars.is_correct ? 'love' : 'info'
      );
      qc.invalidateQueries({ queryKey: ['quiz_answers'] });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'quiz', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

// ============================================================================
// WISHLIST & RENCANA
// ============================================================================
export function useWishlist() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['wishlist'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('wishlist')
        .select('*')
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as WishlistItem[];
    },
  });
}

export function useAddWishlist() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: {
      title: string;
      category: WishlistCategory;
      target_date?: string;
      notes?: string;
    }) =>
      mutateWithOfflineFallback({
        table: 'wishlist',
        operation: 'insert',
        payload: {
          title: input.title,
          category: input.category,
          target_date: input.target_date || null,
          notes: input.notes || '',
          created_by: user?.id,
        },
      }),
    onSuccess: () => {
      showToast('Rencana wishlist ditambahkan!', 'success');
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: () => showToast('Gagal menambah wishlist.', 'error'),
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (item: WishlistItem) =>
      mutateWithOfflineFallback({
        table: 'wishlist',
        operation: 'update',
        payload: {
          is_done: !item.is_done,
          done_at: !item.is_done ? new Date().toISOString() : null,
        },
        match: { id: item.id },
      }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ['wishlist'] });
      const prev = qc.getQueryData<WishlistItem[]>(['wishlist']) ?? [];
      qc.setQueryData<WishlistItem[]>(
        ['wishlist'],
        prev.map((w) => (w.id === item.id ? { ...w, is_done: !w.is_done } : w))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wishlist'], ctx.prev);
      showToast('Gagal mengubah status wishlist.', 'error');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useDeleteWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'wishlist', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

// ============================================================================
// PLAYLIST KITA
// ============================================================================
export function useSongs() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['songs'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SongItem[];
    },
  });
}

export function useAddSong() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { title: string; artist: string; url: string; reason: string }) =>
      mutateWithOfflineFallback({
        table: 'songs',
        operation: 'insert',
        payload: { ...input, created_by: user?.id },
      }),
    onSuccess: () => {
      showToast('Lagu ditambahkan ke Playlist Kita!', 'success');
      qc.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: () => showToast('Gagal menambahkan lagu.', 'error'),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'songs', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['songs'] }),
  });
}

// ============================================================================
// HITUNG MUNDUR
// ============================================================================
export function useCountdowns() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['countdowns'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('countdowns')
        .select('*')
        .order('target_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CountdownItem[];
    },
  });
}

export function useAddCountdown() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: { title: string; target_at: string; emoji: string }) =>
      mutateWithOfflineFallback({
        table: 'countdowns',
        operation: 'insert',
        payload: { ...input, created_by: user?.id },
      }),
    onSuccess: () => {
      showToast('Hitung mundur ditambahkan!', 'success');
      qc.invalidateQueries({ queryKey: ['countdowns'] });
    },
    onError: () => showToast('Gagal membuat hitung mundur.', 'error'),
  });
}

export function useDeleteCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'countdowns', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['countdowns'] }),
  });
}

// ============================================================================
// CATATAN BERSAMA
// ============================================================================
export function useNotes() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['notes'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SharedNote[];
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  const { user } = useCouple();
  return useMutation({
    mutationFn: (input: { title: string; content: string }) =>
      mutateWithOfflineFallback({
        table: 'notes',
        operation: 'insert',
        payload: { ...input, created_by: user?.id },
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; title: string; content: string }) =>
      mutateWithOfflineFallback({
        table: 'notes',
        operation: 'update',
        payload: { title: input.title, content: input.content, updated_at: new Date().toISOString() },
        match: { id: input.id },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'notes', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

// ============================================================================
// KALENDER KITA
// ============================================================================
export function useEvents() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['events'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
  });
}

export function useAddEvent() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: {
      title: string;
      event_date: string;
      category: string;
      reminder_note: string;
    }) =>
      mutateWithOfflineFallback({
        table: 'events',
        operation: 'insert',
        payload: { ...input, created_by: user?.id },
      }),
    onSuccess: () => {
      showToast('Acara kalender tersimpan!', 'success');
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => showToast('Gagal menyimpan acara.', 'error'),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'events', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// ============================================================================
// JURNAL HARIAN
// ============================================================================
export function useJournal() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['journal'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const { data, error } = await client
        .from('journal')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
}

export function useAddJournal() {
  const qc = useQueryClient();
  const { user } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (input: {
      entry_date: string;
      title: string;
      content: string;
      mood_emoji: string;
      is_private: boolean;
    }) =>
      mutateWithOfflineFallback({
        table: 'journal',
        operation: 'insert',
        payload: { ...input, created_by: user?.id },
      }),
    onSuccess: (_res, vars) => {
      showToast(
        vars.is_private
          ? 'Jurnal pribadi tersimpan (hanya kamu yang bisa membaca).'
          : 'Jurnal dibagikan ke Ruang Kita.',
        'success'
      );
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: () => showToast('Gagal menyimpan jurnal.', 'error'),
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateWithOfflineFallback({ table: 'journal', operation: 'delete', match: { id } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}

// ============================================================================
// PENGATURAN & PROFIL
// ============================================================================
export function useUpdateSettings() {
  const qc = useQueryClient();
  const { settings, refreshCoupleData } = useCouple();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: async (patch: Partial<CoupleSettings>) => {
      if (!settings) throw new Error('Settings belum siap');
      return mutateWithOfflineFallback({
        table: 'settings',
        operation: 'update',
        payload: patch as Record<string, unknown>,
        match: { id: settings.id },
      });
    },
    onSuccess: async () => {
      await refreshCoupleData();
      qc.invalidateQueries({ queryKey: ['settings'] });
      showToast('Pengaturan bersama diperbarui.', 'success');
    },
    onError: () => showToast('Gagal menyimpan pengaturan.', 'error'),
  });
}

// ============================================================================
// FEED AKTIVITAS TERBARU (BERANDA)
// ============================================================================
export function useRecentActivities() {
  const { isAuthorizedMember } = useCouple();
  return useQuery({
    queryKey: ['activities'],
    enabled: isAuthorizedMember,
    queryFn: async () => {
      const client = assertClient();
      const [photos, chat, hugs, timeline, wishlist, letters, notes, capsules] =
        await Promise.all([
          client.from('photos').select('id, caption, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('chat_messages').select('id, content, photo_path, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('hugs').select('id, kind, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('timeline').select('id, title, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('wishlist').select('id, title, is_done, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('letters').select('id, title, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('notes').select('id, title, created_by, created_at').order('created_at', { ascending: false }).limit(5),
          client.from('messages_safe').select('id, title, created_by, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

      const items: ActivityFeedItem[] = [];

      (photos.data ?? []).forEach((r) =>
        items.push({
          id: `photo-${r.id}`,
          type: 'photo',
          label: r.caption ? `menambahkan foto "${r.caption}"` : 'mengunggah foto baru ke galeri',
          route: '/galeri',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (chat.data ?? []).forEach((r) =>
        items.push({
          id: `chat-${r.id}`,
          type: 'chat',
          label: r.photo_path ? 'mengirim foto di chat' : `mengirim pesan: "${(r.content ?? '').slice(0, 42)}"`,
          route: '/chat',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (hugs.data ?? []).forEach((r) =>
        items.push({
          id: `hug-${r.id}`,
          type: 'hug',
          label: `mengirimkan ${r.kind === 'cium' ? 'cium lembut' : 'pelukan hangat'}`,
          route: '/',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (timeline.data ?? []).forEach((r) =>
        items.push({
          id: `tl-${r.id}`,
          type: 'timeline',
          label: `menambahkan momen "${r.title}"`,
          route: '/linimasa',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (wishlist.data ?? []).forEach((r) =>
        items.push({
          id: `wl-${r.id}`,
          type: 'wishlist',
          label: r.is_done ? `menyelesaikan wishlist "${r.title}"` : `menambahkan wishlist "${r.title}"`,
          route: '/wishlist',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (letters.data ?? []).forEach((r) =>
        items.push({
          id: `lt-${r.id}`,
          type: 'letter',
          label: `menulis surat cinta "${r.title}"`,
          route: '/surat',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (notes.data ?? []).forEach((r) =>
        items.push({
          id: `nt-${r.id}`,
          type: 'note',
          label: `menyimpan catatan "${r.title}"`,
          route: '/catatan',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );
      (capsules.data ?? []).forEach((r) =>
        items.push({
          id: `cp-${r.id}`,
          type: 'capsule',
          label: `mengunci kapsul waktu "${r.title}"`,
          route: '/kapsul',
          created_by: r.created_by,
          created_at: r.created_at,
        })
      );

      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);
    },
  });
}
