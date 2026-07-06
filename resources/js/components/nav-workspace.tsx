import { Link, router, usePage } from '@inertiajs/react';
import { Clock, Flag, Layout, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import {
    canAccessGoals,
    toastNoAccess,
} from '@/lib/permissions';
import { settings as workspaceSettings } from '@/routes/workspaces';
import {
    board as crossBoard,
    timeline as crossTimeline,
} from '@/routes/workspaces/cross-project';
import { index as goalsIndex } from '@/routes/workspaces/goals';
import type { CurrentWorkspaceProps } from '@/types/dashboard';
import type { WorkspaceRole } from '@/types/permissions';

interface Props {
    workspaceSlug: string;
}

export function NavWorkspace({ workspaceSlug }: Props) {
    const { t } = useTranslation();
    const { isCurrentUrl } = useCurrentUrl();
    const { props } = usePage();
    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;

    const items = [
        {
            title: t('sidebar.settings'),
            href: workspaceSettings({ workspace: workspaceSlug }).url,
            icon: Settings,
            permission: 'workspace.manage-members' as const,
        },
        {
            title: t('sidebar.goals'),
            href: goalsIndex({ workspace: workspaceSlug }).url,
            icon: Flag,
        },
        {
            title: t('sidebar.cross_board'),
            href: crossBoard({ workspace: workspaceSlug }).url,
            icon: Layout,
            permission: 'project.create' as const,
        },
        {
            title: t('sidebar.cross_timeline'),
            href: crossTimeline({ workspace: workspaceSlug }).url,
            icon: Clock,
            permission: 'project.create' as const,
        },
    ];

    const checkPermission = (item: (typeof items)[number]): boolean => {
        if (!item.permission) {
            return true;
        }

        const permissions = props.permissions as {
            workspace?: string[];
            project?: string[];
        } | undefined;

        return Boolean(
            permissions?.workspace?.includes(item.permission) ||
            permissions?.project?.includes(item.permission),
        );
    };

    const handleClick = (item: (typeof items)[number]) => {
        if (item.permission === 'workspace.manage-members') {
            const role = currentWorkspace?.role as WorkspaceRole | undefined;

            if (!canAccessGoals(role)) {
                toastNoAccess();

                return;
            }
        }

        if (!checkPermission(item)) {
            toastNoAccess();

            return;
        }

        router.visit(item.href);
    };

    return (
        <SidebarMenu className="px-2 py-0">
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(item.href) && !item.permission}
                        tooltip={{ children: item.title }}
                    >
                        {item.permission ? (
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                                onClick={() => handleClick(item)}
                            >
                                <item.icon />
                                <span>{item.title}</span>
                            </button>
                        ) : (
                            <Link href={item.href} prefetch>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
