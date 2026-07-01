<?php

namespace App\Policies;

use App\Models\Doc;
use App\Models\Project;
use App\Models\User;
use App\Support\Rbac;

class DocPolicy
{
    public function viewAny(User $user, Project $project): bool
    {
        return $user->can('view', $project);
    }

    public function view(User $user, Doc $doc): bool
    {
        return $user->can('view', $doc->project);
    }

    public function create(User $user, Project $project): bool
    {
        return Rbac::userCanInWorkspace($user, $project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $project, ['lead', 'manager']);
    }

    public function update(User $user, Doc $doc): bool
    {
        return Rbac::userCanInWorkspace($user, $doc->project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $doc->project, ['lead', 'manager']);
    }

    public function delete(User $user, Doc $doc): bool
    {
        return $this->update($user, $doc) || $doc->created_by === $user->id;
    }
}
