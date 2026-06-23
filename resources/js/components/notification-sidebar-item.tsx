import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSocketEvent } from '@/hooks/use-socket';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { index as notificationsIndex } from '@/routes/my-notifications';
import type { Auth } from '@/types/auth';

interface NotificationEvent {
    type: string;
    title: string;
    body: string;
    task_code: string;
    project_slug: string;
    notification_id: string | null;
    task_id: number | null;
}

export function NotificationSidebarItem() {
    const { t } = useTranslation();
    const { props } = usePage();
    const auth = props.auth as Auth;
    const initialUnread = auth?.notifications?.unreadCount ?? 0;
    const userId = auth?.user?.id;
    const workspaceSlug = (props.currentWorkspace as { slug: string } | null)
        ?.slug;

    const [unreadCount, setUnreadCount] = useState(initialUnread);

    useSocketEvent(
        userId ? `user.${userId}` : null,
        'notification',
        (e: NotificationEvent) => {
            setUnreadCount((prev) => prev + 1);

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

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                tooltip={{ children: t('sidebar.notifications') }}
            >
                <Link href={notificationsIndex()} prefetch className="relative">
                    <Bell />
                    <span>{t('sidebar.notifications')}</span>
                    {unreadCount > 0 && (
                        <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
