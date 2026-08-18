import { describe, expect, it } from 'vitest';
import {
    canAccessWorkspaceSettings,
    canCreateProject,
    canAccessProjectSettings,
    canAccessGoals,
    canEditTask,
    canDeleteTask,
    canComment,
    canCreateTask,
    canManageEpics,
    canManageSprints,
    canManageLabels,
    canManageBoard,
    canDeleteProject,
    canDeleteWorkspace,
} from './permissions';

describe('Workspace permissions', () => {
    describe('canAccessWorkspaceSettings', () => {
        it('allows owner to access workspace settings', () => {
            expect(canAccessWorkspaceSettings('owner')).toBe(true);
        });

        it('allows admin to access workspace settings', () => {
            expect(canAccessWorkspaceSettings('admin')).toBe(true);
        });

        it('denies manager', () => {
            expect(canAccessWorkspaceSettings('manager')).toBe(false);
        });

        it('denies member', () => {
            expect(canAccessWorkspaceSettings('member')).toBe(false);
        });

        it('denies viewer', () => {
            expect(canAccessWorkspaceSettings('viewer')).toBe(false);
        });

        it('denies undefined role', () => {
            expect(canAccessWorkspaceSettings(undefined)).toBe(false);
        });
    });

    describe('canCreateProject', () => {
        it('allows owner', () => {
            expect(canCreateProject('owner')).toBe(true);
        });

        it('allows admin', () => {
            expect(canCreateProject('admin')).toBe(true);
        });

        it('allows manager', () => {
            expect(canCreateProject('manager')).toBe(true);
        });

        it('denies member', () => {
            expect(canCreateProject('member')).toBe(false);
        });

        it('denies viewer', () => {
            expect(canCreateProject('viewer')).toBe(false);
        });
    });

    describe('canAccessGoals', () => {
        it('allows owner', () => {
            expect(canAccessGoals('owner')).toBe(true);
        });

        it('allows admin', () => {
            expect(canAccessGoals('admin')).toBe(true);
        });

        it('allows manager', () => {
            expect(canAccessGoals('manager')).toBe(true);
        });

        it('denies member', () => {
            expect(canAccessGoals('member')).toBe(false);
        });
    });

    describe('canDeleteWorkspace', () => {
        it('allows owner', () => {
            expect(canDeleteWorkspace('owner')).toBe(true);
        });

        it('denies admin', () => {
            expect(canDeleteWorkspace('admin')).toBe(false);
        });

        it('denies manager', () => {
            expect(canDeleteWorkspace('manager')).toBe(false);
        });

        it('denies member', () => {
            expect(canDeleteWorkspace('member')).toBe(false);
        });
    });
});

describe('Project permissions', () => {
    describe('canAccessProjectSettings', () => {
        it('allows lead', () => {
            expect(canAccessProjectSettings('lead')).toBe(true);
        });

        it('allows manager', () => {
            expect(canAccessProjectSettings('manager')).toBe(true);
        });

        it('denies developer', () => {
            expect(canAccessProjectSettings('developer')).toBe(false);
        });

        it('denies qa', () => {
            expect(canAccessProjectSettings('qa')).toBe(false);
        });

        it('denies member', () => {
            expect(canAccessProjectSettings('member')).toBe(false);
        });

        it('denies viewer', () => {
            expect(canAccessProjectSettings('viewer')).toBe(false);
        });

        it('denies null', () => {
            expect(canAccessProjectSettings(null)).toBe(false);
        });
    });

    describe('canDeleteProject', () => {
        it('allows workspace owner', () => {
            expect(canDeleteProject('owner', null)).toBe(true);
        });

        it('allows project lead', () => {
            expect(canDeleteProject('admin', 'lead')).toBe(true);
        });

        it('denies admin without lead role', () => {
            expect(canDeleteProject('admin', 'developer')).toBe(false);
        });

        it('denies manager role', () => {
            expect(canDeleteProject('manager', 'manager')).toBe(false);
        });
    });
});

