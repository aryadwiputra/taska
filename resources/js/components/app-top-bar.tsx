import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppTopBar({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/85">
            <SidebarTrigger className="-ml-1" />
            <WorkspaceSwitcher />
            <div className="ml-auto hidden min-w-0 items-center md:flex">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <ThemeToggle className="ml-2 shrink-0" />
        </header>
    );
}
