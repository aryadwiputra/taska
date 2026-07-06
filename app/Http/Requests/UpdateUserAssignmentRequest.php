<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageMembers', $this->workspace) ?? false;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', 'string', Rule::in(['lead', 'manager', 'developer', 'qa', 'member', 'viewer'])],
        ];
    }
}
