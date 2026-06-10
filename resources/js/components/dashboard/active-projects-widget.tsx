import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardProject } from '@/types/dashboard';

interface Props {
    projects: DashboardProject[];
}

export function ActiveProjectsWidget({ projects }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Active projects
                </CardTitle>
            </CardHeader>
            <CardContent>
                {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No active projects yet.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2"
                            >
                                <div
                                    className={cn(
                                        'flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white',
                                    )}
                                    style={{
                                        backgroundColor:
                                            project.color ?? '#64748B',
                                    }}
                                >
                                    {project.key.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="truncate text-sm font-medium">
                                        {project.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {project.tasks_count}{' '}
                                        {project.tasks_count === 1
                                            ? 'task'
                                            : 'tasks'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ActiveProjectsWidgetSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
            </CardContent>
        </Card>
    );
}
