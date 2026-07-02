<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkspaceInvitationRequest;
use App\Models\NotificationLog;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Services\MailjetService;
use App\Services\WorkspaceRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WorkspaceInvitationController extends Controller
{
    public function store(StoreWorkspaceInvitationRequest $request, Workspace $workspace): RedirectResponse
    {
        $validated = $request->validated();
        $email = Str::lower($validated['email']);
        $existingUser = User::where('email', $email)->first();

        if ($existingUser && $workspace->members()->where('user_id', $existingUser->id)->exists()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'User is already a workspace member.']);

            return back();
        }

        $invitation = WorkspaceInvitation::query()->updateOrCreate([
            'workspace_id' => $workspace->id,
            'email' => $email,
            'accepted_at' => null,
        ], [
            'role' => $validated['role'],
            'token' => Str::random(64),
            'invited_by' => $request->user()->id,
            'expired_at' => now()->addDays(7),
        ]);

        // ponytail: synchronous Mailjet API call, queue if latency becomes an issue
        if ($existingUser && ! NotificationPreference::isEmailEnabled($existingUser, 'workspace.invitation')) {
            // skip — user disabled email notifications
        } else {
            $invitation->load(['workspace', 'invitedBy']);
            $acceptUrl = route('workspace-invitations.accept', ['invitation' => $invitation->token]);
            $subject = "Invitation to join {$invitation->workspace->name}";
            $html = sprintf(
                '<div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                    <h2 style="color:#1e293b;margin-top:0;">%s</h2>
                    <p style="color:#475569;line-height:1.6;">%s</p>
                    <a href="%s" style="display:inline-block;padding:10px 20px;color:#fff;background:#2563eb;border-radius:6px;text-decoration:none;font-weight:600;">Accept Invitation</a>
                    <p style="color:#94a3b8;font-size:14px;margin-top:16px;">This invitation expires in 7 days.</p>
                </div>',
                htmlspecialchars($subject),
                htmlspecialchars("{$invitation->invitedBy->name} invited you to join {$invitation->workspace->name} as {$invitation->role}."),
                $acceptUrl,
            );
            $sent = app(MailjetService::class)->send($email, null, $subject, $html);
            NotificationLog::create([
                'channel' => 'email',
                'recipient' => $email,
                'type' => 'workspace.invitation',
                'status' => $sent ? 'sent' : 'failed',
                'error' => $sent ? null : 'Mailjet API returned non-success',
                'sent_at' => now(),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invitation sent.']);

        return back();
    }

    public function destroy(Workspace $workspace, WorkspaceInvitation $invitation): RedirectResponse
    {
        Gate::authorize('manageMembers', $workspace);
        abort_unless((int) $invitation->workspace_id === (int) $workspace->id, 404);

        if ($invitation->accepted_at !== null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Accepted invitations cannot be cancelled.']);

            return back();
        }

        $invitation->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Invitation cancelled.']);

        return back();
    }

    public function accept(Request $request, WorkspaceInvitation $invitation, WorkspaceRoleService $roleService): RedirectResponse
    {
        if (! $invitation->isPending()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'This invitation is no longer valid.']);

            return to_route('dashboard');
        }

        if (! hash_equals(Str::lower($request->user()->email), Str::lower($invitation->email))) {
            abort(403, 'This invitation belongs to another email address.');
        }

        $workspace = $invitation->workspace;
        $existingMember = $workspace->members()->where('user_id', $request->user()->id)->first();

        if (! $existingMember) {
            $workspace->members()->create([
                'user_id' => $request->user()->id,
                'role' => $invitation->role,
                'joined_at' => now(),
                'invited_by' => $invitation->invited_by,
                'status' => 'active',
            ]);

            $roleService->syncRole($request->user(), $workspace, $invitation->role);
        }

        $invitation->update(['accepted_at' => now()]);
        session()->put('current_workspace_id', $workspace->id);
        setPermissionsTeamId($workspace->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => "You joined {$workspace->name}."]);

        return to_route('workspaces.settings', $workspace);
    }
}
