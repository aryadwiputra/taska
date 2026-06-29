<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class TciTaskSeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::where('slug', 'tci')->firstOrFail();

        $users = [
            'arya' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'arya@tci.co.id'))->firstOrFail()->user,
            'fatur' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'fatur@tci.co.id'))->firstOrFail()->user,
            'galih' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'galih@tci.co.id'))->firstOrFail()->user,
            'raihan' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'raihan@tci.co.id'))->firstOrFail()->user,
            'wanda' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'wanda@tci.co.id'))->firstOrFail()->user,
            'faizal' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'faizal@tci.co.id'))->firstOrFail()->user,
            'baihaqi' => $workspace->members()->whereHas('user', fn ($q) => $q->where('email', 'baihaqi@tci.co.id'))->firstOrFail()->user,
        ];

        $taskType = $workspace->taskTypes()->where('key', 'task')->firstOrFail();
        $bugType = $workspace->taskTypes()->where('key', 'bug')->firstOrFail();
        $improvementType = $workspace->taskTypes()->where('key', 'improvement')->firstOrFail();
        $storyType = $workspace->taskTypes()->where('key', 'story')->firstOrFail();

        $high = $workspace->priorities()->where('key', 'high')->firstOrFail();
        $medium = $workspace->priorities()->where('key', 'medium')->firstOrFail();
        $highest = $workspace->priorities()->where('key', 'highest')->firstOrFail();
        $low = $workspace->priorities()->where('key', 'low')->firstOrFail();

        $projects = Project::where('workspace_id', $workspace->id)->get();

        $taskDefinitions = [
            'datakelola' => [
                ['title' => 'Sprint planning Q3 — arsitektur data pipeline', 'type' => $storyType, 'col' => 'done', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => -5],
                ['title' => 'Setup CI/CD pipeline dengan GitHub Actions', 'type' => $taskType, 'col' => 'done', 'priority' => $medium, 'assignee' => 'arya', 'reporter' => 'arya', 'due' => -3],
                ['title' => 'Integrasi data source connector — REST API dan GraphQL', 'type' => $storyType, 'col' => 'review', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 1],
                ['title' => 'Implementasi role-based access control (RBAC)', 'type' => $taskType, 'col' => 'review', 'priority' => $highest, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 0],
                ['title' => 'Build dashboard analytics — chart.js dan agregasi', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'baihaqi', 'due' => 3],
                ['title' => 'Data export engine — CSV, Excel, PDF', 'type' => $storyType, 'col' => 'in_progress', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 5],
                ['title' => 'UI component library — atomic design system', 'type' => $improvementType, 'col' => 'in_progress', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'arya', 'due' => 4],
                ['title' => 'Optimasi query N+1 di listing halaman', 'type' => $improvementType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'arya', 'due' => 7],
                ['title' => 'Validasi form wizard multi-step', 'type' => $bugType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'raihan', 'reporter' => 'wanda', 'due' => 2],
                ['title' => 'Unit test coverage 80% — modul core', 'type' => $taskType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 10],
                ['title' => 'Audit log — track semua perubahan data', 'type' => $improvementType, 'col' => 'todo', 'priority' => $low, 'assignee' => 'fatur', 'reporter' => 'baihaqi', 'due' => 14],
                ['title' => 'Rate limiting — throttle API requests', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => 'arya', 'reporter' => 'arya', 'due' => 21],
                ['title' => 'Multi-tenancy database isolation', 'type' => $storyType, 'col' => 'backlog', 'priority' => $highest, 'assignee' => null, 'reporter' => 'baihaqi', 'due' => 30],
                ['title' => 'Real-time notification via WebSocket', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'arya', 'due' => 21],
                ['title' => 'Backup & restore mekanisme otomatis', 'type' => $taskType, 'col' => 'backlog', 'priority' => $high, 'assignee' => null, 'reporter' => 'baihaqi', 'due' => 28],
                ['title' => 'API documentation dengan Scramble', 'type' => $taskType, 'col' => 'backlog', 'priority' => $low, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 35],
            ],
            'datakelola-beacukai' => [
                ['title' => 'Integrasi CEISA 4.0 — modul impor', 'type' => $storyType, 'col' => 'done', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => -7],
                ['title' => 'Modul PIB dan PEB — validasi dokumen', 'type' => $taskType, 'col' => 'done', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => -4],
                ['title' => 'Tarif HS Code lookup engine', 'type' => $taskType, 'col' => 'review', 'priority' => $high, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 0],
                ['title' => 'Dashboard monitoring kepabeanan real-time', 'type' => $storyType, 'col' => 'review', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 2],
                ['title' => 'Kalkulasi bea masuk dan pajak otomatis', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 3],
                ['title' => 'Upload dan parsing manifes CSV', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'baihaqi', 'due' => 5],
                ['title' => 'Error handling di integrasi CEISA timeout', 'type' => $bugType, 'col' => 'todo', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'wanda', 'due' => 1],
                ['title' => 'Laporan rekapitulasi bulanan PDF', 'type' => $taskType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 7],
                ['title' => 'Role akses — petugas bea cukai vs admin', 'type' => $taskType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 4],
                ['title' => 'Validasi NIK dan NPWP importir', 'type' => $taskType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 8],
                ['title' => 'Notifikasi status dokumen via email', 'type' => $improvementType, 'col' => 'backlog', 'priority' => $low, 'assignee' => 'raihan', 'reporter' => 'arya', 'due' => 14],
                ['title' => 'Webhook endpoint untuk update status dari CEISA', 'type' => $taskType, 'col' => 'backlog', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 21],
                ['title' => 'Sinkronisasi data tarif batch harian', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => null, 'reporter' => 'arya', 'due' => 30],
                ['title' => 'Multi-currency support untuk kalkulasi bea', 'type' => $improvementType, 'col' => 'backlog', 'priority' => $low, 'assignee' => null, 'reporter' => 'baihaqi', 'due' => 45],
            ],
            'datakelola-pelni' => [
                ['title' => 'Integrasi data manifest kapal — API Pelni', 'type' => $storyType, 'col' => 'done', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => -10],
                ['title' => 'Modul jadwal keberangkatan dan kedatangan', 'type' => $taskType, 'col' => 'done', 'priority' => $high, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => -6],
                ['title' => 'Tracking posisi kapal via GPS integration', 'type' => $storyType, 'col' => 'review', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 1],
                ['title' => 'Dashboard monitoring armada', 'type' => $taskType, 'col' => 'review', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 0],
                ['title' => 'Modul cargo tracking — container dan muatan', 'type' => $storyType, 'col' => 'in_progress', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 4],
                ['title' => 'Laporan B/L (Bill of Lading) elektronik', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 6],
                ['title' => 'Bug — timezone mismatch di jadwal kapal', 'type' => $bugType, 'col' => 'todo', 'priority' => $highest, 'assignee' => 'fatur', 'reporter' => 'faizal', 'due' => 1],
                ['title' => 'Manajemen pelabuhan — CRUD master data', 'type' => $taskType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'raihan', 'reporter' => 'arya', 'due' => 5],
                ['title' => 'Notifikasi perubahan jadwal ke penumpang', 'type' => $improvementType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'baihaqi', 'due' => 8],
                ['title' => 'Integrasi pembayaran tiket online', 'type' => $storyType, 'col' => 'backlog', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 21],
                ['title' => 'Sistem antrian boarding digital', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => null, 'reporter' => 'arya', 'due' => 28],
                ['title' => 'E-check-in via QR code', 'type' => $improvementType, 'col' => 'backlog', 'priority' => $low, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 35],
                ['title' => 'Laporan okupansi per rute bulanan', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 30],
            ],
            'datakelola-ahu' => [
                ['title' => 'Modul pendaftaran PT/CV — validasi dokumen', 'type' => $storyType, 'col' => 'done', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => -8],
                ['title' => 'Integrasi NIB (Nomor Induk Berusaha) OSS', 'type' => $taskType, 'col' => 'done', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => -5],
                ['title' => 'Form wizard perubahan anggaran dasar', 'type' => $taskType, 'col' => 'review', 'priority' => $high, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 1],
                ['title' => 'Template dokumen legal — surat kuasa, akta', 'type' => $taskType, 'col' => 'review', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 2],
                ['title' => 'Workflow approval multi-level', 'type' => $storyType, 'col' => 'in_progress', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 3],
                ['title' => 'Digital signature integration', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 5],
                ['title' => 'Validasi KTP elektronik — OCR parsing', 'type' => $improvementType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 4],
                ['title' => 'Riwayat perubahan badan hukum — audit trail', 'type' => $taskType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 7],
                ['title' => 'Bug — error validasi field NPWP', 'type' => $bugType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'wanda', 'due' => 1],
                ['title' => 'Peluncuran batch — notaris dan pemohon', 'type' => $storyType, 'col' => 'backlog', 'priority' => $high, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 14],
                ['title' => 'Cetak SK pengesahan dengan QR verifikasi', 'type' => $taskType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => null, 'reporter' => 'arya', 'due' => 21],
                ['title' => 'API gateway untuk sistem SABH', 'type' => $taskType, 'col' => 'backlog', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 28],
                ['title' => 'Dashboard statistik layanan per bulan', 'type' => $taskType, 'col' => 'backlog', 'priority' => $low, 'assignee' => 'raihan', 'reporter' => 'arya', 'due' => 35],
            ],
            'whatsapp-centralized' => [
                ['title' => 'Setup WhatsApp Cloud API — webhook verifikasi', 'type' => $taskType, 'col' => 'done', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => -5],
                ['title' => 'Multi-agent session management', 'type' => $storyType, 'col' => 'done', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => -3],
                ['title' => 'Template pesan broadcast dengan variable', 'type' => $taskType, 'col' => 'review', 'priority' => $high, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 1],
                ['title' => 'Auto-reply berbasis keyword detection', 'type' => $storyType, 'col' => 'review', 'priority' => $high, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 0],
                ['title' => 'Queue management — round robin assignment', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'baihaqi', 'due' => 2],
                ['title' => 'Media handling — gambar, video, dokumen', 'type' => $taskType, 'col' => 'in_progress', 'priority' => $medium, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 4],
                ['title' => 'Bug — pesan terkirim ganda saat network flaky', 'type' => $bugType, 'col' => 'todo', 'priority' => $highest, 'assignee' => 'arya', 'reporter' => 'faizal', 'due' => 1],
                ['title' => 'Dashboard metrik — total pesan, response time', 'type' => $taskType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 5],
                ['title' => 'Integrasi contact book dari Google Contacts', 'type' => $improvementType, 'col' => 'todo', 'priority' => $medium, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 7],
                ['title' => 'Rate limit handling — WhatsApp Business API', 'type' => $taskType, 'col' => 'todo', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 3],
                ['title' => 'Scheduled message — kirim di waktu tertentu', 'type' => $improvementType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => 'raihan', 'reporter' => 'baihaqi', 'due' => 14],
                ['title' => 'Chatbot AI sederhana — FAQ otomatis', 'type' => $storyType, 'col' => 'backlog', 'priority' => $low, 'assignee' => null, 'reporter' => 'arya', 'due' => 21],
                ['title' => 'Export chat history ke PDF', 'type' => $taskType, 'col' => 'backlog', 'priority' => $low, 'assignee' => 'galih', 'reporter' => 'arya', 'due' => 28],
                ['title' => 'Multi-language support — deteksi bahasa otomatis', 'type' => $improvementType, 'col' => 'backlog', 'priority' => $medium, 'assignee' => null, 'reporter' => 'baihaqi', 'due' => 30],
                ['title' => 'Webhook retry dengan exponential backoff', 'type' => $taskType, 'col' => 'backlog', 'priority' => $high, 'assignee' => 'fatur', 'reporter' => 'arya', 'due' => 14],
            ],
        ];

        $columnPositions = ['backlog' => 0, 'todo' => 1, 'in_progress' => 2, 'review' => 3, 'done' => 4];
        $descriptions = [
            'datakelola' => 'Fitur inti platform Datakelola untuk pengelolaan data perusahaan secara terpusat.',
            'datakelola-beacukai' => 'Modul kepabeanan dan cukai yang terintegrasi dengan sistem CEISA.',
            'datakelola-pelni' => 'Modul pelayaran nasional untuk manajemen armada dan jadwal kapal.',
            'whatsapp-centralized' => 'Gateway WhatsApp multi-agent untuk komunikasi pelanggan.',
            'datakelola-ahu' => 'Modul administrasi hukum umum untuk pendaftaran badan usaha.',
        ];

        $taskCounter = 1;

        foreach ($projects as $project) {
            $board = $project->boards()->where('is_default', true)->firstOrFail();
            $columns = $board->columns()->orderBy('position')->get()->keyBy('status_key');
            $defs = $taskDefinitions[$project->slug] ?? [];

            $epicNames = [
                'datakelola' => ['Infrastruktur & Arsitektur', 'Fitur Inti', 'Enhancement & QA'],
                'datakelola-beacukai' => ['Integrasi CEISA', 'Dokumen & Laporan', 'UI & UX'],
                'datakelola-pelni' => ['Sistem Pelayaran', 'Integrasi Kapal', 'Pengalaman Pengguna'],
                'datakelola-ahu' => ['Pendaftaran Badan Usaha', 'Dokumen Legal', 'Sistem & Keamanan'],
                'whatsapp-centralized' => ['Core Messaging', 'Agent Management', 'Analytics & Automation'],
            ];

            $epics = [];
            foreach (($epicNames[$project->slug] ?? []) as $epicName) {
                $epics[] = $project->epics()->create([
                    'name' => $epicName,
                    'status' => 'active',
                    'color' => ['#6C47FF', '#2563EB', '#DC2626'][count($epics) % 3],
                ]);
            }

            $activeSprint = $project->sprints()->create([
                'name' => 'Sprint '.(count($epics) > 0 ? count($epics) : 1).' — '.now()->format('M Y'),
                'status' => 'active',
                'start_date' => now()->subDays(7),
                'end_date' => now()->addDays(7),
            ]);

            $plannedSprint = $project->sprints()->create([
                'name' => 'Sprint '.(count($epics) + 1).' — '.now()->addDays(8)->format('M Y'),
                'status' => 'planned',
                'start_date' => now()->addDays(8),
                'end_date' => now()->addDays(21),
            ]);

            $labelDefs = [
                ['name' => 'Bug', 'color' => '#DC2626'],
                ['name' => 'Feature', 'color' => '#2563EB'],
                ['name' => 'Enhancement', 'color' => '#16A34A'],
                ['name' => 'Hotfix', 'color' => '#EA580C'],
            ];

            $labels = collect($labelDefs)->map(fn ($l) => $project->labels()->create([
                'workspace_id' => $workspace->id,
                'name' => $l['name'],
                'slug' => strtolower($l['name']),
                'color' => $l['color'],
            ]));

            foreach ($defs as $index => $def) {
                $column = $columns[$def['col']];
                $assigneeUser = $def['assignee'] ? ($users[$def['assignee']] ?? null) : null;
                $reporterUser = $users[$def['reporter']];

                $dueDate = $def['due'] !== null
                    ? ($def['due'] >= 0 ? now()->addDays($def['due']) : now()->subDays(abs($def['due'])))
                    : null;

                $task = $project->tasks()->create([
                    'board_id' => $board->id,
                    'board_column_id' => $column->id,
                    'task_type_id' => $def['type']->id,
                    'priority_id' => $def['priority']->id,
                    'reporter_id' => $reporterUser->id,
                    'task_number' => $taskCounter,
                    'code' => $project->key.'-'.$taskCounter,
                    'title' => $def['title'],
                    'description' => $descriptions[$project->slug] ?? '',
                    'status' => $column->status_key,
                    'position' => ($columnPositions[$def['col']] * 1000) + $index,
                    'due_date' => $dueDate instanceof Carbon ? $dueDate->toDateString() : $dueDate,
                ]);

                if ($assigneeUser) {
                    $task->assignees()->attach($assigneeUser->id);
                }

                if ($column->status_key === 'done') {
                    $task->update(['completed_at' => now()]);
                }

                if ($column->status_key === 'in_progress') {
                    $task->comments()->create([
                        'user_id' => $assigneeUser?->id ?? $reporterUser->id,
                        'body' => 'Mulai dikerjakan. Target selesai '.now()->addDays($def['due'] ?? 3)->format('d M Y').'.',
                    ]);
                }

                if ($column->status_key === 'review') {
                    $task->comments()->create([
                        'user_id' => $assigneeUser?->id ?? $reporterUser->id,
                        'body' => 'Sudah selesai implementasi, mohon direview. Terima kasih.',
                    ]);
                }

                $epicIndex = $index % count($epics);
                $task->epics()->attach($epics[$epicIndex]->id);

                $sprintTarget = $column->status_key === 'backlog' ? $plannedSprint : $activeSprint;
                if ($column->status_key !== 'done') {
                    $task->sprints()->attach($sprintTarget->id);
                }

                $labelIndex = ($index % 3);
                if ($def['type']->key === 'bug') {
                    $task->labels()->sync([$labels[0]->id, $labels[1]->id]);
                } else {
                    $task->labels()->attach($labels[$labelIndex]->id);
                }

                $taskCounter++;
            }
        }
    }
}
