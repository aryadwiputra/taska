<?php

namespace App\Http\Middleware;

use App\Models\Notification;
use App\Models\ProjectMember;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'notifications' => [
                    'unreadCount' => $user
                        ? Notification::where('user_id', $user->id)->unread()->count()
                        : 0,
                ],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'workspaces' => $user?->workspaces()->select('workspaces.id', 'workspaces.name', 'workspaces.slug', 'workspaces.logo')->get(),
            'currentWorkspace' => function () use ($user, $request) {
                if (! $user) {
                    return null;
                }

                $workspaceId = $request->session()->get('current_workspace_id');
                $workspace = $workspaceId
                    ? $user->workspaces()->where('workspaces.id', $workspaceId)->first()
                    : $user->workspaces()->first();

                if (! $workspace) {
                    return null;
                }

                $workspaceRole = $workspace->members()
                    ->where('user_id', $user->id)
                    ->value('role');

                $projects = $workspace->projects()
                    ->select('projects.id', 'projects.name', 'projects.key', 'projects.color', 'projects.slug')
                    ->orderBy('name')
                    ->get();

                $userProjectRoles = $projects->isEmpty()
                    ? collect()
                    : ProjectMember::whereIn('project_id', $projects->pluck('id'))
                        ->where('user_id', $user->id)
                        ->pluck('role', 'project_id');

                return [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'slug' => $workspace->slug,
                    'logo' => $workspace->logo,
                    'role' => $workspaceRole,
                    'projects' => $projects->map(fn ($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'key' => $p->key,
                        'slug' => $p->slug,
                        'color' => $p->color,
                        'userRole' => $userProjectRoles->get($p->id),
                    ])->all(),
                ];
            },
        ];
    }
}
