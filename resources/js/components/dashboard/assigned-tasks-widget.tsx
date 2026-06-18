import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardTask } from '@/types/dashboard';

interface Props {
    tasks: DashboardTask[];
    total: number;
}

const priorityColor: Record<number, string> = {
    1: 'border-l-gray-400 dark:border-l-gray-500',
    2: 'border-l-blue-400 dark:border-l-blue-500',
    3: 'border-l-amber-400 dark:border-l-amber-500',
    4: 'border-l-orange-400 dark:border-l-orange-500',
    5: 'border-l-red-400 dark:border-l-red-500',
};

export function AssignedTasksWidget({ tasks, total }: Props) {
    const { t } = useTranslation();

    return (
        <Card className="min-h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                    {t('widget.assigned_to_you')}
                </CardTitle>
                {total > 0 && <Badge variant="secondary">{total}</Badge>}
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                        {t('widget.no_assigned_tasks')}
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    'flex flex-col gap-1 rounded-md border border-l-2 border-border bg-card px-3 py-2 transition-colors hover:bg-muted/30',
                                    task.priority_id
                                        ? (priorityColor[task.priority_id] ??
                                              'border-l-muted')
                                        : 'border-l-muted',
                                )}
                            >
                                <span className="truncate text-sm font-medium">
                                    {task.title}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono">
                                        {task.code}
                                    </span>
                                    {task.project && (
                                        <>
                                            <span>·</span>
                                            <span>{task.project.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function AssignedTasksWidgetSkeleton() {
    return (
        <Card className="min-h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-8 rounded-md" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
            </CardContent>
        </Card>
    );
}
