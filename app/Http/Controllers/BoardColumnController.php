<?php

namespace App\Http\Controllers;

use App\Events\ColumnsReordered;
use App\Http\Requests\ReorderBoardColumnsRequest;
use App\Http\Requests\StoreBoardColumnRequest;
use App\Http\Requests\UpdateBoardColumnRequest;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BoardColumnController extends Controller
{
    public function store(StoreBoardColumnRequest $request, Workspace $workspace, Project $project, Board $board): RedirectResponse
    {
        $validated = $request->validated();

        $maxPosition = $board->columns()->max('position');

        $board->columns()->create([
            'name' => $validated['name'],
            'status_key' => $validated['status_key'],
            'color' => $validated['color'] ?? null,
            'position' => $validated['position'] ?? ($maxPosition + 1),
            'is_done_column' => $validated['is_done_column'] ?? false,
            'wip_limit' => $validated['wip_limit'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Column added.']);

        return back(303);
    }

    public function update(UpdateBoardColumnRequest $request, Workspace $workspace, Project $project, Board $board, BoardColumn $boardColumn): RedirectResponse
    {
        $validated = $request->validated();

        $boardColumn->update([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? $boardColumn->color,
            'position' => $validated['position'] ?? $boardColumn->position,
            'is_done_column' => $validated['is_done_column'] ?? $boardColumn->is_done_column,
            'wip_limit' => $validated['wip_limit'] ?? $boardColumn->wip_limit,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Column updated.']);

        return back(303);
    }

    public function destroy(Workspace $workspace, Project $project, Board $board, BoardColumn $boardColumn): RedirectResponse
    {
        Gate::authorize('update', $board);

        if ($board->columns()->count() <= 1) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete the last column.']);

            return back(303);
        }

        $boardColumn->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Column deleted.']);

        return back(303);
    }

    public function reorder(ReorderBoardColumnsRequest $request, Workspace $workspace, Project $project, Board $board): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {
            foreach ($validated['columns'] as $item) {
                BoardColumn::where('id', $item['id'])->update(['position' => $item['position']]);
            }
        });

        ColumnsReordered::dispatch($project->id, $validated['columns']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Columns reordered.']);

        return back(303);
    }
}
