'use no memo';

import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';

interface SprintData {
    id: number;
    name: string;
    goal: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    committed_points: number | null;
    completed_at: string | null;
    tasks_count: number;
    completed_tasks_count: number;
    total_points: number;
    completed_points: number;
}

interface BurndownPoint {
    date: string;
    remaining: number;
    ideal: number;
}

interface StatusCount {
    key: string;
    count: number;
}

interface AssigneeCount {
    user: { id: number; name: string; avatar: string | null } | null;
    total: number;
    completed: number;
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
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    sprint: SprintData;
    burndown: { data: BurndownPoint[] };
    byStatus: StatusCount[];
    byAssignee: AssigneeCount[];
}

const sprintStatusColor: Record<string, string> = {
    planned: 'border-blue-400 text-blue-400 dark:text-blue-300',
    active: 'border-emerald-400 text-emerald-400 dark:text-emerald-300',
    completed: 'border-gray-400 text-gray-400 dark:text-gray-300',
    cancelled: 'border-red-400 text-red-400 dark:text-red-300',
};

export default function SprintReport({
    workspace,
    project,
    sprint,
    burndown,
    byStatus,
    byAssignee,
}: Props) {
    const percent =
        sprint.tasks_count === 0
            ? 0
            : Math.round(
                  (sprint.completed_tasks_count / sprint.tasks_count) * 100,
              );

    return (
        <>
            <Head title={`Report: ${sprint.name} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="mx-auto w-full max-w-4xl">
                    <PageHeader
                        title={sprint.name}
                        description={`${formatDate(sprint.start_date)} — ${formatDate(sprint.end_date)}`}
                        backHref={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        backLabel={project.name}
                        badge={
                            <Badge
                                variant="outline"
                                className={cn(
                                    sprintStatusColor[sprint.status] ?? '',
                                )}
                            >
                                {sprint.status}
                            </Badge>
                        }
                    />

                    <div className="mb-6 grid gap-4 sm:grid-cols-4">
                        <SummaryCard
                            label="Tasks"
                            value={`${sprint.completed_tasks_count}/${sprint.tasks_count}`}
                        />
                        <SummaryCard label="Completion" value={`${percent}%`} />
                        <SummaryCard
                            label="Story Points"
                            value={
                                sprint.total_points > 0
                                    ? `${sprint.completed_points}/${sprint.total_points}`
                                    : '—'
                            }
                        />
                        <SummaryCard
                            label="Committed Points"
                            value={sprint.committed_points ?? '—'}
                        />
                    </div>

                    {sprint.goal && (
                        <p className="mb-6 text-sm text-muted-foreground">
                            Goal: {sprint.goal}
                        </p>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Burndown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {burndown.data.length > 0 ? (
                                    <BurndownChart data={burndown.data} />
                                ) : (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No burndown data available.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tasks by Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {byStatus.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {byStatus.map((item) => (
                                            <div
                                                key={item.key}
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-sm capitalize">
                                                    {item.key.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </span>
                                                <Badge variant="secondary">
                                                    {item.count}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No tasks in this sprint.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Tasks by Assignee</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {byAssignee.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {byAssignee.map((item) => (
                                            <div
                                                key={
                                                    item.user?.id ??
                                                    'unassigned'
                                                }
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-sm">
                                                    {item.user?.name ??
                                                        'Unassigned'}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.completed}/
                                                        {item.total} completed
                                                    </span>
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{
                                                                width: `${
                                                                    item.total ===
                                                                    0
                                                                        ? 0
                                                                        : Math.round(
                                                                              (item.completed /
                                                                                  item.total) *
                                                                                  100,
                                                                          )
                                                                }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No tasks in this sprint.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}

function BurndownChart({ data }: { data: BurndownPoint[] }) {
    const padding = { top: 20, right: 16, bottom: 32, left: 40 };
    const width = 500;
    const height = 220;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(
        ...data.map((d) => d.remaining),
        ...data.map((d) => d.ideal),
        1,
    );

    const xScale = (index: number) =>
        padding.left + (index / Math.max(data.length - 1, 1)) * chartW;
    const yScale = (val: number) =>
        padding.top + chartH - (val / maxVal) * chartH;

    const yTicks = [0, Math.round(maxVal / 2), maxVal];

    const actualPoints = data
        .map((d, i) => `${xScale(i)},${yScale(d.remaining)}`)
        .join(' ');
    const idealPoints = data
        .map((d, i) => `${xScale(i)},${yScale(d.ideal)}`)
        .join(' ');

    const labelStep = Math.max(Math.ceil(data.length / 7), 1);

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-full"
            style={{ fontFamily: 'monospace' }}
        >
            <line
                x1={padding.left}
                y1={padding.top + chartH}
                x2={padding.left + chartW}
                y2={padding.top + chartH}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
            />
            <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + chartH}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
            />

            {yTicks.map((tick) => (
                <g key={tick}>
                    <line
                        x1={padding.left}
                        y1={yScale(tick)}
                        x2={padding.left + chartW}
                        y2={yScale(tick)}
                        stroke="currentColor"
                        className="text-muted/60"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />
                    <text
                        x={padding.left - 6}
                        y={yScale(tick) + 3}
                        textAnchor="end"
                        className="fill-muted-foreground"
                        fontSize={10}
                    >
                        {tick}
                    </text>
                </g>
            ))}

            <polyline
                points={idealPoints}
                fill="none"
                stroke="currentColor"
                className="text-muted-foreground/40"
                strokeWidth={1.5}
                strokeDasharray="6 3"
            />
            <polyline
                points={actualPoints}
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth={2}
            />

            {data
                .filter((_, i) => i % labelStep === 0)
                .map((d) => {
                    const idx = data.indexOf(d);

                    return (
                        <text
                            key={d.date}
                            x={xScale(idx)}
                            y={padding.top + chartH + 16}
                            textAnchor="middle"
                            className="fill-muted-foreground"
                            fontSize={8}
                        >
                            {d.date.slice(5)}
                        </text>
                    );
                })}
        </svg>
    );
}

function formatDate(date: string | null): string {
    if (!date) {
        return 'Not set';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
