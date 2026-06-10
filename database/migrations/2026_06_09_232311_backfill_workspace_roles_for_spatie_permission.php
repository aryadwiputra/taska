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
        Workspace::query()
            ->with(['members.user'])
            ->each(function (Workspace $workspace): void {
                Rbac::ensureWorkspaceRoles($workspace);

                foreach ($workspace->members as $member) {
                    if ($member->status === 'active' && $member->user) {
                        Rbac::syncWorkspaceRole($member->user, $workspace, $member->role);
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
