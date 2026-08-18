<?php

namespace App\Policies;

use App\Models\Doc;
use App\Models\DocAttachment;
use App\Models\User;
use App\Support\Rbac;

class DocAttachmentPolicy
{
    public function viewAny(User $user, Doc $doc): bool
    {
        return $user->can('view', $doc->project);
    }

    public function view(User $user, DocAttachment $attachment): bool
    {
        return $user->can('view', $attachment->doc->project);
    }

    public function create(User $user, Doc $doc): bool
    {
        return Rbac::userCanInWorkspace($user, $doc->project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $doc->project, ['lead', 'manager']);
    }

    public function delete(User $user, DocAttachment $attachment): bool
    {
        $doc = $attachment->doc;

        return Rbac::userCanInWorkspace($user, $doc->project->workspace, 'project.create')
            && Rbac::projectRoleAllows($user, $doc->project, ['lead', 'manager']);
    }
}
