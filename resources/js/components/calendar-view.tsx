import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { cn } from '@/lib/utils';

interface CalendarTaskRef {
    id: number;
    code: string;
    title: string;
    status: string;
    due_date: string | null;
}

interface CalendarViewProps {
    tasks: CalendarTaskRef[];
    onTaskClick: (taskId: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const statusDot: Record<string, string> = {
    todo: 'bg-blue-400',
    'in-progress': 'bg-amber-400',
    done: 'bg-emerald-400',
    cancelled: 'bg-gray-400',
};

function getMonthDays(year: number, month: number): (Date | null)[] {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) {
        cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(new Date(year, month, d));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

function toDate(s: string | null): Date | null {
    if (!s) {
        return null;
    }

    const d = new Date(s);

    return isNaN(d.getTime()) ? null : d;
}

function CalendarViewInner({ tasks, onTaskClick }: CalendarViewProps) {
    const { t } = useTranslation();
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);

        return d;
    }, []);

    const [currentDate, setCurrentDate] = useState(() => new Date(today));

    const days = useMemo(
        () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
        [currentDate],
    );

    const tasksByDate = useMemo(() => {
        const map = new Map<string, CalendarTaskRef[]>();

        for (const task of tasks) {
            const d = toDate(task.due_date);

            if (!d) {
                continue;
            }

            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

            if (!map.has(key)) {
                map.set(key, []);
            }

            map.get(key)!.push(task);
        }

        return map;
    }, [tasks]);

    const prevMonth = () =>
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

    const nextMonth = () =>
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const goToday = () => setCurrentDate(new Date(today));

    return (
        <div className="rounded-md border">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">
                    {formatMonthYear(currentDate)}
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToday}
                    >
                        {t('calendar.today')}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-7">
                {WEEKDAYS.map((wd) => (
                    <div
                        key={wd}
                        className="border-r border-b px-2 py-2 text-xs font-medium text-muted-foreground last:border-r-0"
                    >
                        {wd}
                    </div>
                ))}
                {days.map((day, i) => {
                    const isToday = day && isSameDay(day, today);
                    const isOtherMonth =
                        day && day.getMonth() !== currentDate.getMonth();

                    const key = day
                        ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
                        : `empty-${i}`;
                    const dayTasks = day
                        ? (tasksByDate.get(
                              `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
                          ) ?? [])
                        : [];

                    return (
                        <div
                            key={key}
                            className={cn(
                                'min-h-24 border-r border-b p-1.5 last:border-r-0',
                                isOtherMonth && 'bg-muted/20',
                            )}
                        >
                            <div className="mb-1 flex items-center justify-center">
                                <span
                                    className={cn(
                                        'inline-flex size-6 items-center justify-center rounded-full text-xs',
                                        isToday &&
                                            'bg-primary font-semibold text-primary-foreground',
                                        !isToday &&
                                            isOtherMonth &&
                                            'text-muted-foreground',
                                    )}
                                >
                                    {day?.getDate() ?? ''}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {dayTasks.slice(0, 3).map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => onTaskClick(task.id)}
                                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] transition-colors hover:bg-muted"
                                    >
                                        <span
                                            className={cn(
                                                'size-1.5 shrink-0 rounded-full',
                                                statusDot[task.status] ??
                                                    'bg-muted-foreground',
                                            )}
                                        />
                                        <span className="truncate">
                                            {task.title}
                                        </span>
                                    </button>
                                ))}
                                {dayTasks.length > 3 && (
                                    <span className="px-1 text-[10px] text-muted-foreground">
                                        {t('calendar.more', {
                                            count: dayTasks.length - 3,
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CalendarViewWithBoundary(props: CalendarViewProps) {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-12 text-center text-card-foreground shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Calendar could not be loaded
                    </p>
                </div>
            }
        >
            <CalendarViewInner {...props} />
        </ErrorBoundary>
    );
}

export { CalendarViewWithBoundary as CalendarView };
