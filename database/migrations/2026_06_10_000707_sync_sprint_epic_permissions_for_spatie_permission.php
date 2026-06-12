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

        Workspace::query()->each(function (Workspace $workspace) use ($roleService): void {
            $roleService->ensureRoles($workspace);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Permissions are additive and safe to leave in place.
    }
};
