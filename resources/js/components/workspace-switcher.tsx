import { router, usePage } from '@inertiajs/react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    create as workspaceCreate,
    switchMethod as switchWorkspaceRoute,
} from '@/routes/workspaces';
import type { CurrentWorkspaceProps, WorkspaceProps } from '@/types/dashboard';

function switchWorkspace(workspaceSlug: string) {
    router.post(
        switchWorkspaceRoute.url(workspaceSlug),
        {},
        { preserveScroll: true },
    );
}

export function WorkspaceSwitcher() {
    const { props } = usePage();
    const workspaces = (props.workspaces as WorkspaceProps[]) ?? [];
    const currentWorkspace =
        props.currentWorkspace as CurrentWorkspaceProps | null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="max-w-[14rem] min-w-0 justify-start border-sidebar-border/60 sm:max-w-[18rem]"
                >
                    <span className="truncate">
                        {currentWorkspace?.name ?? 'Select workspace'}
                    </span>
                    <ChevronDown className="shrink-0 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                {workspaces.length > 0 && (
                    <>
                        <DropdownMenuGroup>
                            {workspaces.map((workspace) => (
                                <DropdownMenuItem
                                    key={workspace.id}
                                    className="cursor-pointer gap-2"
                                    onClick={() =>
                                        switchWorkspace(workspace.slug)
                                    }
                                >
                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                                        {workspace.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">
                                        {workspace.name}
                                    </span>
                                    {currentWorkspace?.id === workspace.id && (
                                        <Check className="text-muted-foreground" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="cursor-pointer gap-2"
                        onClick={() => router.visit(workspaceCreate())}
                    >
                        <Plus />
                        <span>Create workspace</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
