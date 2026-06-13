import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppTopBar({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border/50 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SidebarTrigger className="-ml-1" />
            <WorkspaceSwitcher />
            <div className="ml-auto hidden min-w-0 items-center md:flex">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
