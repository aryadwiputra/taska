<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreUserAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageMembers', $this->workspace) ?? false;
    }

    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array', 'min:1', 'max:20'],
            'user_ids.*' => ['integer', Rule::exists('workspace_members', 'user_id')->where('workspace_id', $this->workspace->id)],
            'project_ids' => ['required', 'array', 'min:1', 'max:20'],
            'project_ids.*' => ['integer', Rule::exists('projects', 'id')->where('workspace_id', $this->workspace->id)],
            'role' => ['required', 'string', Rule::in(['lead', 'manager', 'developer', 'qa', 'member', 'viewer'])],
        ];
    }
}
