# Berkontribusi ke Qeerja

Terima kasih sudah mempertimbangkan untuk berkontribusi ke Qeerja.

## Konvensi Cabang (_Branch_)

- `develop` — cabang bawaan, integrasi untuk pekerjaan aktif
- `feature/*` — fitur baru (contoh: `feature/dark-mode`)
- `fix/*` — perbaikan bug (contoh: `fix/board-drop-zone`)
- `release/*` — persiapan rilis

Semua cabang harus dibuat dari `develop` dan digabungkan kembali melalui _pull request_.

## Konvensi Komit

Proyek ini menggunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <deskripsi>

[body opsional]
```

Tipe: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `perf`, `ci`.

Contoh:

```
feat(board): add swimlane grouping by assignee
fix(auth): handle expired 2FA session gracefully
refactor(tasks): extract comment logic into hook
test(sprint): add burndown chart calculation tests
```

## Proses _Pull Request_

1. Buat cabang dari `develop` dengan mengikuti konvensi penamaan.
2. Lakukan perubahan dan komit dengan mengikuti konvensi komit.
3. Pastikan semua pemeriksaan lolos secara lokal:
   ```bash
   composer run ci:check
   ```
4. Dorong (_push_) cabang Anda dan buka PR ke `develop`.
5. Pastikan CI (_lint_ + tes) lolos di GitHub.
6. Minta peninjauan dari pengelola.

## Standar Pengodean

- **PHP**: Ikuti konvensi Laravel. Jalankan Pint sebelum komit: `vendor/bin/pint --dirty`.
- **JavaScript/TypeScript**: Jalankan `npm run lint` dan `npm run format` sebelum komit.
- **TypeScript**: Jalankan `npm run types:check` — mode ketat diaktifkan.
- **Tes**: Tulis tes untuk fungsionalitas baru menggunakan sintaks Pest.
- **WhatsApp Gateway**: Kode berada di `whatsapp-gateway/`. Jalankan `npm run format` dan `npm run lint:check` di direktori tersebut sebelum komit.

## Internasionalisasi

- Semua string yang terlihat pengguna harus menggunakan `t()` dari `react-i18next`.
- Tambahkan kunci EN ke `resources/js/i18n/locales/en/translation.json`.
- Tambahkan kunci ID ke `resources/js/i18n/locales/id/translation.json`.

## Pertanyaan?

Buka [Diskusi](https://github.com/aryadwiputra/qeerja/discussions) di GitHub.
