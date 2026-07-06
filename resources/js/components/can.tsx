import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface CanProps {
    permission: string;
    fallback?: ReactNode;
    children: ReactNode;
}

export function Can({ permission, fallback = null, children }: CanProps) {
    const { props } = usePage();
    const permissions = props.permissions as {
        workspace?: string[];
        project?: string[];
    } | undefined;

    const allowed =
        permissions?.workspace?.includes(permission) ||
        permissions?.project?.includes(permission);

    if (allowed) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
