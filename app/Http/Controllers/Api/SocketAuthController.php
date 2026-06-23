<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SocketAuthController extends Controller
{
    public function token(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['valid' => false], 401);
        }

        $token = Str::random(64);

        Cache::put("socket_token:{$token}", $user->id, now()->addMinutes(5));

        return response()->json(['token' => $token]);
    }

    public function auth(Request $request): JsonResponse
    {
        $token = $request->input('token');

        if (! $token) {
            return response()->json(['valid' => false]);
        }

        $userId = Cache::get("socket_token:{$token}");

        if (! $userId) {
            return response()->json(['valid' => false]);
        }

        /** @var User|null $user */
        $user = User::find($userId);

        if (! $user) {
            return response()->json(['valid' => false]);
        }

        // Refresh token
        Cache::put("socket_token:{$token}", $userId, now()->addMinutes(5));

        $workspaceIds = $user->workspaces()->pluck('workspace_members.workspace_id');

        $projectIds = Project::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->pluck('id');

        $rooms = $projectIds->map(fn ($id) => "project.{$id}")->values()->toArray();

        return response()->json([
            'valid' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
            ],
            'rooms' => $rooms,
        ]);
    }
}
