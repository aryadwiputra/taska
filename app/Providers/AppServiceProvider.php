<?php

namespace App\Providers;

use App\Models\ApprovalFlow;
use App\Models\AutomationRule;
use App\Models\Board;
use App\Models\Doc;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Models\Workspace;
use App\Policies\ApprovalFlowPolicy;
use App\Policies\AutomationRulePolicy;
use App\Policies\BoardPolicy;
use App\Policies\DocPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TaskCommentPolicy;
use App\Policies\TaskPolicy;
use App\Policies\WorkspacePolicy;
use App\Support\Rbac;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
    }

    protected function configureAuthorization(): void
    {
        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Board::class, BoardPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(TaskComment::class, TaskCommentPolicy::class);
        Gate::policy(ApprovalFlow::class, ApprovalFlowPolicy::class);
        Gate::policy(AutomationRule::class, AutomationRulePolicy::class);
        Gate::policy(Doc::class, DocPolicy::class);

        Gate::before(function (User $user, string $ability, mixed ...$arguments): ?bool {
            if ($user->isSuperAdmin()) {
                return true;
            }

            return Rbac::ownsAuthorizationWorkspace($user, $arguments) ? true : null;
        });

        foreach (config('permissions.permissions') as $permission) {
            Gate::define($permission, fn (User $user) => $user->hasPermissionTo($permission));
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
