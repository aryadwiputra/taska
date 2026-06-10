<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SettingService
{
    /**
     * @param  Workspace|Project  $model
     */
    public function get(Model $model, string $key, mixed $default = null): mixed
    {
        $setting = $this->relation($model)->where('key', $key)->first();

        return $setting ? $setting->value['value'] : $default;
    }

    /**
     * @param  Workspace|Project  $model
     */
    public function set(Model $model, string $key, mixed $value): void
    {
        $this->relation($model)->updateOrCreate(
            ['key' => $key],
            ['value' => ['value' => $value]],
        );
    }

    /**
     * @param  Workspace|Project  $model
     * @param  array<string, mixed>  $pairs  key => value
     */
    public function bulk(Model $model, array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            $this->set($model, $key, $value);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function all(Model $model): array
    {
        return $this->relation($model)
            ->get()
            ->mapWithKeys(fn ($s) => [$s->key => $s->value['value'] ?? null])
            ->all();
    }

    private function relation(Model $model): HasMany
    {
        return match ($model::class) {
            Workspace::class => $model->settings(),
            Project::class => $model->settings(),
            default => throw new \InvalidArgumentException('Unsupported model: '.$model::class),
        };
    }
}
