-- ============================================================================
-- RUANG KITA — SKEMA DATABASE SUPABASE & ROW LEVEL SECURITY (RLS)
-- Jalankan seluruh skrip ini di Supabase SQL Editor (Dashboard -> SQL Editor).
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. TABEL ANGGOTA PASANGAN (MAKSIMAL 2 ORANG)
create table if not exists public.couple_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.enforce_max_two_members()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.couple_members) >= 2 then
    raise exception 'Ruang Kita hanya dapat diisi maksimal 2 anggota pasangan.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_max_two_members on public.couple_members;
create trigger trg_max_two_members
  before insert on public.couple_members
  for each row execute function public.enforce_max_two_members();

-- 2. FUNGSI HELPER KEAMANAN & AUTO-UPDATE TIMESTAMP
create or replace function public.is_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.couple_members where user_id = auth.uid()
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. PENGATURAN BERSAMA (1 BARIS SINGLETON)
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  is_singleton boolean not null default true unique check (is_singleton = true),
  couple_title text not null default 'Ruang Kita',
  anniversary_date date not null default '2024-02-14',
  background_music_url text default '',
  background_music_title text default 'Lagu Kita',
  proposal_question text not null default 'Mau jadi rumahku selamanya?',
  proposal_subtext text not null default 'Dari hari pertama hingga seluruh hari yang masih menanti kita.',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. ALBUM & GALERI FOTO
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  cover_path text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete set null,
  storage_path text not null,
  caption text default '',
  taken_at date not null default current_date,
  favorite_by uuid[] not null default '{}',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  emoji text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(photo_id, created_by)
);

-- 5. PESAN RAHASIA / TIME CAPSULE
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  unlock_at timestamptz not null,
  opened_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- View aman di server: menyembunyikan isi pesan sampai unlock_at terlewati
-- (kecuali bagi penulis pesan itu sendiri).
create or replace view public.messages_safe as
select
  m.id,
  m.title,
  case
    when m.created_by = auth.uid() or m.unlock_at <= now() then m.content
    else null
  end as content,
  (m.created_by = auth.uid() or m.unlock_at <= now()) as is_readable,
  (m.unlock_at <= now()) as is_unlocked,
  m.unlock_at,
  m.opened_at,
  m.created_by,
  m.created_at,
  m.updated_at
from public.messages m
where public.is_member();

grant select on public.messages_safe to authenticated;

-- 6. ALASAN AKU SAYANG KAMU
create table if not exists public.reasons (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. LINIMASA KENANGAN
create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  event_date date not null default current_date,
  title text not null,
  story text default '',
  photo_path text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. SURAT CINTA
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_opened boolean not null default false,
  opened_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. KUIS TENTANG KITA
create table if not exists public.quiz (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index int not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz(id) on delete cascade,
  selected_index int not null,
  is_correct boolean not null,
  created_by uuid default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quiz_id, created_by)
);

-- 10. WISHLIST & RENCANA
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'lainnya',
  target_date date,
  notes text default '',
  is_done boolean not null default false,
  done_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. PLAYLIST KITA
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default '',
  url text not null,
  reason text default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. HITUNG MUNDUR
create table if not exists public.countdowns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_at timestamptz not null,
  emoji text not null default '✨',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. CATATAN BERSAMA
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. KALENDER KITA
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date timestamptz not null,
  category text not null default 'kencan',
  reminder_note text default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. JURNAL HARIAN (DUKUNGAN PRIVAT PER PENULIS)
