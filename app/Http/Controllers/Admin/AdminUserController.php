<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $users = User::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->withCount('workspaces')
            ->latest()
            ->paginate(15)
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_super_admin' => $user->is_super_admin,
                'email_verified_at' => $user->email_verified_at,
                'workspaces_count' => $user->workspaces_count,
                'deleted_at' => $user->deleted_at,
                'created_at' => $user->created_at,
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8'],
            'is_super_admin' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        if ($validated['is_super_admin'] ?? false) {
            $user->is_super_admin = true;
            $user->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User created.']);

        return to_route('admin.users.index');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_super_admin' => ['boolean'],
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if ($validated['password'] ?? null) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        $user->is_super_admin = $validated['is_super_admin'] ?? false;
        $user->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User updated.']);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete your own account.']);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => 'User deleted.']);

        return to_route('admin.users.index');
    }
}
