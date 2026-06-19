<?php

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\PermissionRegistrar;

Broadcast::channel('user.{id}', function (User $user, int $id) {
    return (int) $user->id === $id;
});

Broadcast::channel('project.{projectId}', function (User $user, int $projectId) {
    /** @var Project|null */
    $project = Project::find($projectId);

    if (! $project) {
        Log::warning('Broadcast auth: project not found', ['userId' => $user->id, 'projectId' => $projectId]);

        return false;
    }

    setPermissionsTeamId($project->workspace_id);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $canView = $user->can('view', $project);

    if (! $canView) {
        Log::warning('Broadcast auth: can view denied', [
            'userId' => $user->id,
            'userEmail' => $user->email,
            'projectId' => $projectId,
            'workspaceId' => $project->workspace_id,
            'workspaceRole' => $project->workspace->members()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->value('role'),
            'projectRole' => $project->members()
                ->where('user_id', $user->id)
                ->value('role'),
            'hasProjectViewAnyPerm' => $user->can('project.view-any'),
        ]);
    }

    return $canView;
});

Broadcast::channel('board.{projectId}', function (User $user, int $projectId) {
    /** @var Project|null */
    $project = Project::find($projectId);

    if (! $project) {
        Log::warning('Broadcast auth (board): project not found', ['userId' => $user->id, 'projectId' => $projectId]);

        return false;
    }

    setPermissionsTeamId($project->workspace_id);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    if (! $user->can('view', $project)) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});
