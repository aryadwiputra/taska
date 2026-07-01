<?php

namespace App\Http\Requests;

use App\Models\Doc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreDocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', [Doc::class, $this->project]) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => [
                'nullable', 'integer',
                Rule::exists('docs', 'id')->where('project_id', $this->project->id),
            ],
            'slug' => ['nullable', 'string', 'max:200', 'alpha_dash'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('slug') || blank($this->input('slug'))) {
            $this->merge([
                'slug' => Str::slug($this->input('title')),
            ]);
        }
    }
}
