<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBoardColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->board) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:30'],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_done_column' => ['nullable', 'boolean'],
        ];
    }
}
