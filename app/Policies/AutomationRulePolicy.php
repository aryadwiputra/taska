<?php

namespace App\Policies;

use App\Models\AutomationRule;
use App\Models\User;

class AutomationRulePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AutomationRule $automationRule): bool
    {
        return $this->update($user, $automationRule);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, AutomationRule $automationRule): bool
    {
        return $user->can('update', $automationRule->project);
    }

    public function delete(User $user, AutomationRule $automationRule): bool
    {
        return $user->can('update', $automationRule->project);
    }
}
