# Ruang Kita — Aplikasi Web Romantis Berdua (Realtime)

**Ruang Kita** adalah ruang digital pribadi khusus untuk dua orang (pasangan) di mana keduanya memiliki hak yang sama untuk menambah, mengedit, dan menghapus kenangan secara realtime di semua perangkat.

---

## Arsitektur & Pilihan Keamanan

- **Realtime Sinkron**: Menggunakan Supabase `postgres_changes`, `Presence` (status online & mengetik), dan `Broadcast` (efek peluk/cium langsung di layar pasangan) yang dipadukan dengan **TanStack Query** optimistic updates dan **IndexedDB** offline queue.
- **Keamanan `VITE_SUPABASE_ANON_KEY` vs `service_role`**:
  - `VITE_SUPABASE_ANON_KEY` aman ditaruh di frontend karena seluruh tabel dilindungi oleh **Row Level Security (RLS)** dengan fungsi `is_member()`. Siapa pun di luar 2 UUID di tabel `couple_members` tidak bisa membaca maupun mengubah data apa pun.
  - **`service_role` key TIDAK BOLEH dipakai di frontend** karena dapat melewati RLS.
- **Bucket Storage Privat (`photos` & `chat`)**:
  - Bucket dibuat **privat** (`public = false`) agar foto pribadi pasangan tidak pernah bisa diakses melalui URL publik yang bisa ditebak.
  - Aplikasi mengompresi foto di browser sebelum diunggah, lalu menghasilkan **Signed URL** sementara yang hanya diberikan kepada pengguna terautentikasi di `couple_members`.
- **Perlindungan Server-Side Kapsul Waktu & Jurnal Pribadi**:
  - **Time Capsule (`messages` + `messages_safe`)**: Pengecekan tanggal buka (`unlock_at`) dilakukan langsung di database PostgreSQL melalui view `messages_safe` dan policy `messages_select` sehingga penerima tidak bisa mengintip isi pesan dari Network Tab sebelum waktunya tiba.
  - **Jurnal Pribadi (`journal`)**: Entri dengan `is_private = true` dilindungi oleh RLS agar hanya `created_by = auth.uid()` yang bisa membacanya.

---

## Panduan Setup Lengkap (Langkah demi Langkah)

