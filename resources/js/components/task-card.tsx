import { Calendar, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Assignee {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskData {
    id: number;
    task_number: number;
    code: string;
    title: string;
    status: string;
    position: number;
    due_date: string | null;
    priority: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    } | null;
    task_type: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    };
    story_points?: number | null;
    assignees: Assignee[];
    epics?: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints?: Array<{
        id: number;
        name: string;
        status: string;
    }>;
    is_blocked?: boolean;
    blocked_by?: Array<{
        id: number;
        code: string;
        title: string;
    }>;
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

export function TaskCard({
    task,
    isDragging,
    onClick,
}: {
    task: TaskData;
    isDragging?: boolean;
    onClick?: () => void;
}) {
    const { t } = useTranslation();
    const priorityColor = task.priority
        ? (priorityColors[task.priority.key] ?? 'bg-muted-foreground')
        : 'bg-muted-foreground';

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-shadow hover:shadow-md',
                isDragging && 'opacity-80 shadow-md ring-2 ring-primary/20',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                    {task.code}
                </span>
                <div className="flex items-center gap-2">
                    {task.is_blocked && (
                        <div
                            className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5"
                            title={
                                task.blocked_by
                                    ? `${t('task.blocked_by')}: ${task.blocked_by.map((b) => b.code).join(', ')}`
                                    : t('task.blocked')
                            }
                        >
                            <ShieldAlert className="size-3 text-red-500" />
                            <span className="text-[10px] font-medium text-red-500">
                                {t('task.blocked_short')}
                            </span>
                        </div>
                    )}
                    {task.story_points != null && (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {task.story_points}
                        </span>
                    )}
                    <div
                        className={cn(
                            'size-2 shrink-0 rounded-full',
                            priorityColor,
                        )}
                    />
                </div>
            </div>

            <p className="line-clamp-2 text-sm leading-snug font-medium">
                {task.title}
            </p>

            {((task.epics?.length ?? 0) > 0 ||
                (task.sprints?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1">
                    {task.epics?.slice(0, 1).map((epic) => (
                        <span
                            key={epic.id}
                            className="inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={{
                                borderColor: epic.color ?? undefined,
                                color: epic.color ?? undefined,
                            }}
                        >
                            <span
                                className="size-1.5 rounded-full"
                                style={{
                                    backgroundColor: epic.color ?? '#64748b',
                                }}
                            />
                            <span className="truncate">{epic.name}</span>
                        </span>
                    ))}
                    {task.sprints?.slice(0, 1).map((sprint) => (
                        <span
                            key={sprint.id}
                            className="inline-flex max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                            {sprint.name}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    {task.assignees.slice(0, 3).map((a) => (
                        <div
                            key={a.id}
                            className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
                            title={a.name}
                        >
                            {a.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {task.assignees.length > 3 && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                            +{task.assignees.length - 3}
                        </div>
                    )}
                </div>

                {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>{formatDueDate(task.due_date, t)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatDueDate(
    date: string,
    t: (key: string, options?: Record<string, unknown>) => string,
): string {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
        return t('common.days_overdue', { count: Math.abs(days) });
    }

    if (days === 0) {
        return t('common.today');
    }

    if (days === 1) {
        return t('common.tomorrow');
    }

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