create table if not exists public.journal (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  title text not null,
  content text not null,
  mood_emoji text default '🌙',
  is_private boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. CHAT KECIL
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  content text,
  photo_path text,
  read_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. MOOD HARI INI (1 BARIS PER ANGGOTA)
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '🌸',
  note text default '',
  created_by uuid unique default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. KIRIM PELUK & CIUM REALTIME
create table if not exists public.hugs (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'peluk',
  message text default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 19. OPSIONAL: LANGGANAN WEB PUSH (UNTUK EDGE FUNCTION)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- TRIGGER AUTO-UPDATE `updated_at` DI SEMUA TABEL
-- ============================================================================
do $$
declare
  t text;
  tables text[] := array[
    'couple_members','settings','albums','photos','photo_reactions',
    'messages','reasons','timeline','letters','quiz','quiz_answers',
    'wishlist','songs','countdowns','notes','events','journal',
    'chat_messages','moods','hugs','push_subscriptions'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_updated_at_%I on public.%I;', t, t);
    execute format('create trigger trg_updated_at_%I before update on public.%I for each row execute function public.handle_updated_at();', t, t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
do $$
declare
  t text;
  tables text[] := array[
    'couple_members','settings','albums','photos','photo_reactions',
    'messages','reasons','timeline','letters','quiz','quiz_answers',
    'wishlist','songs','countdowns','notes','events','journal',
    'chat_messages','moods','hugs','push_subscriptions'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Kebijakan standar: hanya anggota pasangan (is_member() = true) yang dapat membaca/menulis
do $$
declare
  t text;
  std_tables text[] := array[
    'settings','albums','photos','photo_reactions',
    'reasons','timeline','letters','quiz','quiz_answers',
    'wishlist','songs','countdowns','notes','events',
    'chat_messages','moods','hugs'
  ];
begin
  foreach t in array std_tables loop
    execute format('drop policy if exists "member_select_%I" on public.%I;', t, t);
    execute format('drop policy if exists "member_insert_%I" on public.%I;', t, t);
    execute format('drop policy if exists "member_update_%I" on public.%I;', t, t);
    execute format('drop policy if exists "member_delete_%I" on public.%I;', t, t);

    execute format('create policy "member_select_%I" on public.%I for select using (public.is_member());', t, t);
    execute format('create policy "member_insert_%I" on public.%I for insert with check (public.is_member());', t, t);
    execute format('create policy "member_update_%I" on public.%I for update using (public.is_member()) with check (public.is_member());', t, t);
    execute format('create policy "member_delete_%I" on public.%I for delete using (public.is_member());', t, t);
  end loop;
end $$;

-- Kebijakan couple_members: anggota boleh baca profil sendiri & pasangan, dan edit profil sendiri
drop policy if exists "member_select_couple" on public.couple_members;
drop policy if exists "member_update_self" on public.couple_members;
create policy "member_select_couple" on public.couple_members
  for select using (user_id = auth.uid() or public.is_member());
create policy "member_update_self" on public.couple_members
  for update using (public.is_member() and user_id = auth.uid())
  with check (public.is_member() and user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant select on public.messages_safe to authenticated;
grant execute on function public.is_member() to authenticated;

-- Kebijakan khusus JOURNAL: baris dengan is_private = true hanya boleh dibaca/edit/hapus penulisnya
drop policy if exists "journal_select" on public.journal;
drop policy if exists "journal_insert" on public.journal;
drop policy if exists "journal_update" on public.journal;
drop policy if exists "journal_delete" on public.journal;

create policy "journal_select" on public.journal
  for select using (
    public.is_member() and (is_private = false or created_by = auth.uid())
  );
create policy "journal_insert" on public.journal
  for insert with check (public.is_member() and created_by = auth.uid());
create policy "journal_update" on public.journal
  for update using (
    public.is_member() and (is_private = false or created_by = auth.uid())
  ) with check (
    public.is_member() and (is_private = false or created_by = auth.uid())
  );
create policy "journal_delete" on public.journal
  for delete using (
    public.is_member() and (is_private = false or created_by = auth.uid())
  );

-- Kebijakan khusus MESSAGES (Time Capsule):
-- Langsung di tabel `messages`, penerima tidak bisa membaca baris sebelum unlock_at lewat.
-- Untuk menampilkan kartu terkunci & countdown tanpa isi, klien membaca view `messages_safe`.
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "messages_update" on public.messages;
drop policy if exists "messages_delete" on public.messages;

create policy "messages_select" on public.messages
  for select using (
    public.is_member() and (created_by = auth.uid() or unlock_at <= now())
  );
create policy "messages_insert" on public.messages
  for insert with check (public.is_member() and created_by = auth.uid());
create policy "messages_update" on public.messages
  for update using (
    public.is_member() and (created_by = auth.uid() or unlock_at <= now())
  ) with check (public.is_member());
create policy "messages_delete" on public.messages
  for delete using (public.is_member() and created_by = auth.uid());

-- Kebijakan push_subscriptions
drop policy if exists "push_select" on public.push_subscriptions;
drop policy if exists "push_insert" on public.push_subscriptions;
drop policy if exists "push_delete" on public.push_subscriptions;
create policy "push_select" on public.push_subscriptions for select using (public.is_member());
create policy "push_insert" on public.push_subscriptions for insert with check (public.is_member() and created_by = auth.uid());
create policy "push_delete" on public.push_subscriptions for delete using (public.is_member() and created_by = auth.uid());

-- ============================================================================
-- SUPABASE REALTIME PUBLICATION + REPLICA IDENTITY FULL
-- ============================================================================
do $$
declare
  t text;
  rt_tables text[] := array[
    'couple_members','settings','albums','photos','photo_reactions',
    'messages','reasons','timeline','letters','quiz','quiz_answers',
    'wishlist','songs','countdowns','notes','events','journal',
    'chat_messages','moods','hugs'
  ];
begin
  foreach t in array rt_tables loop
    execute format('alter table public.%I replica identity full;', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;

-- ============================================================================
-- STORAGE BUCKETS PRIVAT ("photos" & "chat") + STORAGE RLS
-- Alasan bucket privat: Foto pasangan bersifat pribadi. Klien mengakses foto
-- melalui Signed URL sementara yang hanya bisa dibuat oleh anggota yang login.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false), ('chat', 'chat', false)
on conflict (id) do update set public = false;

drop policy if exists "couple_storage_select" on storage.objects;
drop policy if exists "couple_storage_insert" on storage.objects;
drop policy if exists "couple_storage_update" on storage.objects;
drop policy if exists "couple_storage_delete" on storage.objects;

create policy "couple_storage_select" on storage.objects
  for select using (
    bucket_id in ('photos', 'chat') and public.is_member()
  );

create policy "couple_storage_insert" on storage.objects
  for insert with check (
    bucket_id in ('photos', 'chat') and public.is_member()
  );

create policy "couple_storage_update" on storage.objects
  for update using (
    bucket_id in ('photos', 'chat') and public.is_member()
  );

create policy "couple_storage_delete" on storage.objects
  for delete using (
    bucket_id in ('photos', 'chat') and public.is_member()
  );

-- ============================================================================
-- SEED DATA AWAL (AMAN DIJALANKAN BERULANG)
-- ============================================================================
insert into public.settings (
  is_singleton,
  couple_title,
  anniversary_date,
  background_music_title,
  proposal_question,
  proposal_subtext
) values (
  true,
  'Ruang Kita',
  '2024-02-14',
  'Melodi Malam Kita',
  'Mau terus berjalan bersamaku selamanya?',
  'Terima kasih sudah menjadi tempat pulang yang paling tenang.'
) on conflict (is_singleton) do nothing;

insert into public.albums (title, description)
select 'Momen Pertama', 'Kumpulan foto awal perjalanan kita bersama.'
where not exists (select 1 from public.albums);

insert into public.reasons (content)
select v.content from (values
  ('Caramu selalu mendengarkan ceritaku bahkan di hari yang paling melelahkan.'),
  ('Tawa kecilmu yang selalu berhasil mencairkan suasana canggung.'),
  ('Kesabaranmu menghadapi sisi keras kepalaku dengan lembut.')
) as v(content)
where not exists (select 1 from public.reasons);

insert into public.wishlist (title, category, notes)
select v.title, v.category, v.notes from (values
  ('Makan malam piknik sambil melihat matahari terbenam', 'makan', 'Bawa kopi hangat dan kue favorit kita'),
  ('Road trip akhir pekan ke pegunungan', 'jalan-jalan', 'Putar playlist kita sepanjang jalan'),
  ('Maraton film Ghibli sambil hujan-hujanan', 'film', 'Siapkan selimut paling nyaman')
) as v(title, category, notes)
where not exists (select 1 from public.wishlist);

insert into public.notes (title, content)
select 'Rencana Akhir Pekan Kita', E'- Beli bahan masak pasta\n- Cari kafe tenang buat baca buku bareng\n- Foto bareng dengan kamera film'
where not exists (select 1 from public.notes);

insert into public.countdowns (title, target_at, emoji)
select 'Anniversary Berikutnya', (now() + interval '90 days'), '🥂'
where not exists (select 1 from public.countdowns);

insert into public.songs (title, artist, url, reason)
select 'Bergema Sampai Selamanya', 'Nadhif Basalamah', 'https://open.spotify.com/search/Bergema%20Sampai%20Selamanya', 'Lagu yang selalu mengingatkan saat pertama kali kita pulang malam bersama.'
where not exists (select 1 from public.songs);

insert into public.events (title, event_date, category, reminder_note)
select 'Kencan Malam Minggu', (now() + interval '4 days'), 'kencan', 'Pakai baju senada warna hangat'
where not exists (select 1 from public.events);
