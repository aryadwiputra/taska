<?php

namespace App\Providers;

use App\Events\TaskCreated;
use App\Events\TaskFieldUpdated;
use App\Listeners\DispatchAutomationEvents;
use App\Listeners\DispatchNotificationRules;
use App\Listeners\DispatchTaskCreatedAutomation;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        TaskFieldUpdated::class => [
            DispatchAutomationEvents::class,
            DispatchNotificationRules::class,
        ],
        TaskCreated::class => [
            DispatchTaskCreatedAutomation::class,
            DispatchNotificationRules::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();
    }
}
