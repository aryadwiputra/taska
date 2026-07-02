<?php

namespace App\Services;

use Mailjet\Client;
use Mailjet\Resources;

class MailjetService
{
    public function __construct(
        private Client $client,
    ) {}

    public function send(string $toEmail, ?string $toName, string $subject, string $html, ?string $text = null): bool
    {
        $body = [
            'Messages' => [[
                'From' => [
                    'Email' => config('mail.from.address'),
                    'Name' => config('mail.from.name'),
                ],
                'To' => [[
                    'Email' => $toEmail,
                    'Name' => $toName ?? $toEmail,
                ]],
                'Subject' => $subject,
                'HTMLPart' => $html,
                'TextPart' => $text ?? strip_tags($html),
            ]],
        ];

        $response = $this->client->post(Resources::$Email, ['body' => $body]);

        return $response->success();
    }
}
