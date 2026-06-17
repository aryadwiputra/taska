'use no memo';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar as CalendarIcon, GanttChart } from 'lucide-react';
import { useState } from 'react';
import { CalendarView } from '@/components/calendar-view';
import { GanttChart as GanttChartComponent } from '@/components/gantt-chart';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Button } from '@/components/ui/button';
import { show as projectShow } from '@/routes/projects';

interface UserRef {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskRow {
    id: number;
    code: string;
    title: string;
    status: string;
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
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
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    assignees: UserRef[];
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
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

interface Props {
    workspace: Workspace;
    project: ProjectData;
    tasks: TaskRow[];
}

export default function TimelineIndex({ workspace, project, tasks }: Props) {
    const [timelineView, setTimelineView] = useState<'gantt' | 'calendar'>(
        'gantt',
    );
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <Head title={`Timeline — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">Timeline</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Timeline
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''}{' '}
                            with dates
                        </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border p-0.5">
                        <Button
                            type="button"
                            variant={
                                timelineView === 'gantt' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            onClick={() => setTimelineView('gantt')}
                        >
                            <GanttChart className="size-4" />
                            <span>Gantt</span>
                        </Button>
                        <Button
                            type="button"
                            variant={
                                timelineView === 'calendar'
                                    ? 'secondary'
                                    : 'ghost'
                            }
                            size="sm"
                            onClick={() => setTimelineView('calendar')}
                        >
                            <CalendarIcon className="size-4" />
                            <span>Calendar</span>
                        </Button>
                    </div>
                </div>

                {timelineView === 'gantt' ? (
                    <GanttChartComponent
                        tasks={tasks}
                        onTaskClick={(id) => {
                            setDrawerTaskId(id);
                            setDrawerOpen(true);
                        }}
                    />
                ) : (
                    <CalendarView
                        tasks={tasks}
                        onTaskClick={(id) => {
                            setDrawerTaskId(id);
                            setDrawerOpen(true);
                        }}
                    />
                )}
            </div>

            <TaskDetailDrawer
                workspaceSlug={workspace.slug}
                projectSlug={project.slug}
                taskId={drawerTaskId}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
            />
        </>
    );
}
