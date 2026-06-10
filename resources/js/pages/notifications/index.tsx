import { Head, router } from '@inertiajs/react';
import {
    Bell,
    CheckCheck,
    MessageSquare,
    Trash2,
    UserPlus,
    ClipboardList,
    CalendarClock,
    GitBranch,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

interface Props {
    notifications: {
        data: NotificationItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    unreadCount: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    task_assigned: ClipboardList,
    task_updated: GitBranch,
    comment_added: MessageSquare,
    member_added: UserPlus,
    due_date_reminder: CalendarClock,
};

const typeLabels: Record<string, string> = {
    task_assigned: 'Task assigned',
    task_updated: 'Task updated',
    comment_added: 'Comment',
    member_added: 'Member added',
    due_date_reminder: 'Due date',
};

function groupByDate(notifications: NotificationItem[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const groups: Record<string, NotificationItem[]> = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        Older: [],
    };

    for (const n of notifications) {
        const date = new Date(n.created_at);
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (d.getTime() === today.getTime()) {
            groups['Today'].push(n);
        } else if (d.getTime() === yesterday.getTime()) {
            groups['Yesterday'].push(n);
        } else if (d >= weekAgo) {
            groups['This Week'].push(n);
        } else {
            groups['Older'].push(n);
        }
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export default function NotificationsIndex({
    notifications,
    unreadCount,
}: Props) {
    const groups = groupByDate(notifications.data);

    return (
        <>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Notifications
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Stay updated on your tasks and projects.
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.post('/notifications/read-all')
                            }
                        >
                            <CheckCheck className="size-4" />
                            <span>Mark all read</span>
                        </Button>
                    )}
                </div>

                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-20">
                        <Bell className="size-12 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-lg font-medium">
                                No notifications
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Notifications about your tasks and projects will
                                appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {groups.map(([label, items]) => (
                            <div key={label}>
                                <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    {label}
                                </h2>
                                <div className="overflow-hidden rounded-lg border">
                                    {items.map((notification) => {
                                        const Icon =
                                            typeIcons[notification.type] ??
                                            Info;

                                        return (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    'flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0',
                                                    !notification.read_at &&
                                                        'bg-muted/30',
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                                                        !notification.read_at
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <Icon className="size-4" />
                                                </div>

                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'text-sm',
                                                                !notification.read_at &&
                                                                    'font-semibold',
                                                            )}
                                                        >
                                                            {notification.title}
                                                        </span>
                                                        {!notification.read_at && (
                                                            <div className="size-2 shrink-0 rounded-full bg-primary" />
                                                        )}
                                                    </div>
                                                    {notification.body && (
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {notification.body}
                                                        </p>
                                                    )}
                                                    <div className="mt-1 flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            {typeLabels[
                                                                notification
                                                                    .type
                                                            ] ??
                                                                notification.type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTimeAgo(
                                                                notification.created_at,
                                                            )}
                                                        </span>
                                                        {!notification.read_at && (
                                                            <button
                                                                type="button"
                                                                className="text-xs text-primary hover:underline"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    router.patch(
                                                                        `/notifications/${notification.id}/read`,
                                                                        undefined,
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.delete(
                                                                    `/notifications/${notification.id}`,
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function formatTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return 'just now';
    }

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
