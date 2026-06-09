# Database Schema Qeerja

Platform project & task management mirip Jira.

## Core Entity Flow

User
→ Workspace
→ Project
→ Board
→ Column
→ Task
→ Comment / Attachment / Activity / Notification

---

# 1. users

Menyimpan akun pengguna.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| name | varchar(150) | not null |
| email | varchar(150) | unique, not null |
| email_verified_at | timestamp | nullable |
| password | varchar(255) | not null |
| avatar | varchar(255) | nullable |
| timezone | varchar(100) | default Asia/Jakarta |
| locale | varchar(20) | default id |
| status | varchar(30) | default active |
| last_login_at | timestamp | nullable |
| remember_token | varchar(100) | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Status:
- active
- inactive
- suspended

---

# 2. workspaces

Ruang kerja utama untuk organisasi/tim.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| owner_id | bigint | FK users.id |
| name | varchar(150) | not null |
| slug | varchar(180) | unique |
| description | text | nullable |
| logo | varchar(255) | nullable |
| status | varchar(30) | default active |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Index:
- owner_id
- slug

---

# 3. workspace_members

Relasi user dengan workspace.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| user_id | bigint | FK users.id |
| role | varchar(50) | not null |
| joined_at | timestamp | nullable |
| invited_by | bigint | FK users.id nullable |
| status | varchar(30) | default active |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- workspace_id + user_id

Role:
- owner
- admin
- manager
- member
- viewer

Status:
- invited
- active
- inactive
- removed

---

# 4. workspace_invitations

Undangan member ke workspace.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| email | varchar(150) | not null |
| role | varchar(50) | default member |
| token | varchar(255) | unique |
| invited_by | bigint | FK users.id |
| accepted_at | timestamp | nullable |
| expired_at | timestamp | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Index:
- workspace_id
- email
- token

---

# 5. projects

Project di dalam workspace.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| created_by | bigint | FK users.id |
| name | varchar(150) | not null |
| key | varchar(20) | not null |
| slug | varchar(180) | not null |
| description | text | nullable |
| icon | varchar(255) | nullable |
| color | varchar(30) | nullable |
| visibility | varchar(30) | default private |
| status | varchar(30) | default active |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Unique:
- workspace_id + key
- workspace_id + slug

Status:
- active
- archived

Visibility:
- private
- workspace

---

# 6. project_members

Member khusus dalam project.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| user_id | bigint | FK users.id |
| role | varchar(50) | default member |
| added_by | bigint | FK users.id nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- project_id + user_id

Role:
- lead
- manager
- developer
- qa
- member
- viewer

---

# 7. boards

Board untuk Kanban/Scrum.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| name | varchar(150) | not null |
| type | varchar(30) | default kanban |
| is_default | boolean | default false |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Type:
- kanban
- scrum

---

# 8. board_columns

Kolom board seperti Todo, Progress, Done.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| board_id | bigint | FK boards.id |
| name | varchar(100) | not null |
| status_key | varchar(50) | not null |
| color | varchar(30) | nullable |
| position | integer | default 0 |
| is_done_column | boolean | default false |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- board_id + status_key

Default column:
- backlog
- todo
- in_progress
- review
- done

---

# 9. task_types

Master jenis task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| name | varchar(100) | not null |
| key | varchar(50) | not null |
| icon | varchar(100) | nullable |
| color | varchar(30) | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- workspace_id + key

Default:
- epic
- story
- task
- bug
- improvement

---

# 10. priorities

Master prioritas task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| name | varchar(100) | not null |
| key | varchar(50) | not null |
| level | integer | not null |
| color | varchar(30) | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Default:
- lowest
- low
- medium
- high
- highest
- urgent

---

# 11. tasks

Issue/task utama.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| board_id | bigint | FK boards.id nullable |
| board_column_id | bigint | FK board_columns.id nullable |
| parent_id | bigint | FK tasks.id nullable |
| task_type_id | bigint | FK task_types.id |
| priority_id | bigint | FK priorities.id nullable |
| reporter_id | bigint | FK users.id |
| task_number | integer | not null |
| code | varchar(50) | not null |
| title | varchar(255) | not null |
| description | longtext | nullable |
| status | varchar(50) | default todo |
| position | decimal(20,6) | default 0 |
| start_date | date | nullable |
| due_date | date | nullable |
| completed_at | timestamp | nullable |
| archived_at | timestamp | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Unique:
- project_id + task_number
- project_id + code

Index:
- project_id
- board_column_id
- parent_id
- reporter_id
- status
- due_date

Contoh code:
- QEERJA-1
- QEERJA-2

---

# 12. task_assignees

Relasi many-to-many task dan user.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| user_id | bigint | FK users.id |
| assigned_by | bigint | FK users.id nullable |
| created_at | timestamp |  |

Unique:
- task_id + user_id

---

# 13. labels

Label per workspace/project.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| project_id | bigint | FK projects.id nullable |
| name | varchar(100) | not null |
| slug | varchar(120) | not null |
| color | varchar(30) | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- workspace_id + project_id + slug

---

# 14. task_labels

Pivot task dan label.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| label_id | bigint | FK labels.id |
| created_at | timestamp |  |

Unique:
- task_id + label_id

---

# 15. task_comments

Komentar task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| user_id | bigint | FK users.id |
| parent_id | bigint | FK task_comments.id nullable |
| body | longtext | not null |
| edited_at | timestamp | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

Index:
- task_id
- user_id
- parent_id

---

# 16. task_attachments

File attachment task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| uploaded_by | bigint | FK users.id |
| disk | varchar(50) | default public |
| file_name | varchar(255) | not null |
| file_path | varchar(500) | not null |
| mime_type | varchar(150) | nullable |
| file_size | bigint | default 0 |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Index:
- task_id
- uploaded_by

