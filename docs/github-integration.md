# GitHub Integration

Menghubungkan project Qeerja ke GitHub untuk melacak commit dan pull request ke task.

## Arsitektur

```
GitHub (Push/PR Event)
       │
       ▼  POST /workspaces/{ws}/projects/{p}/github/webhook
       │    HMAC-SHA256 signature (X-Hub-Signature-256)
       ▼
GitHubWebhookController
       │  verifySignature()
       │
       ▼  dispatch(ProcessGitHubWebhookJob)
       │
       ▼
ProcessGitHubWebhookJob (handle)
       │
       ├── push event
       │     ├── scan commit messages → PROJ-N
       │     ├── add TaskComment + TaskActivity
       │     └── auto-close task if "closes PROJ-N"
       │
       └── pull_request event
             ├── scan PR title → PROJ-N
             ├── add TaskComment + TaskActivity
             └── auto-close task if PR is merged

OAuth Flow:
  User → Connect GitHub → Socialite redirect → GitHub Auth
       ↓
  callback → saves token ke integrations table
```

---

## Environment Variables

Tambahkan 4 baris ini ke `.env`:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:8000/workspaces/{workspace}/projects/{project}/github/callback
GITHUB_WEBHOOK_SECRET=
```

> Ganti `http://localhost:8000` dengan domain production saat deploy.

---

## Setup GitHub OAuth App

Buka **GitHub Settings > Developer settings > OAuth Apps > New OAuth App**.

| Field                      | Value                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| Application name           | `Qeerja (local)` (atau bebas)                                              |
| Homepage URL               | `http://localhost:8000`                                                    |
| Authorization callback URL | `http://localhost:8000/workspaces/{workspace}/projects/{project}/github/callback` |

Setelah create:

1. **Client ID** → salin ke `GITHUB_CLIENT_ID`
2. **Generate a new client secret** → salin ke `GITHUB_CLIENT_SECRET`

---

## Setup Webhook Secret

Buat string random untuk secret:

```bash
openssl rand -hex 32
```

Hasilnya (64 karakter hex) simpan sebagai `GITHUB_WEBHOOK_SECRET`.

---

## Menghubungkan di Aplikasi

1. Jalankan ulang dev server setelah mengisi `.env`
2. Buka halaman **Settings** project mana pun
3. Pilih tab **GitHub**
4. Klik **Connect GitHub**
5. Login via GitHub — token akan tersimpan di tabel `integrations`

Setelah connect, muncul:
- Avatar dan nama GitHub user
- **Webhook URL** — copy untuk step selanjutnya
- Tombol **Disconnect GitHub**

---

## Setup Webhook per Repository

Untuk setiap repo GitHub yang ingin diintegrasikan:

1. Buka repo GitHub → **Settings > Webhooks > Add webhook**
2. Isi:

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Payload URL  | Copy dari halaman settings Qeerja (step sebelumnya) |
| Content type | `application/json`                           |
| Secret       | `GITHUB_WEBHOOK_SECRET` yang sudah dibuat    |
| Events       | Pilih **Just the push event**                |

3. **Add webhook**

> Untuk dukungan pull request, ganti event menjadi **Let me select individual events** lalu centang **Pull requests**.

---

## Cara Pakai

### Link Commit ke Task

Commit message harus mengandung kode task (`PROJ-N`):

```
git commit -m "Implement user authentication QSY-42"
```

Commit akan otomatis:
- Muncul sebagai komentar di task
- Tercatat di task activity

### Auto-close Task via Commit

Gunakan keyword `closes`, `fixes`, atau `resolves`:

```
git commit -m "fixes QSY-42 — resolve login redirect bug"
```

### Link Pull Request ke Task

PR title harus mengandung kode task:

```
PR title: "Add user profile page QSY-55"
```

### Auto-close Task via PR Merge

Jika PR yang mengandung kode task di-merge, task akan otomatis ter-set sebagai completed.

---

## Notes

- Hanya commit ke **default branch** (biasanya `main`/`master`) yang diproses
- Webhook endpoint **tidak membutuhkan auth session** — verifikasi via HMAC signature
- CSRF exemption sudah di-set di `bootstrap/app.php` untuk webhook URL
- Bot user (`github-bot@qeerja.test`) dibuat otomatis untuk menulis komentar/aktivitas
