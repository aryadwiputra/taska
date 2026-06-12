<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', [Task::class, $this->project]) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'task_type_id' => ['required', Rule::exists('task_types', 'id')->where('workspace_id', $this->workspace->id)],
            'priority_id' => ['nullable', Rule::exists('priorities', 'id')->where('workspace_id', $this->workspace->id)],
            'description' => ['nullable', 'string'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', Rule::exists('project_members', 'user_id')->where('project_id', $this->project->id)],
            'epic_ids' => ['nullable', 'array'],
            'epic_ids.*' => ['integer', Rule::exists('epics', 'id')->where('project_id', $this->project->id)],
            'sprint_ids' => ['nullable', 'array'],
            'sprint_ids.*' => ['integer', Rule::exists('sprints', 'id')->where('project_id', $this->project->id)],
            'parent_id' => ['nullable', 'integer', Rule::exists('tasks', 'id')->where('project_id', $this->project->id)],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }
}
