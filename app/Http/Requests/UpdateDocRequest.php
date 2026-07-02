<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('doc')) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => [
                'nullable', 'integer',
                Rule::exists('docs', 'id')->where('project_id', $this->route('project')->id),
            ],
            'slug' => ['nullable', 'string', 'max:200', 'alpha_dash'],
        ];
    }
}
