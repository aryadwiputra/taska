<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderBoardColumnsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->board) ?? false;
    }

    public function rules(): array
    {
        return [
            'columns' => ['required', 'array', 'min:1'],
            'columns.*.id' => ['required', 'integer', 'exists:board_columns,id'],
            'columns.*.position' => ['required', 'integer', 'min:0'],
        ];
    }
}
