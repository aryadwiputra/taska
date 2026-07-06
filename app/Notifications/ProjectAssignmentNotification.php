<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectAssignmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Project $project,
        public string $role,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Assigned to {$this->project->name}")
            ->greeting("Hello {$notifiable->name},")
            ->line("You've been assigned as {$this->role} to the project {$this->project->name}.")
            ->action('View Project', route('projects.show', [
                'workspace' => $this->project->workspace->slug,
                'project' => $this->project->slug,
            ]));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Project Assignment',
            'body' => "You've been added as {$this->role} to {$this->project->name}.",
            'type' => 'project_assignment',
        ];
    }
}