---

# 17. task_activities

Audit trail task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| user_id | bigint | FK users.id nullable |
| action | varchar(100) | not null |
| field_name | varchar(100) | nullable |
| old_value | text | nullable |
| new_value | text | nullable |
| metadata | json | nullable |
| created_at | timestamp |  |

Action:
- created
- updated
- moved
- assigned
- unassigned
- commented
- attachment_added
- status_changed
- priority_changed
- due_date_changed
- deleted
- restored

Index:
- task_id
- user_id
- action
- created_at

---

# 18. task_watchers

User yang mengikuti update task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| task_id | bigint | FK tasks.id |
| user_id | bigint | FK users.id |
| created_at | timestamp |  |

Unique:
- task_id + user_id

---

# 19. sprints

Untuk Scrum phase lanjutan.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| name | varchar(150) | not null |
| goal | text | nullable |
| status | varchar(30) | default planned |
| start_date | date | nullable |
| end_date | date | nullable |
| completed_at | timestamp | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Status:
- planned
- active
- completed
- cancelled

---

# 20. sprint_tasks

Pivot sprint dan task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| sprint_id | bigint | FK sprints.id |
| task_id | bigint | FK tasks.id |
| created_at | timestamp |  |

Unique:
- sprint_id + task_id

---

# 21. epics

Epic level project.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| name | varchar(150) | not null |
| summary | text | nullable |
| color | varchar(30) | nullable |
| start_date | date | nullable |
| due_date | date | nullable |
| status | varchar(30) | default active |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| deleted_at | timestamp | nullable |

---

# 22. epic_tasks

Relasi epic dan task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| epic_id | bigint | FK epics.id |
| task_id | bigint | FK tasks.id |
| created_at | timestamp |  |

Unique:
- epic_id + task_id

---

# 23. notifications

Notifikasi user.

| Column | Type | Constraint |
|---|---|---|
| id | uuid | PK |
| user_id | bigint | FK users.id |
| type | varchar(150) | not null |
| title | varchar(255) | not null |
| body | text | nullable |
| data | json | nullable |
| read_at | timestamp | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Index:
- user_id
- read_at
- created_at

---

# 24. project_settings

Setting per project.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| project_id | bigint | FK projects.id |
| key | varchar(100) | not null |
| value | json | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- project_id + key

Contoh:
- default_board_id
- default_assignee_id
- task_prefix
- auto_assign_reporter

---

# 25. workspace_settings

Setting per workspace.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id |
| key | varchar(100) | not null |
| value | json | nullable |
| created_at | timestamp |  |
| updated_at | timestamp |  |

Unique:
- workspace_id + key

---

# 26. activity_logs

Audit global, bukan hanya task.

| Column | Type | Constraint |
|---|---|---|
| id | bigint | PK |
| workspace_id | bigint | FK workspaces.id nullable |
| project_id | bigint | FK projects.id nullable |
| user_id | bigint | FK users.id nullable |
| subject_type | varchar(255) | nullable |
| subject_id | bigint | nullable |
| action | varchar(100) | not null |
| description | text | nullable |
| properties | json | nullable |
| created_at | timestamp |  |

Index:
- workspace_id
- project_id
- user_id
- subject_type + subject_id
- created_at

---

# Relasi Utama

## Workspace
- Workspace belongsTo User as owner
- Workspace hasMany WorkspaceMember
- Workspace hasMany Project
- Workspace hasMany Label
- Workspace hasMany TaskType
- Workspace hasMany Priority

## Project
- Project belongsTo Workspace
- Project hasMany ProjectMember
- Project hasMany Board
- Project hasMany Task
- Project hasMany Sprint
- Project hasMany Epic

## Board
- Board belongsTo Project
- Board hasMany BoardColumn
- Board hasMany Task

## Task
- Task belongsTo Project
- Task belongsTo Board
- Task belongsTo BoardColumn
- Task belongsTo TaskType
- Task belongsTo Priority
- Task belongsTo User as reporter
- Task belongsTo Task as parent
- Task hasMany Task as children
- Task belongsToMany User as assignees
- Task belongsToMany Label
- Task hasMany Comment
- Task hasMany Attachment
- Task hasMany Activity
- Task hasMany Watcher

---

# Normalisasi

## Sudah dinormalisasi karena:

- User tidak disimpan berulang di task, hanya pakai user_id.
- Assignee dipisah ke task_assignees karena task bisa punya banyak assignee.
- Label dipisah ke labels dan task_labels.
- Priority dipisah ke priorities agar configurable per workspace.
- Task type dipisah ke task_types agar configurable per workspace.
- Comment dipisah dari task.
- Attachment dipisah dari task.
- Activity log dipisah dari task.
- Workspace member dan project member dipisah karena role bisa berbeda.
- Sprint dan epic tidak dicampur langsung ke task agar fleksibel.

---

# Rekomendasi Foreign Key Behavior

| Relasi | On Delete |
|---|---|
| workspace → projects | restrict |
| project → tasks | restrict |
| task → comments | cascade |
| task → attachments | cascade |
| task → activities | cascade |
| user → tasks reporter | restrict |
| user → comments | restrict |
| board → board_columns | cascade |
| board_column → tasks | set null |
| sprint → sprint_tasks | cascade |
| epic → epic_tasks | cascade |

---

# Rekomendasi Index Penting

```sql
tasks(project_id, status)
tasks(project_id, board_column_id)
tasks(project_id, priority_id)
tasks(project_id, task_type_id)
tasks(reporter_id)
tasks(due_date)
task_assignees(user_id)
task_comments(task_id)
task_activities(task_id, created_at)
notifications(user_id, read_at)
project_members(project_id, user_id)
workspace_members(workspace_id, user_id)
