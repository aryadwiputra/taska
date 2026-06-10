import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckSquare,
    ChevronDown,
    LayoutGrid,
    Plus,
    Settings,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { index as notificationsIndex } from '@/routes/my-notifications';
import { index as myTasksIndex } from '@/routes/my-tasks';
import { board as projectBoard } from '@/routes/projects';
import type { NavItem } from '@/types';
import type { CurrentWorkspaceProps, WorkspaceProps } from '@/types/dashboard';

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
        title: 'Notifications',
        href: notificationsIndex(),
        icon: Bell,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
];

function switchWorkspace(workspaceSlug: string) {
    router.post(
        `/workspaces/${workspaceSlug}/switch`,
        {},
        { preserveScroll: true },
    );
}

export function AppSidebar() {
    const { props } = usePage();

    const workspaces = (props.workspaces as WorkspaceProps[]) ?? [];
    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <AppLogo />
                                    {currentWorkspace && (
                                        <span className="truncate font-semibold">
                                            {currentWorkspace.name}
                                        </span>
                                    )}
                                    {!currentWorkspace && (
                                        <span className="font-semibold text-muted-foreground">
                                            Qeerja
                                        </span>
                                    )}
                                    <ChevronDown className="ml-auto size-4 opacity-50" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-[--radix-dropdown-menu-trigger-width]"
                            >
                                {workspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id}
                                        className="cursor-pointer"
                                        onClick={() =>
                                            switchWorkspace(workspace.slug)
                                        }
                                    >
                                        <span className="truncate">
                                            {workspace.name}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                        router.visit('/workspaces/create')
                                    }
                                >
                                    <Plus className="size-4" />
                                    <span>Create workspace</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

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
                                            `/workspaces/${currentWorkspace.slug}/projects/create`,
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
                                                    className="flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold text-white"
                                                    style={{
                                                        backgroundColor:
                                                            project.color ??
                                                            '#64748B',
                                                    }}
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
