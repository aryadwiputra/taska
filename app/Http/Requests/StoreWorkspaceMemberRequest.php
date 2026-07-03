<?php

namespace App\Http\Requests;

use App\Support\Rbac;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkspaceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageMembers', $this->workspace) ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('workspace_members')->where('workspace_id', $this->workspace->id)],
            'name' => ['required_without:user_id', 'string', 'max:255'],
            'email' => ['required_without:user_id', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required_without:user_id', 'string', 'min:8'],
            'role' => ['required', Rule::in(array_values(array_diff(Rbac::WORKSPACE_ROLES, ['owner'])))],
        ];
    }
}
