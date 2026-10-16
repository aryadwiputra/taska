import { usePage } from '@inertiajs/react';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceRolesPermissions } from './workspace-roles-permissions';

const rolesPermissions: Record<string, string | string[]> = {
    owner: ['*'],
    admin: ['workspace.view', 'task.create', 'task.edit-any'],
    manager: ['workspace.view', 'task.create'],
    member: ['workspace.view'],
    viewer: ['workspace.view'],
};

const permissionLabels: Record<string, string> = {
    'workspace.view': 'View workspace',
    'workspace.edit': 'Edit workspace settings',
    'task.create': 'Create tasks',
    'task.edit-any': 'Edit any task',
    'board.manage': 'Manage boards',
};

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
    viewer: 'Viewer',
};

function renderComponent() {
    return render(
        <WorkspaceRolesPermissions
            rolesPermissions={rolesPermissions}
            permissionLabels={permissionLabels}
            roleLabels={roleLabels}
        />,
    );
}

function rowFor(permissionLabel: string): HTMLElement {
    return screen.getByRole('row', { name: new RegExp(permissionLabel) });
}

describe('WorkspaceRolesPermissions', () => {
    beforeEach(() => {
        vi.mocked(usePage).mockReturnValue({
            props: {
                auth: { user: { id: 1, name: 'Test User' } },
                currentWorkspace: { role: 'admin' },
            },
        } as never);
    });

    it('renders the permission matrix with role columns and grouped rows', () => {
        renderComponent();

        expect(
            screen.getByRole('columnheader', { name: /Owner/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: /Viewer/ }),
        ).toBeInTheDocument();

        expect(screen.getByText('roles.groups.workspace')).toBeInTheDocument();
        expect(screen.getByText('roles.groups.task')).toBeInTheDocument();
        expect(screen.getByText('View workspace')).toBeInTheDocument();
    });

    it('marks the current user role column', () => {
        renderComponent();

        const adminColumn = screen.getByRole('columnheader', {
            name: /Admin/,
        });

        expect(within(adminColumn).getByText('roles.you')).toBeInTheDocument();
    });

    it('grants every permission to the owner wildcard', () => {
        renderComponent();

        const boardRow = rowFor('Manage boards');

        expect(
            within(boardRow).getByLabelText('roles.granted'),
        ).toBeInTheDocument();
    });

    it('filters permissions by the search term', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.type(
            screen.getByLabelText('roles.search_placeholder'),
            'Create tasks',
        );

        expect(screen.getByText('Create tasks')).toBeInTheDocument();
        expect(
            screen.queryByText('Edit workspace settings'),
        ).not.toBeInTheDocument();
    });

    it('shows an empty state when nothing matches', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.type(
            screen.getByLabelText('roles.search_placeholder'),
            'zzzz',
        );

        expect(screen.getByText(/roles.no_results/)).toBeInTheDocument();
    });

    it('does not render a project role policy table', () => {
        renderComponent();

        expect(
            screen.queryByText('Project Role Policies'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/TaskPolicy::update/),
        ).not.toBeInTheDocument();
    });
});
