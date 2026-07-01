import { toast } from 'sonner';

export function canAccessWorkspaceSettings(role?: string): boolean {
    return ['owner', 'admin'].includes(role ?? '');
}

export function canCreateProject(role?: string): boolean {
    return ['owner', 'admin', 'manager'].includes(role ?? '');
}

export function canAccessProjectSettings(role?: string | null): boolean {
    return ['lead', 'manager'].includes(role ?? '');
}

export function canAccessGoals(role?: string): boolean {
    return ['owner', 'admin', 'manager'].includes(role ?? '');
}

export function toastNoAccess(): void {
    toast.error("You don't have permission to access this feature.");
}
