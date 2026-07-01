import { router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    FolderKanban,
    Layers,
    ListTodo,
    Plus,
    Settings,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    canCreateProject,
    canAccessProjectSettings,
    toastNoAccess,
} from '@/lib/permissions';
import {
    board as projectBoard,
    create as projectCreate,
    settings as projectSettings,
} from '@/routes/projects';
import { index as backlogIndex } from '@/routes/projects/backlog';
import { index as epicsIndex } from '@/routes/projects/epics';
import { index as sprintsIndex } from '@/routes/projects/sprints';
import type { CurrentWorkspaceProps } from '@/types/dashboard';

export function NavProjects() {
    const { t } = useTranslation();
    const { props } = usePage();
    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    if (!currentWorkspace) {
        return null;
    }

    const toggle = (projectId: number) => {
        setExpanded((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    const subItems = (slug: string) => [
        {
            title: t('sidebar.board'),
            href: projectBoard({
                workspace: currentWorkspace.slug,
                project: slug,
            }).url,
            icon: FolderKanban,
        },
        {
            title: t('sidebar.backlog'),
            href: backlogIndex({
                workspace: currentWorkspace.slug,
                project: slug,
            }).url,
            icon: ListTodo,
        },
        {
            title: t('sidebar.epics'),
            href: epicsIndex({
                workspace: currentWorkspace.slug,
                project: slug,
            }).url,
            icon: Layers,
        },
        {
            title: t('sidebar.sprints'),
            href: sprintsIndex({
                workspace: currentWorkspace.slug,
                project: slug,
            }).url,
            icon: Timer,
        },
        {
            title: t('sidebar.settings'),
            href: projectSettings({
                workspace: currentWorkspace.slug,
                project: slug,
            }).url,
            icon: Settings,
            requiresSettings: true as const,
        },
    ];

    return (
        <SidebarMenu className="px-2 py-0">
            <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-1">
                    <span className="min-w-0 truncate text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('sidebar.projects')}
                    </span>
                    <button
                        type="button"
                        className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={t('sidebar.new_project')}
                        onClick={() => {
                            if (!canCreateProject(currentWorkspace.role)) {
                                toastNoAccess();

                                return;
                            }

                            router.visit(
                                projectCreate.url({
                                    workspace: currentWorkspace.slug,
                                }),
                            );
                        }}
                    >
                        <Plus className="size-3.5" />
                    </button>
                </div>

                {currentWorkspace.projects.length > 0 ? (
                    <SidebarMenuSub className="mr-0 pr-0 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:!block group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:px-1">
                        {currentWorkspace.projects.map((project) => {
                            const isOpen = expanded[project.id] ?? false;

                            return (
                                <SidebarMenuSubItem key={project.id}>
                                    <div className="relative">
                                        <SidebarMenuSubButton asChild>
                                            <button
                                                type="button"
                                                className="group/project flex w-full items-center gap-2 group-data-[collapsible=icon]:!flex"
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
                                        <button
                                            type="button"
                                            className="absolute top-1/2 right-0 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors group-data-[collapsible=icon]:hidden hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle(project.id);
                                            }}
                                        >
                                            <ChevronDown
                                                className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>
                                    {isOpen && (
                                        <SidebarMenuSub className="pl-4">
                                            {subItems(project.slug).map(
                                                (item) => (
                                                    <SidebarMenuSubItem
                                                        key={item.title}
                                                    >
                                                        <SidebarMenuSubButton
                                                            asChild
                                                        >
                                                            <button
                                                                type="button"
                                                                className="flex w-full items-center gap-2"
                                                                onClick={() => {
                                                                    if (
                                                                        item.requiresSettings &&
                                                                        !canAccessProjectSettings(
                                                                            project.userRole,
                                                                        )
                                                                    ) {
                                                                        toastNoAccess();

                                                                        return;
                                                                    }

                                                                    router.visit(
                                                                        item.href,
                                                                    );
                                                                }}
                                                            >
                                                                <item.icon className="size-3.5" />
                                                                <span className="truncate text-xs">
                                                                    {item.title}
                                                                </span>
                                                            </button>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ),
                                            )}
                                        </SidebarMenuSub>
                                    )}
                                </SidebarMenuSubItem>
                            );
                        })}
                    </SidebarMenuSub>
                ) : (
                    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed px-3 py-4">
                        <FolderKanban className="size-6 text-muted-foreground/40" />
                        <p className="text-center text-xs text-muted-foreground">
                            {t('sidebar.no_projects')}
                        </p>
                        <button
                            type="button"
                            className="text-xs font-medium text-primary transition-colors hover:underline"
                            onClick={() => {
                                if (!canCreateProject(currentWorkspace.role)) {
                                    toastNoAccess();

                                    return;
                                }

                                router.visit(
                                    projectCreate.url({
                                        workspace: currentWorkspace.slug,
                                    }),
                                );
                            }}
                        >
                            {t('sidebar.create_first_project')}
                        </button>
                    </div>
                )}
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
