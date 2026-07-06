<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageMembers', $this->workspace) ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'integer',
                Rule::exists('workspace_members', 'user_id')->where('workspace_id', $this->workspace->id),
                Rule::unique('project_members')->where('project_id', $this->project_id),
            ],
            'project_id' => [
                'required', 'integer',
                Rule::exists('projects', 'id')->where('workspace_id', $this->workspace->id),
            ],
            'role' => ['required', 'string', Rule::in(['lead', 'manager', 'developer', 'qa', 'member', 'viewer'])],
        ];
    }
}
