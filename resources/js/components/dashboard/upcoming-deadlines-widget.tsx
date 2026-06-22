import { CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardDeadline } from '@/types/dashboard';

interface Props {
    deadlines: DashboardDeadline[];
}

const priorityIndicator: Record<number, string> = {
    1: 'bg-gray-400 dark:bg-gray-500',
    2: 'bg-blue-400 dark:bg-blue-500',
    3: 'bg-amber-400 dark:bg-amber-500',
    4: 'bg-orange-400 dark:bg-orange-500',
    5: 'bg-red-400 dark:bg-red-500',
};

export function UpcomingDeadlinesWidget({ deadlines }: Props) {
    const { t } = useTranslation();

    return (
        <Card className="min-h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    {t('widget.upcoming_deadlines')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {deadlines.length === 0 ? (
                    <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                        {t('widget.no_upcoming_deadlines')}
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {deadlines.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted/30"
                            >
                                <div
                                    className={cn(
                                        'size-2 shrink-0 rounded-full',
                                        item.priority_id
                                            ? (priorityIndicator[
                                                  item.priority_id
                                              ] ?? 'bg-muted-foreground')
                                            : 'bg-muted-foreground',
                                    )}
                                />
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="truncate text-sm font-medium">
                                        {item.title}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {item.code}
                                    </span>
                                </div>
                                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {formatRelativeDate(item.due_date, t)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatRelativeDate(
    date: string,
    translate: (key: string, options?: Record<string, unknown>) => string,
): string {
    const now = new Date();
    const due = new Date(date);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return translate('common.today');
    }

    if (diffDays === 1) {
        return translate('common.tomorrow');
    }

    if (diffDays <= 7) {
        return translate('common.in_days', { count: diffDays });
    }

    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function UpcomingDeadlinesWidgetSkeleton() {
    return (
        <Card className="min-h-full">
            <CardHeader>
                <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
            </CardContent>
        </Card>
    );
}
