<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'timezone', 'locale', 'avatar'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable;

    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function workspaceMemberships(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function assignedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_assignees');
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function projectMemberships(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function taskComments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    public function reportedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'reporter_id');
    }

    public function uploadedAttachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class, 'uploaded_by');
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(CommentMention::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(TaskApproval::class, 'approver_id');
    }

    public function createdReleases(): HasMany
    {
        return $this->hasMany(Release::class, 'created_by');
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class, 'invited_by');
    }

    public function membersInvitedBy(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class, 'invited_by');
    }

    public function projectMembersAddedBy(): HasMany
    {
        return $this->hasMany(ProjectMember::class, 'added_by');
    }

    public function ledComponents(): HasMany
    {
        return $this->hasMany(Component::class, 'lead_id');
    }

    public function notificationRules(): HasMany
    {
        return $this->hasMany(NotificationRule::class);
    }

    public function notificationPreference(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }

    public function savedFilters(): HasMany
    {
        return $this->hasMany(SavedFilter::class);
    }

    public function taskActivities(): HasMany
    {
        return $this->hasMany(TaskActivity::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function watchedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_watchers');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_super_admin' => 'boolean',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }
}
