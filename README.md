# Script ML Hub

Web katalog download script ML: thumbnail skin, judul script, nama replace, dan link download. Dibangun dengan React (Vite) + Supabase, siap deploy ke Vercel.

## Fitur

- Satu kartu per script (mis. "Fanny Legend"). Saat diklik muncul daftar replace (Elite, dll), masing-nya dengan gambar skin dan tombol download
- Pencarian berdasarkan judul atau replace
- Link YouTube preview per script (video tampil di dalam jendela script)
- Admin tersembunyi: tambah, edit, hapus script, upload thumbnail

## 1. Setup Supabase

1. Buat project di https://supabase.com
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**. Setelah itu jalankan juga `supabase/02-replace-variants.sql` (membuat tabel replace, satu script bisa punya banyak replace) dan `supabase/03-youtube-preview.sql` (kolom link YouTube)
3. Buka **Authentication > Users > Add user**, buat akun admin (email + password). Centang auto-confirm
4. Kembali ke SQL Editor, daftarkan akun itu sebagai admin (ganti emailnya):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-admin-kamu@gmail.com';
   ```

5. **Penting:** buka **Authentication > Sign In / Providers** dan matikan **Allow new users to sign up**, supaya tidak ada orang lain yang bisa mendaftar
6. Ambil kunci di **Project Settings > API**: `Project URL` dan `anon public key`

## 2. Jalankan lokal

```bash
npm install
cp .env.example .env     # lalu isi URL dan anon key
npm run dev
```

## 3. Deploy ke Vercel

1. Upload folder ini ke repo GitHub
2. Di https://vercel.com pilih **Add New > Project**, import repo tersebut (preset Vite terdeteksi otomatis)
3. Di **Environment Variables** isi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**

## Cara masuk admin (tombol rahasia)

Ketuk atau klik **logo "Script ML Hub" 5 kali dengan cepat** (dalam 2 detik). Form login admin akan muncul. Setelah login, panel admin tampil di atas daftar script. Sesi login tidak disimpan: setiap halaman dibuka ulang, atau setelah menekan **Tutup** / **Keluar**, admin wajib memasukkan email dan password lagi.

Keamanan sebenarnya ada di Supabase, bukan di tombol tersembunyi. Orang yang menemukan form login tetap tidak bisa menambah atau mengubah data tanpa akun yang terdaftar di tabel `admins`, karena Row Level Security menolak semua penulisan dari akun lain. Anon key aman dipublikasikan di frontend, jangan pernah memakai `service_role` key di sini.

## Struktur

```
src/
  App.jsx                  halaman utama + tombol rahasia
  components/
    ScriptCard.jsx         kartu script
    ScriptModal.jsx        daftar replace + tombol download
    AdminLogin.jsx         form login admin
    AdminPanel.jsx         tambah / edit / hapus script
    VariantManager.jsx     tambah / edit / hapus replace per script
  lib/supabase.js          klien Supabase
  lib/helpers.js           upload gambar, normalisasi link
supabase/schema.sql        tabel, RLS, storage
supabase/02-replace-variants.sql   tabel replace (varian)
supabase/03-youtube-preview.sql    kolom youtube_url
```
