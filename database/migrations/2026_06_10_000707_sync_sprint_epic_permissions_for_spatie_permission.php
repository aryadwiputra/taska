<?php

use App\Models\Workspace;
use App\Support\Rbac;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Workspace::query()->each(function (Workspace $workspace): void {
            Rbac::ensureWorkspaceRoles($workspace);
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
