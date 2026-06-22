import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    count: number;
}

export function OverdueTasksWidget({ count }: Props) {
    const { t } = useTranslation();

    return (
        <Card className="min-h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                    {t('widget.overdue')}
                </CardTitle>
                {count > 0 && <Badge variant="destructive">{count}</Badge>}
            </CardHeader>
            <CardContent>
                {count === 0 ? (
                    <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                        {t('widget.nothing_overdue')}
                    </p>
                ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3">
                        <AlertCircle className="size-5 shrink-0 text-destructive" />
                        <p className="text-sm">
                            <span className="font-semibold text-destructive">
                                {count}
                            </span>{' '}
                            {t(
                                count === 1
                                    ? 'overdue_widget.task_past_due'
                                    : 'overdue_widget.tasks_past_due',
                                { count },
                            )}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function OverdueTasksWidgetSkeleton() {
    return (
        <Card className="min-h-full">
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
