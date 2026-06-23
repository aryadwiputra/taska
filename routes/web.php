<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ApprovalFlowController;
use App\Http\Controllers\AutomationRuleController;
use App\Http\Controllers\BacklogController;
use App\Http\Controllers\BoardColumnController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\BoardTaskReorderController;
use App\Http\Controllers\CommentTypingController;
use App\Http\Controllers\ComponentController;
use App\Http\Controllers\CrossProjectController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EpicController;
use App\Http\Controllers\GitHubAuthController;
use App\Http\Controllers\GitHubWebhookController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationRuleController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PriorityController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectSettingController;
use App\Http\Controllers\ReleaseController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SavedFilterController;
use App\Http\Controllers\SlaPolicyController;
use App\Http\Controllers\SprintController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskAttachmentPreviewController;
use App\Http\Controllers\TaskBulkOperationController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskRelationController;
use App\Http\Controllers\TaskSearchController;
use App\Http\Controllers\TaskTypeController;
use App\Http\Controllers\WhatsAppGatewayController;
use App\Http\Controllers\WorkloadController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\WorkspaceInvitationController;
use App\Http\Controllers\WorkspaceMemberController;
use App\Http\Controllers\WorkspaceSettingController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding');
    Route::get('/my-tasks', [MyTasksController::class, 'index'])->name('my-tasks.index');
    Route::get('/tasks/search', [TaskSearchController::class, 'index'])->name('tasks.search');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('my-notifications.index');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('my-notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('my-notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('my-notifications.destroy');

    Route::get('/api/users/search', function (Request $request) {
        $q = $request->query('q', '');

        return User::query()
            ->where('email', 'like', "%{$q}%")
            ->orWhere('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'name', 'email']);
    })->name('users.search')->middleware('throttle:120,1');

    Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::get('/workspaces/create', [WorkspaceController::class, 'create'])->name('workspaces.create');
    Route::post('/workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');
    Route::post('/workspaces/{workspace}/restore', [WorkspaceController::class, 'restore'])->name('workspaces.restore');

    Route::scopeBindings()->group(function () {
        Route::get('/workspaces/{workspace:slug}', [WorkspaceController::class, 'show'])->name('workspaces.show');
        Route::get('/workspaces/{workspace:slug}/settings', [WorkspaceController::class, 'edit'])->name('workspaces.settings');
        Route::put('/workspaces/{workspace:slug}', [WorkspaceController::class, 'update'])->name('workspaces.update');
        Route::delete('/workspaces/{workspace:slug}', [WorkspaceController::class, 'destroy'])->name('workspaces.destroy');
        Route::post('/workspaces/{workspace:slug}/switch', [WorkspaceController::class, 'switch'])->name('workspaces.switch');

        Route::get('/workspaces/{workspace:slug}/members', [WorkspaceMemberController::class, 'index'])->name('workspaces.members.index');
        Route::post('/workspaces/{workspace:slug}/members', [WorkspaceMemberController::class, 'store'])->name('workspaces.members.store');
        Route::put('/workspaces/{workspace:slug}/members/{member}', [WorkspaceMemberController::class, 'update'])->name('workspaces.members.update');
        Route::delete('/workspaces/{workspace:slug}/members/{member}', [WorkspaceMemberController::class, 'destroy'])->name('workspaces.members.destroy');

        Route::post('/workspaces/{workspace:slug}/invitations', [WorkspaceInvitationController::class, 'store'])->name('workspaces.invitations.store');
        Route::delete('/workspaces/{workspace:slug}/invitations/{invitation}', [WorkspaceInvitationController::class, 'destroy'])->name('workspaces.invitations.destroy');

        Route::put('/workspaces/{workspace:slug}/settings', [WorkspaceSettingController::class, 'update'])->name('workspaces.settings.update');

        Route::get('/workspaces/{workspace:slug}/settings/whatsapp/status', [WhatsAppGatewayController::class, 'status'])->name('workspaces.settings.whatsapp.status');
        Route::post('/workspaces/{workspace:slug}/settings/whatsapp/connect', [WhatsAppGatewayController::class, 'connect'])->name('workspaces.settings.whatsapp.connect');
        Route::delete('/workspaces/{workspace:slug}/settings/whatsapp/disconnect', [WhatsAppGatewayController::class, 'disconnect'])->name('workspaces.settings.whatsapp.disconnect');

        Route::get('/workspaces/{workspace:slug}/cross-project/timeline', [CrossProjectController::class, 'timeline'])->name('workspaces.cross-project.timeline');
        Route::get('/workspaces/{workspace:slug}/cross-project/board', [CrossProjectController::class, 'board'])->name('workspaces.cross-project.board');

        Route::get('/workspaces/{workspace:slug}/goals', [GoalController::class, 'index'])->name('workspaces.goals.index');
        Route::post('/workspaces/{workspace:slug}/goals', [GoalController::class, 'store'])->name('workspaces.goals.store');
        Route::get('/workspaces/{workspace:slug}/goals/{goal}', [GoalController::class, 'show'])->name('workspaces.goals.show');
        Route::put('/workspaces/{workspace:slug}/goals/{goal}', [GoalController::class, 'update'])->name('workspaces.goals.update');
        Route::delete('/workspaces/{workspace:slug}/goals/{goal}', [GoalController::class, 'destroy'])->name('workspaces.goals.destroy');
        Route::post('/workspaces/{workspace:slug}/goals/{goal}/key-results', [GoalController::class, 'storeKeyResult'])->name('workspaces.goals.key-results.store');
        Route::put('/workspaces/{workspace:slug}/goals/{goal}/key-results/{keyResult}', [GoalController::class, 'updateKeyResult'])->name('workspaces.goals.key-results.update');
        Route::delete('/workspaces/{workspace:slug}/goals/{goal}/key-results/{keyResult}', [GoalController::class, 'destroyKeyResult'])->name('workspaces.goals.key-results.destroy');
        Route::post('/workspaces/{workspace:slug}/goals/{goal}/epics', [GoalController::class, 'addEpic'])->name('workspaces.goals.epics.store');
        Route::delete('/workspaces/{workspace:slug}/goals/{goal}/epics/{epic}', [GoalController::class, 'removeEpic'])->name('workspaces.goals.epics.destroy');

        Route::post('/workspaces/{workspace:slug}/task-types', [TaskTypeController::class, 'store'])->name('workspaces.task-types.store');
        Route::put('/workspaces/{workspace:slug}/task-types/{taskType}', [TaskTypeController::class, 'update'])->name('workspaces.task-types.update');
        Route::delete('/workspaces/{workspace:slug}/task-types/{taskType}', [TaskTypeController::class, 'destroy'])->name('workspaces.task-types.destroy');

        Route::post('/workspaces/{workspace:slug}/priorities', [PriorityController::class, 'store'])->name('workspaces.priorities.store');
        Route::put('/workspaces/{workspace:slug}/priorities/{priority}', [PriorityController::class, 'update'])->name('workspaces.priorities.update');
        Route::delete('/workspaces/{workspace:slug}/priorities/{priority}', [PriorityController::class, 'destroy'])->name('workspaces.priorities.destroy');

        Route::get('/workspaces/{workspace:slug}/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/workspaces/{workspace:slug}/projects/create', [ProjectController::class, 'create'])->name('projects.create');
        Route::post('/workspaces/{workspace:slug}/projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}', [ProjectController::class, 'show'])->name('projects.show');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/settings', [ProjectController::class, 'edit'])->name('projects.settings');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}', [ProjectController::class, 'destroy'])->name('projects.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project}/restore', [ProjectController::class, 'restore'])->name('projects.restore');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/members/{member}', [ProjectMemberController::class, 'update'])->name('projects.members.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/members/{member}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy');

        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/settings', [ProjectSettingController::class, 'update'])->name('projects.settings.update');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/labels', [LabelController::class, 'index'])->name('projects.labels.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/labels', [LabelController::class, 'store'])->name('projects.labels.store');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/labels/{label}', [LabelController::class, 'show'])->name('projects.labels.show');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/labels/{label}', [LabelController::class, 'update'])->name('projects.labels.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/labels/{label}', [LabelController::class, 'destroy'])->name('projects.labels.destroy');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/components', [ComponentController::class, 'index'])->name('projects.components.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/components', [ComponentController::class, 'store'])->name('projects.components.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/components/{component}', [ComponentController::class, 'update'])->name('projects.components.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/components/{component}', [ComponentController::class, 'destroy'])->name('projects.components.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/components/{component}/add-task', [ComponentController::class, 'addTask'])->name('projects.components.add-task');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/components/{component}/remove-task', [ComponentController::class, 'removeTask'])->name('projects.components.remove-task');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/sla-policies', [SlaPolicyController::class, 'index'])->name('projects.sla-policies.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/sla-policies', [SlaPolicyController::class, 'store'])->name('projects.sla-policies.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/sla-policies/{slaPolicy}', [SlaPolicyController::class, 'update'])->name('projects.sla-policies.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/sla-policies/{slaPolicy}', [SlaPolicyController::class, 'destroy'])->name('projects.sla-policies.destroy');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/workload', [WorkloadController::class, 'index'])->name('projects.workload.index');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/workload/capacity', [WorkloadController::class, 'updateCapacity'])->name('projects.workload.update-capacity');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/epics', [EpicController::class, 'index'])->name('projects.epics.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/epics', [EpicController::class, 'store'])->name('projects.epics.store');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/epics/{epic}', [EpicController::class, 'show'])->name('projects.epics.show');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/epics/{epic}', [EpicController::class, 'update'])->name('projects.epics.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/epics/{epic}', [EpicController::class, 'destroy'])->name('projects.epics.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/epics/{epic}/add-task', [EpicController::class, 'addTask'])->name('projects.epics.add-task');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/epics/{epic}/remove-task', [EpicController::class, 'removeTask'])->name('projects.epics.remove-task');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/sprints', [SprintController::class, 'index'])->name('projects.sprints.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/sprints', [SprintController::class, 'store'])->name('projects.sprints.store');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}', [SprintController::class, 'show'])->name('projects.sprints.show');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}', [SprintController::class, 'update'])->name('projects.sprints.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}', [SprintController::class, 'destroy'])->name('projects.sprints.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}/add-task', [SprintController::class, 'addTask'])->name('projects.sprints.add-task');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}/remove-task', [SprintController::class, 'removeTask'])->name('projects.sprints.remove-task');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}/start', [SprintController::class, 'start'])->name('projects.sprints.start');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}/close', [SprintController::class, 'close'])->name('projects.sprints.close');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/sprints/{sprint}/report', [SprintController::class, 'report'])->name('projects.sprints.report');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/backlog', [BacklogController::class, 'index'])->name('projects.backlog.index');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/backlog/json', [BacklogController::class, 'indexJson'])->name('projects.backlog.index-json');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/backlog/reorder', [BacklogController::class, 'reorder'])->name('projects.backlog.reorder');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/backlog/{sprint}/add-task', [BacklogController::class, 'addToSprint'])->name('projects.backlog.add-to-sprint');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/activity', [ActivityLogController::class, 'index'])->name('projects.activity.index');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/reports', [ReportsController::class, 'index'])->name('projects.reports.index');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/saved-filters', [SavedFilterController::class, 'index'])->name('projects.saved-filters.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/saved-filters', [SavedFilterController::class, 'store'])->name('projects.saved-filters.store');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/saved-filters/{savedFilter}', [SavedFilterController::class, 'destroy'])->name('projects.saved-filters.destroy');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/releases', [ReleaseController::class, 'index'])->name('projects.releases.index');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/releases/json', [ReleaseController::class, 'indexJson'])->name('projects.releases.index-json');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/releases/{release}', [ReleaseController::class, 'show'])->name('projects.releases.show');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/releases', [ReleaseController::class, 'store'])->name('projects.releases.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/releases/{release}', [ReleaseController::class, 'update'])->name('projects.releases.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/releases/{release}', [ReleaseController::class, 'destroy'])->name('projects.releases.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/releases/{release}/add-task', [ReleaseController::class, 'addTask'])->name('projects.releases.add-task');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/releases/{release}/remove-task', [ReleaseController::class, 'removeTask'])->name('projects.releases.remove-task');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/board', [BoardController::class, 'show'])->name('projects.board');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards', [BoardController::class, 'store'])->name('projects.boards.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}', [BoardController::class, 'update'])->name('projects.boards.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}', [BoardController::class, 'destroy'])->name('projects.boards.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns', [BoardColumnController::class, 'store'])->name('projects.boards.columns.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/{boardColumn}', [BoardColumnController::class, 'update'])->name('projects.boards.columns.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/{boardColumn}', [BoardColumnController::class, 'destroy'])->name('projects.boards.columns.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/reorder', [BoardColumnController::class, 'reorder'])->name('projects.boards.columns.reorder');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/tasks/reorder', [BoardTaskReorderController::class, 'reorder'])->name('projects.boards.tasks.reorder');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/github/auth', [GitHubAuthController::class, 'redirect'])->name('projects.github.auth');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/github/callback', [GitHubAuthController::class, 'callback'])->name('projects.github.callback');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/github', [GitHubAuthController::class, 'destroy'])->name('projects.github.destroy');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store')->middleware('throttle:60,1');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/bulk', [TaskBulkOperationController::class, 'store'])->name('projects.tasks.bulk')->middleware('throttle:30,1');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'show'])->name('projects.tasks.show');
        Route::patch('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'update'])->name('projects.tasks.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'destroy'])->name('projects.tasks.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/move', [TaskController::class, 'moveColumn'])->name('projects.tasks.move');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/create-branch', [TaskController::class, 'createBranch'])->name('projects.tasks.create-branch');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/automation', [AutomationRuleController::class, 'index'])->name('projects.automation.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/automation', [AutomationRuleController::class, 'store'])->name('projects.automation.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/automation/{rule}', [AutomationRuleController::class, 'update'])->name('projects.automation.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/automation/{rule}', [AutomationRuleController::class, 'destroy'])->name('projects.automation.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/automation/{rule}/test', [AutomationRuleController::class, 'test'])->name('projects.automation.test');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/approvals', [ApprovalFlowController::class, 'index'])->name('projects.approvals.index');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/approvals', [ApprovalFlowController::class, 'store'])->name('projects.approvals.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/approvals/{flow}', [ApprovalFlowController::class, 'update'])->name('projects.approvals.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/approvals/{flow}', [ApprovalFlowController::class, 'destroy'])->name('projects.approvals.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/approve', [ApprovalFlowController::class, 'approve'])->name('projects.tasks.approve');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/reject', [ApprovalFlowController::class, 'reject'])->name('projects.tasks.reject');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/notification-rules', [NotificationRuleController::class, 'store'])->name('projects.notification-rules.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/notification-rules/{rule}', [NotificationRuleController::class, 'update'])->name('projects.notification-rules.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/notification-rules/{rule}', [NotificationRuleController::class, 'destroy'])->name('projects.notification-rules.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/notification-rules/{rule}/toggle', [NotificationRuleController::class, 'toggle'])->name('projects.notification-rules.toggle');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('projects.tasks.comments.store')->middleware('throttle:60,1');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments/typing', [CommentTypingController::class, 'ping'])->name('projects.tasks.comments.typing')->middleware('throttle:30,1');
        Route::patch('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'update'])->name('projects.tasks.comments.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])->name('projects.tasks.comments.destroy');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('projects.tasks.attachments.store')->middleware('throttle:20,1');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments/{attachment}/preview', [TaskAttachmentPreviewController::class, 'preview'])->name('projects.tasks.attachments.preview');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments/{attachment}/download', [TaskAttachmentPreviewController::class, 'download'])->name('projects.tasks.attachments.download');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('projects.tasks.attachments.destroy');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/relations', [TaskRelationController::class, 'store'])->name('projects.tasks.relations.store');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/relations/{relation}', [TaskRelationController::class, 'destroy'])->name('projects.tasks.relations.destroy');
    });
});

Route::middleware(['auth', 'verified'])->get('/invitations/{invitation:token}/accept', [WorkspaceInvitationController::class, 'accept'])->name('workspace-invitations.accept');

// GitHub webhook — no auth (signed by GitHub)
Route::scopeBindings()->post('/workspaces/{workspace:slug}/projects/{project:slug}/github/webhook', [GitHubWebhookController::class, 'handle'])->name('projects.github.webhook');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
