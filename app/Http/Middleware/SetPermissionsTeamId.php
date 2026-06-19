<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetPermissionsTeamId
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $workspaceId = $request->session()->get('current_workspace_id');

            if (! $workspaceId) {
                $workspaceId = $request->user()->workspaces()->first()?->id;

                if ($workspaceId) {
                    $request->session()->put('current_workspace_id', $workspaceId);
                }
            }

            if ($workspaceId) {
                setPermissionsTeamId($workspaceId);
                app(PermissionRegistrar::class)->forgetCachedPermissions();
            }
        }

        return $next($request);
    }
}
