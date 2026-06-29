<?php

namespace App\Models;

use App\Services\WorkspaceRoleService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'description',
        'logo',
        'status',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    public function taskTypes(): HasMany
    {
        return $this->hasMany(TaskType::class);
    }

    public function priorities(): HasMany
    {
        return $this->hasMany(Priority::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(WorkspaceSetting::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    protected static function booted(): void
    {
        static::created(function (Workspace $workspace) {
            app(WorkspaceRoleService::class)->ensureRoles($workspace);

            $taskTypes = [
                ['name' => 'Epic', 'key' => 'epic', 'icon' => 'layers', 'color' => '#6C47FF'],
                ['name' => 'Story', 'key' => 'story', 'icon' => 'book-open', 'color' => '#2563EB'],
                ['name' => 'Task', 'key' => 'task', 'icon' => 'check-square', 'color' => '#64748B'],
                ['name' => 'Bug', 'key' => 'bug', 'icon' => 'bug', 'color' => '#DC2626'],
                ['name' => 'Improvement', 'key' => 'improvement', 'icon' => 'sparkles', 'color' => '#16A34A'],
            ];

            $priorities = [
                ['name' => 'Lowest', 'key' => 'lowest', 'level' => 1, 'color' => '#9CA3AF'],
                ['name' => 'Low', 'key' => 'low', 'level' => 2, 'color' => '#3B82F6'],
                ['name' => 'Medium', 'key' => 'medium', 'level' => 3, 'color' => '#D97706'],
                ['name' => 'High', 'key' => 'high', 'level' => 4, 'color' => '#EA580C'],
                ['name' => 'Highest', 'key' => 'highest', 'level' => 5, 'color' => '#DC2626'],
                ['name' => 'Urgent', 'key' => 'urgent', 'level' => 6, 'color' => '#991B1B'],
            ];

            foreach ($taskTypes as $type) {
                $workspace->taskTypes()->create($type);
            }

            foreach ($priorities as $priority) {
                $workspace->priorities()->create($priority);
            }
        });
    }

    public function notificationChannels(): HasMany
    {
        return $this->hasMany(NotificationChannel::class);
    }
}
