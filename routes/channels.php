<?php

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{id}', function (User $user, int $id) {
    return (int) $user->id === $id;
});

Broadcast::channel('project.{projectId}', function (User $user, int $projectId) {
    return $user->can('view', Project::find($projectId));
});

Broadcast::channel('board.{projectId}', function (User $user, int $projectId) {
    /** @var Project|null */
    $project = Project::find($projectId);

    if (! $user->can('view', $project)) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});
