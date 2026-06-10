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
    1: 'border-l-gray-400',
    2: 'border-l-blue-400',
    3: 'border-l-amber-400',
    4: 'border-l-orange-400',
    5: 'border-l-red-400',
};

export function AssignedTasksWidget({ tasks, total }: Props) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                    Assigned to you
                </CardTitle>
                {total > 0 && <Badge variant="secondary">{total}</Badge>}
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tasks assigned to you yet.
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    'flex flex-col gap-1 rounded-md border-l-2 bg-muted/40 px-3 py-2',
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
        <Card>
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
