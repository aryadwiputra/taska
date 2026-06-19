<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderBoardTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view', $this->board) ?? false;
    }

    public function rules(): array
    {
        return [
            'columns' => ['required', 'array', 'min:1'],
            'columns.*.column_id' => ['required', 'integer', 'exists:board_columns,id'],
            'columns.*.task_ids' => ['present', 'array'],
            'columns.*.task_ids.*' => ['integer', 'exists:tasks,id'],
        ];
    }
}
