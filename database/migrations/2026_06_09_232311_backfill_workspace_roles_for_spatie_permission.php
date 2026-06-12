<?php

use App\Models\Workspace;
use App\Services\WorkspaceRoleService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $roleService = app(WorkspaceRoleService::class);

        Workspace::query()
            ->with(['members.user'])
            ->each(function (Workspace $workspace) use ($roleService): void {
                $roleService->ensureRoles($workspace);

                foreach ($workspace->members as $member) {
                    if ($member->status === 'active' && $member->user) {
                        $roleService->syncRole($member->user, $workspace, $member->role);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
