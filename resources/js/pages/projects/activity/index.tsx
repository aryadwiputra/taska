import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { show as projectShow } from '@/routes/projects';
import { index as activityIndex } from '@/routes/projects/activity';
import { show as taskShow } from '@/routes/projects/tasks';

interface UserRef {
    id: number;
    name: string;
    avatar: string | null;
}

interface ActivityItem {
    id: number;
    action: string;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    task: {
        id: number;
        code: string;
        title: string;
    };
    user: UserRef | null;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface ProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
    color: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    activities: {
        data: ActivityItem[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: PaginationLink[];
    };
    filters: {
        action?: string;
        user_id?: string;
    };
    actions: string[];
    members: Array<{ id: number; name: string; avatar: string | null }>;
}

export default function ActivityIndex({
    workspace,
    project,
    activities: initialActivities,
    filters,
    actions,
    members,
}: Props) {
    const { t } = useTranslation();
    const [activities, setActivities] = useState(initialActivities);

    useEffect(() => {
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        setActivities(initialActivities);
    }, [initialActivities]);

    useEcho(
        `private-project.${project.id}`,
        '.activity.logged',
        (e: {
            id: number;
            action: string;
            task_id: number;
            task_code: string;
            user_id: number;
            user_name: string;
            created_at: string;
        }) => {
            if (activities.current_page !== 1) {
                return;
            }

            const newItem: ActivityItem = {
                id: e.id,
                action: e.action,
                field_name: null,
                old_value: null,
                new_value: null,
                created_at: e.created_at,
                task: { id: e.task_id, code: e.task_code, title: '' },
                user: { id: e.user_id, name: e.user_name, avatar: null },
            };

            setActivities((prev) => ({
                ...prev,
                data: [newItem, ...prev.data].slice(0, 30),
                total: prev.total + 1,
                from: prev.from ?? 1,
                to: Math.min((prev.to ?? 0) + 1, prev.total + 1),
            }));
        },
        [project.id, activities.current_page],
    );

    const updateFilter = (key: string, value: string) => {
        router.get(
            activityIndex({ workspace: workspace.slug, project: project.slug }),
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const goToPage = (pageUrl: string | null) => {
        if (!pageUrl) {
            return;
        }

        router.get(
            pageUrl,
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title={`${t('task.activity')} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                    <PageHeader
                        title="Activity log"
                        description="All changes made to tasks in this project."
                        backHref={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        backLabel={project.name}
                    />

                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Action:
                            </span>
                            <Select
                                value={filters.action ?? 'all'}
                                onValueChange={(value) =>
                                    updateFilter('action', value)
                                }
                            >
                                <SelectTrigger className="h-8 w-40 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All actions
                                    </SelectItem>
                                    {actions.map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {formatActionLabel(action)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                User:
                            </span>
                            <Select
                                value={filters.user_id ?? 'all'}
                                onValueChange={(value) =>
                                    updateFilter('user_id', value)
                                }
                            >
                                <SelectTrigger className="h-8 w-40 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All users
                                    </SelectItem>
                                    {members.map((member) => (
                                        <SelectItem
                                            key={member.id}
                                            value={String(member.id)}
                                        >
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-5" />
                                {t('task.activity')}
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({activities.total} total)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activities.data.length > 0 ? (
                                <div className="flex flex-col">
                                    {activities.data.map((item, i) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 py-3"
                                        >
                                            <div className="flex flex-col items-center gap-1 pt-0.5">
                                                <div className="size-2 rounded-full bg-muted-foreground/30" />
                                                {i <
                                                    activities.data.length -
                                                        1 && (
                                                    <div className="w-px flex-1 bg-border" />
                                                )}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <p className="text-sm">
                                                    {item.user && (
                                                        <span className="font-medium">
                                                            {item.user.name}
                                                        </span>
                                                    )}{' '}
                                                    {formatAction(
                                                        item.action,
                                                        item.field_name,
                                                        item.old_value,
                                                        item.new_value,
                                                    )}{' '}
                                                    <Link
                                                        href={taskShow({
                                                            workspace:
                                                                workspace.slug,
                                                            project:
                                                                project.slug,
                                                            task: item.task.id,
                                                        })}
                                                        className="font-mono text-xs text-muted-foreground underline-offset-2 hover:underline"
                                                    >
                                                        {item.task.code}
                                                    </Link>
                                                </p>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimeAgo(
                                                        item.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Activity}
                                    title="No activity yet"
                                    description="Activity will appear here when tasks are created or updated."
                                    className="border-0 bg-transparent py-12"
                                />
                            )}

                            {activities.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {activities.from}–
                                        {activities.to} of {activities.total}
                                    </p>
                                    <div className="flex gap-2">
                                        {activities.links
                                            .filter(
                                                (link) =>
                                                    !link.label.includes(
                                                        'Previous',
                                                    ) &&
                                                    !link.label.includes(
                                                        'Next',
                                                    ),
                                            )
                                            .map((link) => (
                                                <Button
                                                    key={link.label}
                                                    variant={
                                                        link.active
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() =>
                                                        goToPage(link.url)
                                                    }
                                                >
                                                    {link.label}
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function formatAction(
    action: string,
    field: string | null,
    oldVal: string | null,
    newVal: string | null,
): string {
    switch (action) {
        case 'created':
            return 'created';
        case 'status_changed':
            return `changed status from "${oldVal}" to "${newVal}" on`;
        case 'priority_changed':
            return `changed priority from "${oldVal}" to "${newVal}" on`;
        case 'due_date_changed':
            return `changed due date from "${oldVal}" to "${newVal}" on`;
        case 'parent_changed':
            return `changed parent from "${oldVal ?? 'none'}" to "${newVal ?? 'none'}" on`;
        case 'assigned':
            return `assigned ${newVal} on`;
        case 'unassigned':
            return `unassigned ${oldVal} on`;
        case 'watcher_added':
            return `added watcher ${newVal} on`;
        case 'watcher_removed':
            return `removed watcher ${oldVal} on`;
        case 'relation_added':
            return `added ${newVal ?? 'relation'} on`;
        case 'relation_removed':
            return 'removed relation on';
        case 'epic_changed':
            return `changed epic from "${oldVal ?? 'none'}" to "${newVal ?? 'none'}" on`;
        case 'sprint_changed':
            return `changed sprint from "${oldVal ?? 'none'}" to "${newVal ?? 'none'}" on`;
        case 'updated':
            return field ? `updated ${field} on` : 'updated';
        default:
            return `${action.replace(/_/g, ' ')} on`;
    }
}

function formatActionLabel(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

    return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