### 1. Membuat Project Supabase
1. Buka [supabase.com](https://supabase.com) dan buat project baru.
2. Catat **Project URL** dan **anon public key** di menu **Project Settings → API**.

### 2. Menjalankan `supabase/schema.sql`
1. Buka **SQL Editor** di dashboard Supabase.
2. Salin seluruh isi file `supabase/schema.sql` dari repositori ini, tempel ke editor, lalu klik **Run**.
3. Pastikan tidak ada error. Skrip ini otomatis membuat semua tabel, trigger `updated_at`, RLS policy, view `messages_safe`, publikasi Realtime, bucket Storage privat `photos` dan `chat`, serta data awal contoh.

### 3. Mematikan Pendaftaran Publik & Membuat 2 Akun Pasangan
1. Buka **Authentication → Sign In / Providers → Email** (atau **Settings → User Signups**).
2. **Matikan** opsi **Allow new users to sign up** agar orang asing tidak bisa mendaftar.
3. Buka **Authentication → Users → Add user → Create new user**.
4. Buat **2 akun** (satu untuk Anda, satu untuk pasangan) dengan email dan password masing-masing (centang *Auto Confirm User*).
5. Salin **User UID** (UUID) dari kedua akun tersebut.

### 4. Mengisi Tabel `couple_members`
Jalankan SQL berikut di **SQL Editor** Supabase (ganti UUID dan nama sesuai akun kalian):

```sql
insert into public.couple_members (user_id, display_name)
values
  ('UUID-AKUN-PERTAMA', 'Nama Kamu'),
  ('UUID-AKUN-KEDUA', 'Nama Pasangan');
```
*(Tabel ini memiliki trigger pengaman maksimal 2 baris).*

### 5. Konfigurasi `.env` & Menjalankan Lokal
1. Buat file `.env` di root proyek:
   ```env
   VITE_SUPABASE_URL="https://PROJECT_ID_ANDA.supabase.co"
   VITE_SUPABASE_ANON_KEY="ANON_KEY_ANDA"
   ```
2. Install dependensi dan jalankan:
   ```bash
   npm install
   npm run dev
   ```
3. Buka `http://localhost:3000`.

### 6. Deploy ke Netlify
1. Push kode ke GitHub/GitLab, lalu hubungkan ke Netlify.
2. Pengaturan build sudah otomatis terbaca dari `netlify.toml` (`npm run build`, publish `dist`) dan `public/_redirects` (`/* /index.html 200`).
3. Di Netlify Dashboard, buka **Site configuration → Environment variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Trigger deploy.

### 7. Konfigurasi URL di Supabase Auth
1. Di Supabase Dashboard, buka **Authentication → URL Configuration**.
2. Isi **Site URL** dengan domain Netlify Anda (misal `https://ruangkita-kita.netlify.app`).
3. Tambahkan ke **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://ruangkita-kita.netlify.app/**`

### 8. Instalasi PWA ke Layar Utama (Android & iPhone)
- **Android (Chrome)**: Buka web Ruang Kita → ketuk tombol **"Pasang Aplikasi"** di dalam halaman Masuk/Pengaturan, atau ketuk menu `⋮` → **Tambahkan ke Layar Utama**.
- **iPhone (Safari)**: Buka web Ruang Kita di **Safari** → ketuk ikon **Bagikan (Share)** di bawah → gulir dan pilih **Tambahkan ke Layar Utama (Add to Home Screen)**.
- **Catatan Web Push di iPhone**: Notifikasi Web Push pada iOS (iOS 16.4+) hanya berfungsi jika aplikasi **sudah di-install ke Layar Utama** dan dibuka dari ikon tersebut (mode standalone), tidak dari tab Safari biasa.

---

## Skrip Uji Manual Sinkronisasi Realtime (2 Browser / 2 HP)

Gunakan langkah berikut untuk memverifikasi seluruh fitur realtime bekerja mulus:

1. **Persiapan Sesi Berdua**:
   - Buka Browser A (atau HP A) dan login dengan **Akun 1**.
   - Buka Browser B (Incognito / HP B) dan login dengan **Akun 2**.
2. **Uji Presence & Mood**:
   - Di Beranda Browser A, pastikan muncul indikator titik hijau `[Nama Akun 2] sedang online`.
   - Ubah **Mood Hari Ini** di Browser A → periksa dalam <1 detik Mood Akun 1 di Browser B ikut berubah tanpa refresh.
3. **Uji Peluk & Cium Realtime**:
   - Tekan tombol **"Kirim Peluk"** di Browser A → pastikan animasi hati muncul langsung di layar Browser B disertai toast notifikasi.
4. **Uji Chat Kecil & Indikator Mengetik**:
   - Buka tab **Chat** di kedua browser.
   - Mulai mengetik di Browser A → pastikan muncul teks `[Nama] sedang mengetik...` di Browser B.
   - Kirim pesan + foto dari Browser A → pesan langsung tampil di Browser B, dan status di Browser A berubah menjadi **Dibaca**.
5. **Uji Galeri & Reaksi**:
   - Unggah foto di tab **Galeri** pada Browser A → foto muncul otomatis di Browser B, lengkap dengan badge notifikasi tab.
   - Beri favorit / reaksi emoji di Browser B → langsung tersinkron ke Browser A.
6. **Uji Antrean Offline (Offline Queue)**:
   - Matikan internet / aktifkan Mode Pesawat di Browser A.
   - Tambahkan item baru di **Wishlist** atau kirim pesan di **Chat**. Indikator status berubah menjadi **"Menunggu sinyal"**, dan item tetap tampil secara optimistik.
   - Nyalakan internet kembali → sistem otomatis mengirim antrean IndexedDB ke Supabase, status kembali **"Tersinkron"**, dan Browser B langsung menerimanya.
7. **Uji Keamanan Time Capsule & Jurnal Pribadi**:
   - Di Browser A, buat **Kapsul Waktu** dengan tanggal buka besok (`unlock_at` di masa depan).
   - Di Browser B, buka halaman **Kapsul Waktu** → hanya tampil kartu terkunci dan countdown; cek Network Tab DevTools bahwa kolom `content` bernilai `null` dari server.
   - Di Browser A, buat entri **Jurnal Harian** dengan mode **Pribadi** → pastikan entri tersebut tidak muncul sama sekali di Browser B.
