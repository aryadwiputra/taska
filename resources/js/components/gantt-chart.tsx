import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TaskSummary {
    id: number;
    code: string;
    title: string;
    status: string;
    start_date: string | null;
    due_date: string | null;
    priority: { key: string; color: string | null } | null;
    related_tasks?: Array<{
        id: number;
        code: string;
        title: string;
        status: string;
        relation_type: string;
    }>;
}

interface TaskRelation {
    from_id: number;
    to_id: number;
    type: string;
}

const DAY_WIDTH = 30;
const ROW_HEIGHT = 36;
const SIDEBAR_WIDTH = 240;
const HEADER_HEIGHT = 44;

const statusColors: Record<string, string> = {
    todo: 'bg-blue-400 dark:bg-blue-500',
    'in-progress': 'bg-amber-400 dark:bg-amber-500',
    done: 'bg-emerald-400 dark:bg-emerald-500',
    cancelled: 'bg-gray-400 dark:bg-gray-500',
};

function toDate(s: string | null): Date | null {
    if (!s) {
        return null;
    }

    const d = new Date(s);

    return isNaN(d.getTime()) ? null : d;
}

function diffDays(a: Date, b: Date): number {
    return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

interface GanttChartProps {
    tasks: TaskSummary[];
    onTaskClick: (taskId: number) => void;
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);

    const relations = useMemo<TaskRelation[]>(() => {
        const rels: TaskRelation[] = [];
        const seen = new Set<string>();

        for (const task of tasks) {
            for (const rel of task.related_tasks ?? []) {
                const key = `${task.id}-${rel.id}`;
                const reverseKey = `${rel.id}-${task.id}`;

                if (!seen.has(key) && !seen.has(reverseKey)) {
                    seen.add(key);
                    rels.push({
                        from_id: task.id,
                        to_id: rel.id,
                        type: rel.relation_type,
                    });
                }
            }
        }

        return rels;
    }, [tasks]);

    const { rangeStart, rangeEnd, totalDays, todayOffset } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let min = new Date(now.getFullYear(), now.getMonth(), 1);
        min.setDate(min.getDate() - 7);
        let max = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        max.setDate(max.getDate() + 7);

        for (const t of tasks) {
            const s = toDate(t.start_date);
            const e = toDate(t.due_date);

            if (s && s < min) {
                min = new Date(s);
            }

            if (e && e > max) {
                max = new Date(e);
            }
        }

        const total = Math.max(diffDays(max, min) + 1, 1);
        const today = diffDays(now, min);

        return {
            rangeStart: min,
            rangeEnd: max,
            totalDays: total,
            todayOffset: today,
        };
    }, [tasks]);

    const months = useMemo(() => {
        const list: Array<{ label: string; left: number; width: number }> = [];
        const cursor = new Date(rangeStart);

        while (cursor <= rangeEnd) {
            const days = daysInMonth(cursor.getFullYear(), cursor.getMonth());
            const monthStart = new Date(
                cursor.getFullYear(),
                cursor.getMonth(),
                1,
            );

            if (monthStart < rangeStart) {
                const offset = diffDays(rangeStart, monthStart);
                const remaining = days - offset;
                list.push({
                    label: cursor.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                    }),
                    left: 0,
                    width: remaining * DAY_WIDTH,
                });
            } else {
                const left = diffDays(monthStart, rangeStart) * DAY_WIDTH;
                list.push({
                    label: cursor.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                    }),
                    left,
                    width: days * DAY_WIDTH,
                });
            }

            cursor.setMonth(cursor.getMonth() + 1);
        }

        return list;
    }, [rangeStart, rangeEnd]);

    const rows = useMemo(() => {
        return tasks
            .filter((t) => toDate(t.start_date) || toDate(t.due_date))
            .sort((a, b) => {
                const sa = toDate(a.start_date)?.getTime() ?? 0;
                const sb = toDate(b.start_date)?.getTime() ?? 0;

                return sa - sb || a.code.localeCompare(b.code);
            });
    }, [tasks]);

    const totalWidth = totalDays * DAY_WIDTH;

    return (
        <div className="overflow-hidden rounded-md border">
            <div className="flex">
                <div
                    className="shrink-0 border-r bg-muted/30"
                    style={{ width: SIDEBAR_WIDTH }}
                >
                    <div
                        className="flex items-end border-b px-3 font-medium text-muted-foreground"
                        style={{ height: HEADER_HEIGHT }}
                    >
                        <span className="text-xs">{t('gantt.tasks')}</span>
                    </div>
                    {rows.map((task) => (
                        <button
                            key={task.id}
                            type="button"
                            onClick={() => onTaskClick(task.id)}
                            className="flex w-full items-center gap-2 border-b px-3 text-left text-sm transition-colors hover:bg-muted/50"
                            style={{ height: ROW_HEIGHT }}
                        >
                            <span className="min-w-0 flex-1 truncate font-medium">
                                {task.title}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                {task.code}
                            </span>
                        </button>
                    ))}
                </div>
                <div ref={scrollRef} className="overflow-x-auto">
                    <div
                        className="relative"
                        style={{ width: totalWidth, minWidth: '100%' }}
                    >
                        <div
                            className="sticky top-0 z-10 border-b bg-muted/30"
                            style={{ height: HEADER_HEIGHT }}
                        >
                            {months.map((m) => (
                                <div
                                    key={m.label}
                                    className="absolute top-0 flex items-end border-r px-2 pb-1"
                                    style={{
                                        left: m.left,
                                        width: m.width,
                                        height: HEADER_HEIGHT,
                                    }}
                                >
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {m.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div>
                            {rows.map((task) => {
                                const s = toDate(task.start_date);
                                const e = toDate(task.due_date);
                                const left = s
                                    ? diffDays(s, rangeStart) * DAY_WIDTH
                                    : e
                                      ? diffDays(e, rangeStart) * DAY_WIDTH
                                      : 0;
                                const barWidth =
                                    s && e
                                        ? Math.max(
                                              (diffDays(e, s) + 1) * DAY_WIDTH,
                                              4,
                                          )
                                        : 4;
                                const barColor =
                                    statusColors[task.status] ?? 'bg-primary';

                                return (
                                    <div
                                        key={task.id}
                                        className="relative border-b"
                                        style={{ height: ROW_HEIGHT }}
                                    >
                                        <div
                                            className={cn(
                                                'absolute top-1/2 h-5 -translate-y-1/2 rounded-sm px-1',
                                                barColor,
                                            )}
                                            style={{
                                                left: `${left}px`,
                                                width: `${barWidth}px`,
                                                minWidth: '4px',
                                            }}
                                        >
                                            {barWidth > 40 && (
                                                <span className="block truncate px-1 text-[10px] leading-5 font-medium text-white">
                                                    {task.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {todayOffset >= 0 && todayOffset < totalDays && (
                            <div
                                className="pointer-events-none absolute top-0 w-px bg-red-500"
                                style={{
                                    left: `${todayOffset * DAY_WIDTH}px`,
                                    height: `${(rows.length + 1) * ROW_HEIGHT}px`,
                                }}
                            />
                        )}
                        {relations.length > 0 && (
                            <svg
                                className="pointer-events-none absolute top-0 left-0"
                                style={{
                                    width: totalWidth,
                                    height: (rows.length + 1) * ROW_HEIGHT,
                                }}
                            >
                                <defs>
                                    <marker
                                        id="arrow-blocks"
                                        viewBox="0 0 10 10"
                                        refX="9"
                                        refY="5"
                                        markerWidth="6"
                                        markerHeight="6"
                                        orient="auto-start-auto"
                                    >
                                        <path
                                            d="M 0 0 L 10 5 L 0 10 z"
                                            fill="#ef4444"
                                        />
                                    </marker>
                                    <marker
                                        id="arrow-relates"
                                        viewBox="0 0 10 10"
                                        refX="9"
                                        refY="5"
                                        markerWidth="6"
                                        markerHeight="6"
                                        orient="auto-start-auto"
                                    >
                                        <path
                                            d="M 0 0 L 10 5 L 0 10 z"
                                            fill="#9ca3af"
                                        />
                                    </marker>
                                </defs>
                                {relations.map((rel, idx) => {
                                    const fromIdx = rows.findIndex(
                                        (r) => r.id === rel.from_id,
                                    );
                                    const toIdx = rows.findIndex(
                                        (r) => r.id === rel.to_id,
                                    );

                                    if (fromIdx < 0 || toIdx < 0) {
                                        return null;
                                    }

                                    const fromTask = rows[fromIdx];
                                    const toTask = rows[toIdx];
                                    const fromDate = toDate(
                                        fromTask.start_date,
                                    );
                                    const fromEnd = toDate(fromTask.due_date);
                                    const toDate_ = toDate(toTask.start_date);
                                    const toEnd = toDate(toTask.due_date);

                                    const fromX =
                                        (fromDate
                                            ? diffDays(fromDate, rangeStart)
                                            : toEnd
                                              ? diffDays(toEnd, rangeStart)
                                              : 0) *
                                            DAY_WIDTH +
                                        (fromDate && fromEnd
                                            ? Math.max(
                                                  (diffDays(fromEnd, fromDate) +
                                                      1) *
                                                      DAY_WIDTH,
                                                  4,
                                              ) / 2
                                            : 2);
                                    const fromY =
                                        fromIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                                    const toX = toDate_
                                        ? diffDays(toDate_, rangeStart) *
                                              DAY_WIDTH -
                                          8
                                        : toEnd
                                          ? diffDays(toEnd, rangeStart) *
                                                DAY_WIDTH -
                                            8
                                          : 0;
                                    const toY =
                                        toIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                                    const midX = (fromX + toX) / 2;

                                    const isBlocking =
                                        rel.type === 'blocks' ||
                                        rel.type === 'blocked_by';
                                    const color = isBlocking
                                        ? '#ef4444'
                                        : '#9ca3af';
                                    const dashArray = isBlocking
                                        ? 'none'
                                        : '4 4';
                                    const markerEnd = isBlocking
                                        ? 'url(#arrow-blocks)'
                                        : 'url(#arrow-relates)';

                                    return (
                                        <path
                                            key={idx}
                                            d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="1.5"
                                            strokeDasharray={dashArray}
                                            markerEnd={markerEnd}
                                        />
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                </div>
            </div>
            {rows.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    {t('gantt.no_tasks')}
                </div>
            )}
        </div>
    );
}
