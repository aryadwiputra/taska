<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalFlow extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'column_id',
        'required_approvers',
        'min_approvals',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'required_approvers' => 'array',
            'enabled' => 'boolean',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'column_id');
    }

    public function taskApprovals(): HasMany
    {
        return $this->hasMany(TaskApproval::class);
    }

    public function resolveApprovers(Workspace $workspace): array
    {
        $approverIds = [];

        foreach ($this->required_approvers as $approver) {
            $type = $approver['type'] ?? '';
            $value = $approver['value'] ?? null;

            if ($type === 'user') {
                $approverIds[] = (int) str_replace('user:', '', $value);
            } elseif ($type === 'role') {
                $roleMembers = $workspace->members()
                    ->where('role', $value)
                    ->pluck('user_id')
                    ->all();
                $approverIds = array_merge($approverIds, $roleMembers);
            }
        }

        return array_unique($approverIds);
    }
}
