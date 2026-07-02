<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceInvitation extends Model
{
    protected $fillable = [
        'workspace_id',
        'email',
        'role',
        'token',
        'invited_by',
        'accepted_at',
        'expired_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    public function isExpired(): bool
    {
        return $this->expired_at !== null && $this->expired_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->accepted_at === null && ! $this->isExpired();
    }
}
