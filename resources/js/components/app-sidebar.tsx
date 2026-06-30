import { Link, usePage } from '@inertiajs/react';
import {
    CheckSquare,
    LayoutGrid,
    Search,
    Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { ConnectionStatus } from '@/components/connection-status';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { NavWorkspace } from '@/components/nav-workspace';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as myTasksIndex } from '@/routes/my-tasks';
import { edit as profileEdit } from '@/routes/profile';
import { search as taskSearch } from '@/routes/tasks';
import type { NavItem } from '@/types';
import type { CurrentWorkspaceProps } from '@/types/dashboard';

export function AppSidebar() {
    const { t } = useTranslation();
    const { props } = usePage();

    const mainNavItems: NavItem[] = [
        {
            title: t('sidebar.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: t('sidebar.my_tasks'),
            href: myTasksIndex(),
            icon: CheckSquare,
        },
        {
            title: t('sidebar.search'),
            href: taskSearch(),
            icon: Search,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: t('sidebar.settings'),
            href: profileEdit(),
            icon: Settings,
        },
    ];

    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {currentWorkspace && <NavWorkspace workspaceSlug={currentWorkspace.slug} />}

                <NavProjects />

                {!currentWorkspace && (
                    <div className="px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            {t('sidebar.create_workspace_prompt')}
                        </p>
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <ConnectionStatus />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
