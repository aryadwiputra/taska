<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeGatewayService
{
    protected string $baseUrl;

    protected string $apiToken;

    public function __construct()
    {
        $this->baseUrl = config('realtime.gateway_url', 'http://localhost:3002');
        $this->apiToken = config('realtime.api_token', '');
    }

    public function broadcast(string $channel, string $event, array $data = []): void
    {
        try {
            Http::timeout(5)->withHeaders([
                'Authorization' => "Bearer {$this->apiToken}",
            ])->post("{$this->baseUrl}/broadcast", [
                'channel' => $channel,
                'event' => $event,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('Realtime broadcast failed', [
                'channel' => $channel,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
