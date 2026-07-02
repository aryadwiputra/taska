<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use App\Services\WhatsAppGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public int $backoff = 5;

    public ?string $queue = 'whatsapp';

    public function __construct(
        public string $phone,
        public string $message,
    ) {}

    public function handle(WhatsAppGatewayService $gateway): void
    {
        $gateway->send($this->phone, $this->message);

        NotificationLog::create([
            'channel' => 'whatsapp',
            'recipient' => mask_phone($this->phone),
            'type' => 'whatsapp',
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        logger()->error('WhatsApp notification failed after retries', [
            'phone' => mask_phone($this->phone),
            'error' => $e->getMessage(),
        ]);
    }
}
