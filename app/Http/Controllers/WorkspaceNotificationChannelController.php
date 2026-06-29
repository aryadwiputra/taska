<?php

namespace App\Http\Controllers;

use App\Models\NotificationChannel;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class WorkspaceNotificationChannelController extends Controller
{
    public function store(Request $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        $validated = $request->validate([
            'driver' => ['required', 'string', 'in:slack,discord,telegram,webhook'],
            'name' => ['required', 'string', 'max:100'],
            'config' => ['required', 'array'],
        ]);

        $workspace->notificationChannels()->create([
            'driver' => $validated['driver'],
            'name' => $validated['name'],
            'config' => $validated['config'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Notification channel added.']);

        return back();
    }

    public function update(Request $request, Workspace $workspace, NotificationChannel $channel): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        abort_unless($channel->workspace_id === $workspace->id, 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'config' => ['required', 'array'],
            'enabled' => ['boolean'],
        ]);

        $channel->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Notification channel updated.']);

        return back();
    }

    public function destroy(Workspace $workspace, NotificationChannel $channel): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        abort_unless($channel->workspace_id === $workspace->id, 404);

        $channel->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Notification channel removed.']);

        return back();
    }
}
