import { Calendar, Clock3, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TaskSearchResultItem {
    id: number;
    code: string;
    title: string;
    description: string | null;
    status: string;
    due_date: string | null;
    completed_at: string | null;
    archived_at: string | null;
    updated_at: string;
    priority: {
        id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    } | null;
    task_type: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    };
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    } | null;
    reporter: { id: number; name: string; avatar: string | null };
    assignees: Array<{ id: number; name: string; avatar: string | null }>;
    labels: Array<{ id: number; name: string; color: string | null }>;
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
    workspace: { id: number; name: string; slug: string };
}

interface Props {
    task: TaskSearchResultItem;
    onOpen: (task: TaskSearchResultItem) => void;
}

export function TaskSearchResult({ task, onOpen }: Props) {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            data-slot="task-search-result"
            className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50"
            onClick={() => onOpen(task)}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                            {task.code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {task.project.key}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                        >
                            {task.status.replace(/_/g, ' ')}
                        </Badge>
                        {task.archived_at && (
                            <Badge variant="destructive" className="text-xs">
                                {t('task_search.archived')}
                            </Badge>
                        )}
                    </div>

                    <h2 className="mt-2 line-clamp-2 text-base font-semibold">
                        {task.title}
                    </h2>

                    {task.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {task.description}
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                            {task.workspace.name} / {task.project.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <UserRound className="size-3" />
                            {task.assignees.length > 0
                                ? task.assignees
                                      .map((assignee) => assignee.name)
                                      .join(', ')
                                : t('common.none')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3" />
                            Updated {formatDate(task.updated_at)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {task.priority && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs">
                            <span
                                className="size-2 rounded-full"
                                style={{
                                    backgroundColor:
                                        task.priority.color ?? '#94A3B8',
                                }}
                            />
                            {task.priority.name}
                        </span>
                    )}
                    {task.due_date && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground',
                                new Date(task.due_date) < new Date() &&
                                    !task.completed_at &&
                                    'border-destructive/30 text-destructive',
                            )}
                        >
                            <Calendar className="size-3" />
                            {formatDate(task.due_date)}
                        </span>
                    )}
                    {task.labels.map((label) => (
                        <span
                            key={label.id}
                            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs"
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{
                                    backgroundColor: label.color ?? '#94A3B8',
                                }}
                            />
                            {label.name}
                        </span>
                    ))}
                </div>
            </div>
        </button>
    );
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
