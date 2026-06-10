import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    count: number;
}

export function OverdueTasksWidget({ count }: Props) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                {count > 0 && <Badge variant="destructive">{count}</Badge>}
            </CardHeader>
            <CardContent>
                {count === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing overdue. Great job.
                    </p>
                ) : (
                    <div className="flex items-center gap-3">
                        <AlertCircle className="size-5 shrink-0 text-destructive" />
                        <p className="text-sm">
                            <span className="font-semibold text-destructive">
                                {count}
                            </span>{' '}
                            {count === 1 ? 'task is' : 'tasks are'} past due
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function OverdueTasksWidgetSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-8 rounded-md" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}
