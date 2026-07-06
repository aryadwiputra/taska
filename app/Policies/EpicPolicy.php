<?php

namespace App\Policies;

use App\Models\Epic;
use App\Models\Project;
use App\Models\User;
use App\Support\Rbac;

class EpicPolicy
{
    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'epic.create');
    }

    public function update(User $user, Epic $epic): bool
    {
        return Rbac::userCanInWorkspace($user, $epic->project->workspace, 'epic.edit');
    }

    public function delete(User $user, Epic $epic): bool
    {
        return Rbac::userCanInWorkspace($user, $epic->project->workspace, 'epic.delete');
    }

    public function addTask(User $user, Epic $epic): bool
    {
        return $this->update($user, $epic);
    }

    public function removeTask(User $user, Epic $epic): bool
    {
        return $this->update($user, $epic);
    }
}
