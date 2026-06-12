<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\BoardColumnController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EpicController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PriorityController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectSettingController;
use App\Http\Controllers\SprintController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskRelationController;
use App\Http\Controllers\TaskTypeController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\WorkspaceMemberController;
use App\Http\Controllers\WorkspaceSettingController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
    Route::get('/my-tasks', [MyTasksController::class, 'index'])->name('my-tasks.index');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('my-notifications.index');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('my-notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('my-notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    Route::get('/api/users/search', function (Request $request) {
        $q = $request->query('q', '');

        return User::query()
            ->where('email', 'like', "%{$q}%")
            ->orWhere('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'name', 'email']);
    })->name('users.search');

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

        Route::put('/workspaces/{workspace:slug}/settings', [WorkspaceSettingController::class, 'update'])->name('workspaces.settings.update');

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

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/activity', [ActivityLogController::class, 'index'])->name('projects.activity.index');

        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/board', [BoardController::class, 'show'])->name('projects.board');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards', [BoardController::class, 'store'])->name('projects.boards.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}', [BoardController::class, 'update'])->name('projects.boards.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}', [BoardController::class, 'destroy'])->name('projects.boards.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns', [BoardColumnController::class, 'store'])->name('projects.boards.columns.store');
        Route::put('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/{boardColumn}', [BoardColumnController::class, 'update'])->name('projects.boards.columns.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/{boardColumn}', [BoardColumnController::class, 'destroy'])->name('projects.boards.columns.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/boards/{board}/columns/reorder', [BoardColumnController::class, 'reorder'])->name('projects.boards.columns.reorder');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store');
        Route::get('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'show'])->name('projects.tasks.show');
        Route::patch('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'update'])->name('projects.tasks.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}', [TaskController::class, 'destroy'])->name('projects.tasks.destroy');
        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/move', [TaskController::class, 'moveColumn'])->name('projects.tasks.move');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('projects.tasks.comments.store');
        Route::patch('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'update'])->name('projects.tasks.comments.update');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])->name('projects.tasks.comments.destroy');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('projects.tasks.attachments.store');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('projects.tasks.attachments.destroy');

        Route::post('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/relations', [TaskRelationController::class, 'store'])->name('projects.tasks.relations.store');
        Route::delete('/workspaces/{workspace:slug}/projects/{project:slug}/tasks/{task}/relations/{relation}', [TaskRelationController::class, 'destroy'])->name('projects.tasks.relations.destroy');
    });
});

require __DIR__.'/settings.php';
