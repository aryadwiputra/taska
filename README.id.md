<div align="center">
    <br/>
    <h1>Qeerja</h1>
    <p><em>Kerja proyek jadi lebih rapi.</em></p>
    <p>
        <a href="#">
            <img src="https://img.shields.io/badge/PHP-8.3%20|%208.4%20|%208.5-777BB4?logo=php&logoColor=white" alt="PHP">
        </a>
        <a href="#">
            <img src="https://img.shields.io/badge/Laravel-13-F9324C?logo=laravel&logoColor=white" alt="Laravel">
        </a>
        <a href="#">
            <img src="https://img.shields.io/badge/React-19-58C4DC?logo=react&logoColor=white" alt="React">
        </a>
        <a href="#">
            <img src="https://img.shields.io/badge/Inertia-3-7B3FE4?logo=inertia&logoColor=white" alt="Inertia">
        </a>
        <a href="#">
            <img src="https://img.shields.io/badge/license-MIT-blue" alt="Lisensi">
        </a>
    </p>
    <p>
        <a href="README.md"><strong>English</strong></a> · <strong>Bahasa Indonesia</strong>
    </p>
</div>

---

**Qeerja** adalah alat manajemen proyek _open-source_ modern yang dibangun dengan Laravel, Inertia, dan React. Qeerja menyatukan papan (_board_), sprint, persetujuan, otomatisasi, dan rilis dalam satu ruang kerja yang terfokus — dengan kolaborasi _real-time_ via Laravel Reverb.

## Fitur

- **Papan Kanban** — Seret dan lepas dengan sinkronisasi _real-time_, _swimlane_, batas WIP, banyak papan.
- **Sprint** — Iterasi dengan batas waktu, grafik _burndown_, pelacakan kecepatan (_velocity_), dan manajemen _backlog_.
- **Alur Persetujuan** — Batasi perpindahan kolom dengan pengatur persetujuan dan jumlah persetujuan minimum.
- **Aturan Otomatisasi** — Mesin pemicu-kondisi-aksi untuk perubahan status, penugasan, label, dan notifikasi.
- **Kebijakan SLA** — Target waktu respons dan penyelesaian per jenis tugas.
- **Rilis** — Kelompokkan pekerjaan yang selesai ke dalam rilis dengan pelacakan kemajuan.
- **Tujuan & Hasil Kunci** — Tentukan sasaran dan lacak epik yang terhubung.
- **Tampilan Lintas Proyek** — Linimasa (Gantt) dan papan yang mencakup banyak proyek.
- **Laporan** — Grafik kecepatan, pelacakan _burndown_, distribusi beban kerja.
- **Kolaborasi _Real-time_** — Pembaruan papan langsung, indikator pengetikan, umpan aktivitas via Laravel Reverb.
- **Akses Berbasis Peran** — Sistem izin dengan peran tingkat ruang kerja dan proyek.
- **Integrasi GitHub** — Hubungkan _commit_ dan PR ke tugas.
- **Autentikasi Dua Faktor** — TOTP dan _passkey_ (WebAuthn).
- **i18n** — Dukungan bahasa Inggris dan Indonesia.
- **WhatsApp Gateway** — Siarkan notifikasi (tugas ditugaskan, disebut) via WhatsApp Web menggunakan gateway Node.js terpisah.

## Tumpukan Teknologi

| Lapisan | Teknologi |
|---|---|
| Backend | PHP 8.3+, Laravel 13 |
| Frontend | React 19, Inertia 3 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Realtime | Laravel Reverb, Laravel Echo |
| WhatsApp | whatsapp-web.js (gateway Node.js terpisah) |
| Database | SQLite (_dev_), MySQL (_production_) |
| Antrean | _Database driver_ |
| Autentikasi | Laravel Fortify (_register_, _login_, 2FA, _passkey_) |
| Pengujian | Pest 4 |
| Perkakas | Laravel Pint, ESLint, Prettier, TypeScript _strict_ |

## Persyaratan

- PHP 8.3+
- Composer 2
- Node.js 20+
- NPM 10+

## Mulai Cepat

```bash
# Clone repositori
git clone git@github.com:aryadwiputra/qeerja.git
cd qeerja

# Install dependensi PHP
composer install

# Install dependensi Node.js (frontend + gateway WhatsApp)
npm install
cd whatsapp-gateway && npm install && cd ..

# Siapkan lingkungan
cp .env.example .env
php artisan key:generate
php artisan storage:link

# Jalankan migrasi
php artisan migrate

# Build frontend
npm run build

# Mulai pengembangan
composer run dev
```

Buka `http://localhost:8000` di peramban Anda.

## WhatsApp Gateway

Qeerja menyertakan layanan Node.js terpisah untuk mengirim notifikasi WhatsApp menggunakan `whatsapp-web.js`.

### Persiapan

```bash
# Masuk ke direktori gateway (sudah diinstall di atas)
cd whatsapp-gateway

# Salin lingkungan
cp .env.example .env

# Jalankan gateway (akan menghasilkan kode QR)
npm start
```

### Penggunaan

1. Buka **Pengaturan Ruang Kerja → WhatsApp** dan klik **Hubungkan WhatsApp**.
2. Pindai kode QR dengan aplikasi WhatsApp di ponsel Anda.
3. Pengguna menambahkan nomor telepon di **Pengaturan → Profil**.
4. Pengguna mengaktifkan notifikasi WhatsApp di **Pengaturan → Notifikasi**.
5. Gateway akan mengirim notifikasi untuk event `task.assigned` dan `task.mentioned`.

> **Catatan:** Gateway berjalan di port `3001` secara bawaan. Konfigurasikan via `WHATSAPP_GATEWAY_URL` di file `.env`.

## Pengembangan

```bash
# Lingkungan dev lengkap (server + antrean + log + reverb + vite)
composer run dev

# Jalankan semua pemeriksaan (lint → format → tipe → tes)
composer run ci:check

# Jalankan tes
composer test

# Format PHP
vendor/bin/pint --dirty

# Pemeriksaan frontend
npm run lint
npm run format
npm run types:check
```

## Pengujian

Qeerja menggunakan [Pest 4](https://pestphp.com/) untuk pengujian.

```bash
# Jalankan semua tes
php artisan test

# Jalankan tes tertentu
php artisan test --compact --filter=namaTes

# Jalankan tes tanpa pemeriksaan lint (dipakai CI)
./vendor/bin/pest
```

## Keamanan

Jika Anda menemukan kerentanan keamanan, harap kirim email langsung ke pengelola. Lihat [SECURITY.id.md](SECURITY.id.md) untuk detailnya.

## Lisensi

Qeerja adalah perangkat lunak _open-source_ yang dilisensikan di bawah [lisensi MIT](LICENSE.md).

---

<p align="center">Dibangun dengan Laravel, Inertia, React, dan Tailwind.</p>
