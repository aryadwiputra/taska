import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-top-bar';
import { useDashboardTour } from '@/components/tour/use-dashboard-tour';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();
    const isDashboard = url === '/dashboard' || url === '/';

    useDashboardTour(isDashboard);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppTopBar breadcrumbs={breadcrumbs} />
                <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
