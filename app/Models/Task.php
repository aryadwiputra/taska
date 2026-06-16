<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'board_id',
        'board_column_id',
        'parent_id',
        'task_type_id',
        'priority_id',
        'reporter_id',
        'task_number',
        'code',
        'title',
        'description',
        'status',
        'position',
        'story_points',
        'release_id',
        'start_date',
        'due_date',
        'completed_at',
        'first_responded_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'decimal:6',
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'first_responded_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function boardColumn(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'board_column_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    public function priority(): BelongsTo
    {
        return $this->belongsTo(Priority::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_labels');
    }

    public function epics(): BelongsToMany
    {
        return $this->belongsToMany(Epic::class, 'epic_tasks');
    }

    public function sprints(): BelongsToMany
    {
        return $this->belongsToMany(Sprint::class, 'sprint_tasks');
    }

    public function release(): BelongsTo
    {
        return $this->belongsTo(Release::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TaskActivity::class);
    }

    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_watchers');
    }

    public function relatedTasks(): HasMany
    {
        return $this->hasMany(TaskRelation::class, 'task_id');
    }

    public function inverseRelatedTasks(): HasMany
    {
        return $this->hasMany(TaskRelation::class, 'related_task_id');
    }

    public function components(): BelongsToMany
    {
        return $this->belongsToMany(Component::class, 'component_task');
    }
}
