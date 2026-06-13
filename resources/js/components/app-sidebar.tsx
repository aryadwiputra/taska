import { Link, router, usePage } from '@inertiajs/react';
import { CheckSquare, LayoutGrid, Plus, Search, Settings } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { ConnectionStatus } from '@/components/connection-status';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NotificationSidebarItem } from '@/components/notification-sidebar-item';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as myTasksIndex } from '@/routes/my-tasks';
import { edit as profileEdit } from '@/routes/profile';
import {
    board as projectBoard,
    create as projectCreate,
} from '@/routes/projects';
import { search as taskSearch } from '@/routes/tasks';
import type { NavItem } from '@/types';
import type { CurrentWorkspaceProps } from '@/types/dashboard';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'My Tasks',
        href: myTasksIndex(),
        icon: CheckSquare,
    },
    {
        title: 'Search',
        href: taskSearch(),
        icon: Search,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: profileEdit(),
        icon: Settings,
    },
];

export function AppSidebar() {
    const { props } = usePage();

    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;

    return (
        <Sidebar collapsible="icon" variant="inset">
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

                <SidebarMenu className="px-2 py-0">
                    <NotificationSidebarItem />
                </SidebarMenu>

                {currentWorkspace && currentWorkspace.projects.length > 0 && (
                    <SidebarMenu className="px-2 py-0">
                        <SidebarMenuItem>
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Projects
                                </span>
                                <button
                                    type="button"
                                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="New project"
                                    onClick={() =>
                                        router.visit(
                                            projectCreate.url({
                                                workspace:
                                                    currentWorkspace.slug,
                                            }),
                                        )
                                    }
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </div>
                            <SidebarMenuSub className="mr-0 pr-0">
                                {currentWorkspace.projects.map((project) => (
                                    <SidebarMenuSubItem key={project.id}>
                                        <SidebarMenuSubButton asChild>
                                            <button
                                                type="button"
                                                className="group/project flex w-full items-center gap-2"
                                                onClick={() =>
                                                    router.visit(
                                                        projectBoard.url({
                                                            workspace:
                                                                currentWorkspace.slug,
                                                            project:
                                                                project.slug,
                                                        }),
                                                    )
                                                }
                                            >
                                                <div
                                                    className={`flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ${project.color ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                                                    style={
                                                        project.color
                                                            ? {
                                                                  backgroundColor:
                                                                      project.color,
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    {project.key
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <span className="truncate text-sm">
                                                    {project.name}
                                                </span>
                                            </button>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}

                {!currentWorkspace && (
                    <div className="px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Create a workspace to get started with projects and
                            tasks.
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
