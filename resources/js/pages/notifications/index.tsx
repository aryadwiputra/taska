import { Head, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    AtSign,
    Bell,
    CalendarClock,
    CheckCheck,
    ClipboardList,
    GitBranch,
    Info,
    MessageSquare,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    readAll as notificationReadAll,
    read as notificationRead,
    destroy as notificationDestroy,
} from '@/routes/my-notifications';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

interface StreamedNotification {
    type: string;
    title: string;
    body: string;
    task_code: string;
    project_slug: string;
    notification_id: string | null;
    task_id: number | null;
}

interface Props {
    notifications: {
        data: NotificationItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    unreadCount: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'task.assigned': ClipboardList,
    'task.updated': GitBranch,
    'task.commented': MessageSquare,
    'task.mentioned': AtSign,
    'member.added': UserPlus,
    due_date_reminder: CalendarClock,
};

const typeI18nKeys: Record<string, string> = {
    'task.assigned': 'notification.type_task_assigned',
    'task.updated': 'notification.type_task_updated',
    'task.commented': 'notification.type_comment',
    'task.mentioned': 'notification.type_mention',
    'member.added': 'notification.type_member_added',
    due_date_reminder: 'notification.type_due_date',
};

const taskRoute = (
    workspaceSlug: string,
    notification: NotificationItem,
): string | null => {
    const data = notification.data as Record<string, unknown> | null;

    if (!data?.project_slug || !data?.task_id) {
        return null;
    }

    return `/${workspaceSlug}/projects/${data.project_slug}/tasks/${data.task_id}`;
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
    notifications: initialNotifications,
    unreadCount: initialUnreadCount,
}: Props) {
    const { t } = useTranslation();
    const { props } = usePage();
    const workspaceSlug = (props.currentWorkspace as { slug: string } | null)
        ?.slug;
    const userId = (props.auth as { user: { id: number } })?.user?.id;

    const [notifications, setNotifications] = useState(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

    useEcho(
        userId ? `private-user.${userId}` : '',
        '.notification',
        (e: StreamedNotification) => {
            if (!e.notification_id) {
                return;
            }

            setUnreadCount((prev) => prev + 1);

            const newItem: NotificationItem = {
                id: e.notification_id,
                type: e.type,
                title: e.title,
                body: e.body,
                data: {
                    project_slug: e.project_slug,
                    task_id: e.task_id,
                    task_code: e.task_code,
                },
                read_at: null,
                created_at: new Date().toISOString(),
            };

            setNotifications((prev) => ({
                ...prev,
                data: [newItem, ...prev.data].slice(0, 60),
            }));
        },
    );

    const groups = groupByDate(notifications.data);

    const handleRowClick = (notification: NotificationItem) => {
        if (!workspaceSlug) {
            return;
        }

        const route = taskRoute(workspaceSlug, notification);

        if (route) {
            if (!notification.read_at) {
                router.patch(
                    notificationRead({ notification: notification.id }),
                    undefined,
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            router.visit(route);
                        },
                    },
                );
            } else {
                router.visit(route);
            }
        }
    };

    return (
        <>
            <Head title={t('notification.notifications')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('notification.notifications')}
                    description={t('notification.description')}
                    actions={
                        unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    router.post(
                                        notificationReadAll(),
                                        undefined,
                                        {
                                            onSuccess: () => setUnreadCount(0),
                                        },
                                    );
                                }}
                            >
                                <CheckCheck className="size-4" />
                                <span>{t('notification.mark_all_read_short')}</span>
                            </Button>
                        )
                    }
                />

                {notifications.data.length === 0 ? (
                    <EmptyState
                        icon={Bell}
                        title={t('notification.empty_title')}
                        description={t('notification.empty_description')}
                        className="py-20"
                    />
                ) : (
                    <div className="flex flex-col gap-6">
                        {groups.map(([label, items]) => (
                            <div key={label}>
                                <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    {label === 'Today' ? t('common.today') : label === 'Yesterday' ? t('notification.group_yesterday') : label === 'This Week' ? t('notification.group_this_week') : t('notification.group_older')}
                                </h2>
                                <div className="overflow-hidden rounded-lg border">
                                    {items.map((notification) => {
                                        const Icon =
                                            typeIcons[notification.type] ??
                                            Info;

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() =>
                                                    handleRowClick(notification)
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        e.preventDefault();
                                                        handleRowClick(
                                                            notification,
                                                        );
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className={cn(
                                                    'flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50',
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
                                                            {t(typeI18nKeys[
                                                                notification
                                                                    .type
                                                            ] ??
                                                                notification.type)}
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
                                                                        notificationRead(
                                                                            {
                                                                                notification:
                                                                                    notification.id,
                                                                            },
                                                                        ),
                                                                        undefined,
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess:
                                                                                () => {
                                                                                    setNotifications(
                                                                                        (
                                                                                            prev,
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            data: prev.data.map(
                                                                                                (
                                                                                                    n,
                                                                                                ) =>
                                                                                                    n.id ===
                                                                                                    notification.id
                                                                                                        ? {
                                                                                                              ...n,
                                                                                                              read_at:
                                                                                                                  new Date().toISOString(),
                                                                                                          }
                                                                                                        : n,
                                                                                            ),
                                                                                        }),
                                                                                    );
                                                                                    setUnreadCount(
                                                                                        (
                                                                                            prev,
                                                                                        ) =>
                                                                                            Math.max(
                                                                                                0,
                                                                                                prev -
                                                                                                    1,
                                                                                            ),
                                                                                    );
                                                                                },
                                                                        },
                                                                    );
                                                                }}
                                                             >
                                                                 {t('notification.mark_read')}
                                                             </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.delete(
                                                                     notificationDestroy(notification.id),
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () => {
                                                                                setNotifications(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        data: prev.data.filter(
                                                                                            (
                                                                                                n,
                                                                                            ) =>
                                                                                                n.id !==
                                                                                                notification.id,
                                                                                        ),
                                                                                    }),
                                                                                );
                                                                            },
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
