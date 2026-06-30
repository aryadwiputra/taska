import { router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocketEvent } from '@/hooks/use-socket';
import { index as notificationsIndex } from '@/routes/my-notifications';
import type { Auth } from '@/types/auth';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

interface NotificationEvent {
    type: string;
    title: string;
    body: string;
    task_code: string;
    project_slug: string;
    notification_id: string | null;
    task_id: number | null;
}

const TYPE_ICONS: Record<string, string> = {
    'task.assigned': '👤',
    'task.updated': '✏️',
    'task.commented': '💬',
    'task.mentioned': '📣',
    'member.added': '➕',
    due_date_reminder: '⏰',
};

function formatTimeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

    if (seconds < 60) {
        return 'just now';
    }

    if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m ago`;
    }

    if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    if (seconds < 604800) {
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function NotificationDropdown() {
    const { t } = useTranslation();
    const { props } = usePage();
    const auth = props.auth as Auth;
    const initialUnread = auth?.notifications?.unreadCount ?? 0;
    const userId = auth?.user?.id;
    const workspaceSlug = (props.currentWorkspace as { slug: string } | null)
        ?.slug;
    const [open, setOpen] = useState(false);

    const [unreadCount, setUnreadCount] = useState(initialUnread);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    const fetchRecent = useCallback(() => {
        fetch('/api/notifications/recent', { credentials: 'include' })
            .then((r) => r.json())
            .then(
                (data: {
                    notifications: NotificationItem[];
                    unread_count: number;
                }) => {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unread_count);
                    fetchedRef.current = true;
                },
            )
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(true);
            fetchRecent();
        }
    }, [open, fetchRecent]);

    useEffect(() => {
        if (!open) {
            fetchedRef.current = false;
        }
    }, [open]);

    useSocketEvent(
        userId ? `user.${userId}` : null,
        'notification',
        (e: NotificationEvent) => {
            setUnreadCount((prev) => prev + 1);

            if (fetchedRef.current) {
                setNotifications((prev) => [
                    {
                        id: e.notification_id ?? crypto.randomUUID(),
                        type: e.type,
                        title: e.title,
                        body: e.body,
                        data: null,
                        read_at: null,
                        created_at: new Date().toISOString(),
                    },
                    ...prev.slice(0, 4),
                ]);
            }

            const taskRoute =
                workspaceSlug && e.task_id
                    ? `/${workspaceSlug}/projects/${e.project_slug}/tasks/${e.task_id}`
                    : null;

            toast(e.title, {
                description: e.body,
                action: taskRoute
                    ? {
                          label: 'View',
                          onClick: () => router.visit(taskRoute),
                      }
                    : undefined,
                duration: 5000,
            });
        },
        [userId, workspaceSlug],
    );

    const handleClick = (item: NotificationItem) => {
        if (!workspaceSlug) {
            return;
        }

        fetch(`/notifications/${item.id}/read`, {
            method: 'PATCH',
            headers: {
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        });

        if (!item.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === item.id
                        ? { ...n, read_at: new Date().toISOString() }
                        : n,
                ),
            );
        }

        const data = item.data as Record<string, unknown> | undefined;
        const taskId = data?.task_id ?? data?.taskId;
        const projectSlug = data?.project_slug ?? data?.projectSlug;

        if (taskId && projectSlug) {
            router.visit(
                `/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`,
            );
        } else {
            router.visit(notificationsIndex());
        }
    };

    const handleMarkAllRead = () => {
        fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        }).then(() => {
            setUnreadCount(0);
            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                })),
            );
        });
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-[18px]" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold">
                        {t('notification.notifications')}
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-0.5 text-xs"
                            onClick={handleMarkAllRead}
                        >
                            {t('notification.mark_all_read_short')}
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-muted-foreground">
                            {t('common.loading')}
                        </span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <Bell className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            {t('notification.no_notifications')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="max-h-72 overflow-y-auto">
                            {notifications.map((item) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    className="flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        handleClick(item);
                                    }}
                                >
                                    <div className="flex w-full items-start gap-2">
                                        <span className="mt-0.5 shrink-0 text-sm">
                                            {TYPE_ICONS[item.type] ?? '📌'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`truncate text-sm ${!item.read_at ? 'font-semibold' : ''}`}
                                            >
                                                {item.title}
                                            </p>
                                            {item.body && (
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {item.body}
                                                </p>
                                            )}
                                        </div>
                                        {!item.read_at && (
                                            <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="pl-6 text-[11px] text-muted-foreground">
                                        {formatTimeAgo(item.created_at)}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer justify-center text-sm text-muted-foreground"
                            onSelect={(e) => {
                                e.preventDefault();
                                router.visit(notificationsIndex());
                            }}
                        >
                            {t('notification.view_all')}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