describe('Task permissions', () => {
    describe('canEditTask', () => {
        it('allows owner with null project role', () => {
            expect(canEditTask('owner', null)).toBe(true);
        });

        it('allows owner with lead project role', () => {
            expect(canEditTask('owner', 'lead')).toBe(true);
        });

        it('allows owner with manager project role', () => {
            expect(canEditTask('owner', 'manager')).toBe(true);
        });

        it('allows owner with developer project role', () => {
            expect(canEditTask('owner', 'developer')).toBe(true);
        });

        it('denies owner with qa project role', () => {
            expect(canEditTask('owner', 'qa')).toBe(false);
        });

        it('denies owner with member project role', () => {
            expect(canEditTask('owner', 'member')).toBe(false);
        });

        it('denies owner with viewer project role', () => {
            expect(canEditTask('owner', 'viewer')).toBe(false);
        });

        it('allows admin with developer project role', () => {
            expect(canEditTask('admin', 'developer')).toBe(true);
        });

        it('denies admin with qa project role', () => {
            expect(canEditTask('admin', 'qa')).toBe(false);
        });

        it('allows manager with developer project role', () => {
            expect(canEditTask('manager', 'developer')).toBe(true);
        });

        it('denies manager with qa project role', () => {
            expect(canEditTask('manager', 'qa')).toBe(false);
        });

        it('denies member workspace role regardless of project role', () => {
            expect(canEditTask('member', 'lead')).toBe(false);
        });

        it('denies viewer workspace role regardless of project role', () => {
            expect(canEditTask('viewer', 'lead')).toBe(false);
        });
    });

    describe('canDeleteTask', () => {
        it('allows workspace owner with any project role', () => {
            expect(canDeleteTask('owner', null)).toBe(true);
            expect(canDeleteTask('owner', 'viewer')).toBe(true);
        });

        it('allows project lead regardless of workspace role', () => {
            expect(canDeleteTask('admin', 'lead')).toBe(true);
            expect(canDeleteTask('manager', 'lead')).toBe(true);
            expect(canDeleteTask('member', 'lead')).toBe(true);
        });

        it('denies admin without lead role', () => {
            expect(canDeleteTask('admin', 'manager')).toBe(false);
            expect(canDeleteTask('admin', 'developer')).toBe(false);
        });
    });

    describe('canComment', () => {
        it('allows owner with null or valid project role', () => {
            expect(canComment('owner', null)).toBe(true);
            expect(canComment('owner', 'lead')).toBe(true);
            expect(canComment('owner', 'manager')).toBe(true);
        });

        it('denies owner with viewer project role', () => {
            expect(canComment('owner', 'viewer')).toBe(false);
        });

        it('allows admin with valid project role', () => {
            expect(canComment('admin', null)).toBe(true);
            expect(canComment('admin', 'lead')).toBe(true);
            expect(canComment('admin', 'member')).toBe(true);
        });

        it('denies admin with viewer project role', () => {
            expect(canComment('admin', 'viewer')).toBe(false);
        });

        it('allows manager with valid project role', () => {
            expect(canComment('manager', null)).toBe(true);
            expect(canComment('manager', 'developer')).toBe(true);
        });

        it('denies manager with viewer project role', () => {
            expect(canComment('manager', 'viewer')).toBe(false);
        });

        it('allows member workspace role with valid project role', () => {
            expect(canComment('member', null)).toBe(true);
            expect(canComment('member', 'member')).toBe(true);
        });

        it('denies member with viewer project role', () => {
            expect(canComment('member', 'viewer')).toBe(false);
        });

        it('denies viewer workspace role regardless of project role', () => {
            expect(canComment('viewer', 'lead')).toBe(false);
        });
    });

    describe('canCreateTask', () => {
        it('allows owner', () => {
            expect(canCreateTask('owner')).toBe(true);
        });

        it('allows admin', () => {
            expect(canCreateTask('admin')).toBe(true);
        });

        it('allows manager', () => {
            expect(canCreateTask('manager')).toBe(true);
        });

        it('allows member', () => {
            expect(canCreateTask('member')).toBe(true);
        });

        it('denies viewer', () => {
            expect(canCreateTask('viewer')).toBe(false);
        });
    });
});

describe('Management permissions', () => {
    describe('canManageEpics', () => {
        it('allows owner', () => {
            expect(canManageEpics('owner')).toBe(true);
        });

        it('allows admin', () => {
            expect(canManageEpics('admin')).toBe(true);
        });

        it('allows manager', () => {
            expect(canManageEpics('manager')).toBe(true);
        });

        it('denies member', () => {
            expect(canManageEpics('member')).toBe(false);
        });
    });

    describe('canManageSprints', () => {
        it('shares same logic as canManageEpics', () => {
            expect(canManageSprints).toBe(canManageEpics);
        });
    });

    describe('canManageLabels', () => {
        it('allows owner with null project role', () => {
            expect(canManageLabels('owner', null)).toBe(true);
        });

        it('allows owner with lead project role', () => {
            expect(canManageLabels('owner', 'lead')).toBe(true);
        });

        it('allows owner with manager project role', () => {
            expect(canManageLabels('owner', 'manager')).toBe(true);
        });

        it('denies owner with developer project role', () => {
            expect(canManageLabels('owner', 'developer')).toBe(false);
        });

        it('allows admin with lead project role (wsRole allows it)', () => {
            expect(canManageLabels('admin', 'lead')).toBe(true);
        });
    });

    describe('canManageBoard', () => {
        it('shares same logic as canManageLabels', () => {
            expect(canManageBoard).toBe(canManageLabels);
        });
    });
});
