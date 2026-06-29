<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $table = 'notification_preferences';

    protected $fillable = [
        'user_id',
        'type',
        'channel',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForChannel(Builder $query, string $channel): Builder
    {
        return $query->where('channel', $channel);
    }

    public static function isEnabled(User $user, string $type, string $channel): bool
    {
        $defaults = [
            'in_app' => true,
            'email' => true,
            'whatsapp' => false,
            'slack' => true,
            'discord' => true,
            'telegram' => true,
            'webhook' => true,
        ];

        $preference = static::where('user_id', $user->id)
            ->where('type', $type)
            ->where('channel', $channel)
            ->first();

        return $preference?->enabled ?? ($defaults[$channel] ?? true);
    }

    public static function isInAppEnabled(User $user, string $type): bool
    {
        return static::isEnabled($user, $type, 'in_app');
    }

    public static function isEmailEnabled(User $user, string $type): bool
    {
        return static::isEnabled($user, $type, 'email');
    }

    public static function isWhatsAppEnabled(User $user, string $type): bool
    {
        if (! $user->phone) {
            return false;
        }

        return static::isEnabled($user, $type, 'whatsapp');
    }
}
