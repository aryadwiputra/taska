<?php

namespace App\Http\Controllers;

use App\Models\WorkspaceInvitation;
use App\Services\WorkspaceRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class PasswordSetupController extends Controller
{
    public function show(Request $request): Response
    {
        $token = $request->session()->get('pending_invitation_token');

        if (! $token) {
            return redirect()->route('login');
        }

        $invitation = WorkspaceInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->first();

        if (! $invitation || $invitation->isExpired()) {
            $request->session()->forget('pending_invitation_token');

            return redirect()->route('login')->with('error', 'Invitation is no longer valid.');
        }

        return Inertia::render('auth/password-setup', [
            'email' => $invitation->email,
            'workspaceName' => $invitation->workspace->name,
            'inviterName' => $invitation->invitedBy->name ?? 'Someone',
            'role' => $invitation->role,
        ]);
    }

    public function store(Request $request, WorkspaceRoleService $roleService): RedirectResponse
    {
        $token = $request->session()->get('pending_invitation_token');

        if (! $token) {
            return redirect()->route('login');
        }

        $invitation = WorkspaceInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->first();

        if (! $invitation || $invitation->isExpired()) {
            $request->session()->forget('pending_invitation_token');

            return redirect()->route('login')->with('error', 'Invitation is no longer valid.');
        }

        $validator = Validator::make($request->all(), [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        $user = $invitation->user;

        if (! $user) {
            return back()->withErrors(['email' => 'User not found.']);
        }

        $user->password = $request->password;
        $user->save();

        auth()->login($user);

        $workspace = $invitation->workspace;

        if (! $workspace->members()->where('user_id', $user->id)->exists()) {
            $workspace->members()->create([
                'user_id' => $user->id,
                'role' => $invitation->role,
                'joined_at' => now(),
                'invited_by' => $invitation->invited_by,
                'status' => 'active',
            ]);

            $roleService->syncRole($user, $workspace, $invitation->role);
        }

        $invitation->update(['accepted_at' => now()]);
        session()->put('current_workspace_id', $workspace->id);
        setPermissionsTeamId($workspace->id);
        session()->forget('pending_invitation_token');

        Inertia::flash('toast', ['type' => 'success', 'message' => "Welcome to {$workspace->name}!"]);

        return redirect()->route('dashboard');
    }
}
