<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    public function edit(Request $request): Response
    {
        $preferences = NotificationPreference::where('user_id', $request->user()->id)
            ->get()
            ->groupBy('type');

        $notificationTypes = [
            'task.assigned' => 'Task assigned',
            'task.commented' => 'Task commented',
            'task.mentioned' => 'Task mentioned',
            'task.updated' => 'Task updated',
            'workspace.invitation' => 'Workspace invitation',
        ];

        $channels = ['in_app', 'email', 'whatsapp'];

        $result = [];
        foreach ($notificationTypes as $type => $label) {
            $row = ['label' => $label];

            foreach ($channels as $channel) {
                $pref = $preferences->get($type)?->firstWhere('channel', $channel);
                $defaults = ['in_app' => true, 'email' => true, 'whatsapp' => false];
                $row[$channel.'_enabled'] = $pref?->enabled ?? $defaults[$channel];
            }

            $result[$type] = $row;
        }

        return Inertia::render('settings/notifications', [
            'preferences' => $result,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*.in_app_enabled' => 'required|boolean',
            'preferences.*.email_enabled' => 'required|boolean',
            'preferences.*.whatsapp_enabled' => 'nullable|boolean',
        ]);

        $user = $request->user();

        foreach ($validated['preferences'] as $type => $settings) {
            foreach (['in_app', 'email', 'whatsapp'] as $channel) {
                NotificationPreference::updateOrCreate(
                    ['user_id' => $user->id, 'type' => $type, 'channel' => $channel],
                    ['enabled' => $settings[$channel.'_enabled'] ?? false],
                );
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Notification preferences updated.')]);

        return to_route('notifications.edit');
    }
}
