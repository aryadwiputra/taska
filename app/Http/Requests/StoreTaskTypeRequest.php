<?php

namespace App\Http\Requests;

use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskTypeRequest extends FormRequest
{
    protected ?Workspace $workspace = null;

    public function authorize(): bool
    {
        $this->workspace = $this->route('workspace');

        return $this->user() && $this->user()->can('workspace.manage-task-types');
    }

    public function rules(): array
    {
        $workspaceId = $this->workspace?->id ?? $this->route('workspace')?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:30'],
            'icon' => ['nullable', 'string', 'max:100'],
            'key' => ['nullable', 'string', 'max:50', "unique:task_types,key,NULL,id,workspace_id,{$workspaceId}"],
        ];
    }
}
