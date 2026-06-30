import { Link } from '@inertiajs/react';
import { Clock, Flag, Layout, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { settings as workspaceSettings } from '@/routes/workspaces';
import { board as crossBoard, timeline as crossTimeline } from '@/routes/workspaces/cross-project';
import { index as goalsIndex } from '@/routes/workspaces/goals';

interface Props {
    workspaceSlug: string;
}

export function NavWorkspace({ workspaceSlug }: Props) {
    const { t } = useTranslation();
    const { isCurrentUrl } = useCurrentUrl();

    const items = [
        {
            title: t('sidebar.settings'),
            href: workspaceSettings({ workspace: workspaceSlug }).url,
            icon: Settings,
        },
        {
            title: t('sidebar.goals'),
            href: goalsIndex({ workspace: workspaceSlug }).url,
            icon: Flag,
        },
        {
            title: t('sidebar.cross_board'),
            href: crossBoard({ workspace: workspaceSlug }).url,
            icon: Layout,
        },
        {
            title: t('sidebar.cross_timeline'),
            href: crossTimeline({ workspace: workspaceSlug }).url,
            icon: Clock,
        },
    ];

    return (
        <SidebarMenu className="px-2 py-0">
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(item.href)}
                        tooltip={{ children: item.title }}
                    >
                        <Link href={item.href} prefetch>
                            <item.icon />
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
