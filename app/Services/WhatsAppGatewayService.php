<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppGatewayService
{
    protected string $baseUrl;

    protected string $apiToken;

    public function __construct()
    {
        $this->baseUrl = config('whatsapp.gateway_url', 'http://localhost:3001');
        $this->apiToken = config('whatsapp.api_token', '');
    }

    protected function withAuth(): PendingRequest
    {
        $request = Http::timeout(5);

        if ($this->apiToken) {
            $request->withHeaders(['Authorization' => "Bearer {$this->apiToken}"]);
        }

        return $request;
    }

    public function status(): array
    {
        try {
            $response = $this->withAuth()->get("{$this->baseUrl}/status");

            return $response->json() ?? ['ready' => false, 'qr' => null];
        } catch (\Throwable $e) {
            Log::warning('WhatsApp gateway status check failed', ['error' => $e->getMessage()]);

            return ['ready' => false, 'qr' => null];
        }
    }

    public function send(string $phone, string $message): bool
    {
        try {
            $response = $this->withAuth()->timeout(10)->post("{$this->baseUrl}/send", [
                'phone' => $phone,
                'message' => $message,
            ]);

            if (! $response->successful()) {
                Log::warning('WhatsApp send failed', [
                    'phone' => mask_phone($phone),
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('WhatsApp send error', ['error' => $e->getMessage()]);

            return false;
        }
    }

    public function disconnect(): bool
    {
        try {
            $this->withAuth()->timeout(10)->delete("{$this->baseUrl}/session");

            return true;
        } catch (\Throwable $e) {
            Log::warning('WhatsApp disconnect error', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
