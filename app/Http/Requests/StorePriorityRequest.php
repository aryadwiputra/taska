<?php

namespace App\Http\Requests;

use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;

class StorePriorityRequest extends FormRequest
{
    protected ?Workspace $workspace = null;

    public function authorize(): bool
    {
        $this->workspace = $this->route('workspace');

        return $this->user() && $this->user()->can('workspace.manage-priorities');
    }

    public function rules(): array
    {
        $workspaceId = $this->workspace?->id ?? $this->route('workspace')?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', 'integer', 'min:0'],
            'color' => ['nullable', 'string', 'max:30'],
            'key' => ['nullable', 'string', 'max:50', "unique:priorities,key,NULL,id,workspace_id,{$workspaceId}"],
        ];
    }
}
