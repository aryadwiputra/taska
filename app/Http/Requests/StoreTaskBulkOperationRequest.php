<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskBulkOperationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->project) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'task_ids' => ['required', 'array', 'min:1', 'max:100'],
            'task_ids.*' => ['integer', 'distinct', Rule::exists('tasks', 'id')->where('project_id', $this->project->id)],
            'operation' => ['required', Rule::in(['move_column', 'assignees', 'priority', 'labels', 'archive', 'delete'])],
            'board_column_id' => ['required_if:operation,move_column', 'integer', Rule::exists('board_columns', 'id')->whereIn('board_id', $this->project->boards()->select('id'))],
            'assignee_mode' => ['required_if:operation,assignees', Rule::in(['add', 'remove', 'replace'])],
            'assignee_ids' => ['required_if:operation,assignees', 'array'],
            'assignee_ids.*' => ['integer', 'distinct', Rule::exists('project_members', 'user_id')->where('project_id', $this->project->id)],
            'priority_id' => ['nullable', Rule::exists('priorities', 'id')->where('workspace_id', $this->workspace->id)],
            'label_mode' => ['required_if:operation,labels', Rule::in(['add', 'remove', 'replace'])],
            'label_ids' => ['required_if:operation,labels', 'array'],
            'label_ids.*' => ['integer', 'distinct', Rule::exists('labels', 'id')->where('project_id', $this->project->id)],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('operation') === 'priority' && ! $this->exists('priority_id')) {
                    $validator->errors()->add('priority_id', 'The priority field must be present.');
                }
            },
        ];
    }
}
