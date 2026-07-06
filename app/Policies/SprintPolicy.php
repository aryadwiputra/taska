<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\User;
use App\Support\Rbac;

class SprintPolicy
{
    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'sprint.create');
    }

    public function update(User $user, Sprint $sprint): bool
    {
        return Rbac::userCanInWorkspace($user, $sprint->project->workspace, 'sprint.edit');
    }

    public function delete(User $user, Sprint $sprint): bool
    {
        return Rbac::userCanInWorkspace($user, $sprint->project->workspace, 'sprint.delete');
    }

    public function start(User $user, Sprint $sprint): bool
    {
        return $this->update($user, $sprint);
    }

    public function close(User $user, Sprint $sprint): bool
    {
        return $this->update($user, $sprint);
    }

    public function addTask(User $user, Sprint $sprint): bool
    {
        return $this->update($user, $sprint);
    }

    public function removeTask(User $user, Sprint $sprint): bool
    {
        return $this->update($user, $sprint);
    }
}
