import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardActivity } from '@/types/dashboard';

interface Props {
    activities: DashboardActivity[];
}

export function RecentActivityWidget({ activities }: Props) {
    return (
        <Card className="min-h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Recent activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-8">
                        <Activity className="size-8 text-muted-foreground/50" />
                        <p className="text-center text-sm text-muted-foreground">
                            No recent activity yet. Start collaborating on tasks
                            to see updates here.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {activities.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30"
                            >
                                <div className="flex flex-col items-center gap-1 pt-0.5">
                                    <div className="size-2 rounded-full bg-muted-foreground/40" />
                                    {index < activities.length - 1 && (
                                        <div className="w-px flex-1 bg-border" />
                                    )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <p className="text-sm">
                                        {item.description ?? item.action}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimeAgo(item.created_at)}
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

function formatTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return 'just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentActivityWidgetSkeleton() {
    return (
        <Card className="min-h-full">
            <CardHeader>
                <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="flex flex-col">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5">
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                            <Skeleton className="size-2 rounded-full" />
                            {i < 5 && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
