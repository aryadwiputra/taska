<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBoardColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->board) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'status_key' => [
                'required',
                'string',
                'max:50',
                Rule::unique('board_columns', 'status_key')
                    ->where('board_id', $this->board->id),
            ],
            'color' => ['nullable', 'string', 'max:30'],
            'position' => ['nullable', 'integer', 'min:0'],
            'is_done_column' => ['nullable', 'boolean'],
        ];
    }
}
