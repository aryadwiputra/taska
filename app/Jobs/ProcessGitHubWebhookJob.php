<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\TaskActivity;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProcessGitHubWebhookJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(
        public int $workspaceId,
        public int $projectId,
        public string $event,
        public array $payload,
        public ?string $deliveryId = null,
    ) {}

    public function handle(): void
    {
        if ($this->deliveryId !== null && ! Cache::add("github_webhook_{$this->deliveryId}", true, now()->addDay())) {
            Log::info('GitHub webhook: duplicate delivery skipped', ['delivery_id' => $this->deliveryId]);

            return;
        }

        $project = Project::with('workspace')->find($this->projectId);

        if (! $project) {
            Log::warning('GitHub webhook: project not found', ['project_id' => $this->projectId]);

            return;
        }

        match ($this->event) {
            'push' => $this->handlePush($project),
            'pull_request' => $this->handlePullRequest($project),
            default => null,
        };
    }

    protected function handlePush(Project $project): void
    {
        $commits = $this->payload['commits'] ?? [];
        $repository = $this->payload['repository']['full_name'] ?? 'unknown';
        $sender = $this->payload['sender']['login'] ?? 'unknown';
        $senderId = $this->payload['sender']['id'] ?? null;
        $defaultBranch = $this->payload['repository']['default_branch'] ?? 'main';
        $ref = $this->payload['ref'] ?? '';

        // Only process pushes to the default branch
        if ($ref !== "refs/heads/{$defaultBranch}") {
            return;
        }

        $projectCode = $project->key;

        foreach ($commits as $commit) {
            $message = $commit['message'] ?? '';
            $sha = $commit['id'] ?? '';
            $shortSha = substr($sha, 0, 7);
            $commitUrl = $commit['url'] ?? '';

            // Find task references: PROJ-123, case-insensitive
            $pattern = '/'.preg_quote($projectCode, '/').'-\d+/i';
            preg_match_all($pattern, $message, $matches);

            if (empty($matches[0])) {
                continue;
            }

            $taskCodes = array_unique($matches[0]);

            foreach ($taskCodes as $taskCode) {
                $task = $project->tasks()->where('code', $taskCode)->first();

                if (! $task) {
                    continue;
                }

                $this->addComment($task, $sender, $repository, $shortSha, $commitUrl, $message);

                $this->logActivity($task, $sender, $repository, $shortSha);

                // Auto-close if commit message contains "closes", "fixes", or "resolves"
                if (preg_match('/\b(closes|fixes|resolves)\s+'.preg_quote($taskCode, '/').'\b/i', $message)) {
                    $this->closeTask($task, $project);
                }
            }
        }
    }

    protected function handlePullRequest(Project $project): void
    {
        $action = $this->payload['action'] ?? 'unknown';
        $prNumber = $this->payload['pull_request']['number'] ?? null;
        $prTitle = $this->payload['pull_request']['title'] ?? '';
        $prUrl = $this->payload['pull_request']['html_url'] ?? '';
        $sender = $this->payload['sender']['login'] ?? 'unknown';
        $repository = $this->payload['repository']['full_name'] ?? 'unknown';

        if (! $prNumber) {
            return;
        }

        $projectCode = $project->key;
        $pattern = '/'.preg_quote($projectCode, '-').'-\d+/i';
        preg_match_all($pattern, $prTitle, $matches);

        if (empty($matches[0])) {
            return;
        }

        $taskCodes = array_unique($matches[0]);

        foreach ($taskCodes as $taskCode) {
            $task = $project->tasks()->where('code', $taskCode)->first();

            if (! $task) {
                continue;
            }

            $body = "{$sender} {$action} PR #{$prNumber} [{$repository}#{$prNumber}]({$prUrl}) referencing this task.";
            $comment = $task->comments()->create([
                'user_id' => $this->getBotUserId(),
                'body' => $body,
            ]);

            TaskActivity::create([
                'task_id' => $task->id,
                'user_id' => $this->getBotUserId(),
                'action' => 'github_pr',
                'field_name' => 'github',
                'new_value' => "{$sender} {$action} PR #{$prNumber}",
                'metadata' => ['repository' => $repository, 'pr_number' => $prNumber, 'url' => $prUrl],
            ]);

            // Auto-close on merge
            if ($action === 'closed' && ($this->payload['pull_request']['merged'] ?? false)) {
                $this->closeTask($task, $project);
            }
        }
    }

    protected function addComment($task, string $sender, string $repository, string $shortSha, string $commitUrl, string $message): void
    {
        $firstLine = strtok($message, "\n") ?: $message;
        $body = "{$sender} pushed commit [{$repository}@{$shortSha}]({$commitUrl}): {$firstLine}";

        $task->comments()->create([
            'user_id' => $this->getBotUserId(),
            'body' => $body,
        ]);
    }

    protected function logActivity($task, string $sender, string $repository, string $shortSha): void
    {
        TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $this->getBotUserId(),
            'action' => 'github_push',
            'field_name' => 'github',
            'new_value' => "{$sender} pushed {$repository}@{$shortSha}",
            'metadata' => ['sender' => $sender, 'repository' => $repository, 'sha' => $shortSha],
        ]);
    }

    protected function closeTask($task, Project $project): void
    {
        if ($task->completed_at !== null) {
            return;
        }

        $doneColumn = $project->boards()
            ->where('is_default', true)
            ->first()
            ?->columns()
            ->where('is_done_column', true)
            ->first();

        $task->update([
            'completed_at' => now(),
            'board_column_id' => $doneColumn?->id ?? $task->board_column_id,
        ]);
    }

    protected function getBotUserId(): int
    {
        $user = User::firstOrCreate(
            ['email' => 'github-bot@qeerja.test'],
            [
                'name' => 'GitHub Bot',
                'password' => bcrypt(\Str::random(32)),
            ],
        );

        return $user->id;
    }
}
