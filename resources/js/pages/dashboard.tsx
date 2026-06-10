import { Head } from '@inertiajs/react';
import { ActiveProjectsWidget } from '@/components/dashboard/active-projects-widget';
import { AssignedTasksWidget } from '@/components/dashboard/assigned-tasks-widget';
import { OverdueTasksWidget } from '@/components/dashboard/overdue-tasks-widget';
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget';
import { UpcomingDeadlinesWidget } from '@/components/dashboard/upcoming-deadlines-widget';
import { dashboard } from '@/routes';
import type {
    DashboardActivity,
    DashboardDeadline,
    DashboardProject,
    DashboardStats,
    DashboardTask,
} from '@/types/dashboard';

interface Props {
    stats: DashboardStats;
    assignedTasks: DashboardTask[];
    activeProjects: DashboardProject[];
    upcomingDeadlines: DashboardDeadline[];
    recentActivity: DashboardActivity[];
}

export default function Dashboard({
    stats,
    assignedTasks,
    activeProjects,
    upcomingDeadlines,
    recentActivity,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of your tasks and projects.
                    </p>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <AssignedTasksWidget
                        tasks={assignedTasks}
                        total={stats.assigned}
                    />
                    <OverdueTasksWidget count={stats.overdue} />
                    <ActiveProjectsWidget projects={activeProjects} />
                    <UpcomingDeadlinesWidget deadlines={upcomingDeadlines} />
                </div>

                <RecentActivityWidget activities={recentActivity} />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
