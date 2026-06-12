<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessGitHubWebhookJob;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GitHubWebhookController extends Controller
{
    public function handle(Request $request, Workspace $workspace, Project $project): JsonResponse
    {
        $signature = $request->header('X-Hub-Signature-256');

        if (! $this->verifySignature($request->getContent(), $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $event = $request->header('X-GitHub-Event', 'push');
        $deliveryId = $request->header('X-GitHub-Delivery');
        $payload = $request->all();

        ProcessGitHubWebhookJob::dispatch($workspace->id, $project->id, $event, $payload, $deliveryId);

        return response()->json(['status' => 'accepted']);
    }

    protected function verifySignature(string $payload, ?string $signature): bool
    {
        if (! $signature) {
            return false;
        }

        $secret = config('services.github.webhook_secret');

        if (! $secret) {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }
}
