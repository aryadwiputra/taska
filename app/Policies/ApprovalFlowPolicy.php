<?php

namespace App\Policies;

use App\Models\ApprovalFlow;
use App\Models\User;

class ApprovalFlowPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $this->update($user, $approvalFlow);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can('update', $approvalFlow->project);
    }

    public function delete(User $user, ApprovalFlow $approvalFlow): bool
    {
        return $user->can('update', $approvalFlow->project);
    }
}
