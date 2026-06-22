'use no memo';

import { Head, router } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { show as projectShow } from '@/routes/projects';
import { updateCapacity } from '@/routes/projects/workload';

interface Sprint {
    id: number;
    name: string;
    status: string;
    committed_points: number | null;
}

interface SprintWorkload {
    id: number;
    name: string;
    status: string;
    total: number;
    completed: number;
    story_points: number;
}

interface MemberWorkload {
    id: number;
    name: string;
    avatar: string | null;
    capacity_hours: number | null;
    total_tasks: number;
    completed_tasks: number;
    total_story_points: number;
    completed_story_points: number;
    by_sprint: SprintWorkload[];
    unscheduled_count: number;
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
    members: MemberWorkload[];
    sprints: Sprint[];
}

export default function WorkloadPage({
    workspace,
    project,
    members,
    sprints,
}: Props) {
    const { t } = useTranslation();
    const [editingMember, setEditingMember] = useState<MemberWorkload | null>(
        null,
    );
    const [capacityInput, setCapacityInput] = useState('');

    const openCapacityDialog = (member: MemberWorkload) => {
        setEditingMember(member);
        setCapacityInput(String(member.capacity_hours ?? ''));
    };

    const saveCapacity = () => {
        if (!editingMember) {
            return;
        }

        router.put(
            updateCapacity.url({
                workspace: workspace.slug,
                project: project.slug,
            }),
            {
                user_id: editingMember.id,
                capacity_hours: capacityInput ? Number(capacityInput) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingMember(null),
            },
        );
    };

    return (
        <>
            <Head title={t('workload.page_title', { name: project.name })} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('workload.title')}
                    description={t('workload.description')}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                />

                <div className="mx-auto w-full max-w-4xl">
                    {sprints.length > 0 && (
                        <div className="mb-6">
                            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                                Active Sprints
                            </h2>
                            <div className="flex gap-3">
                                {sprints.map((sprint) => (
                                    <Badge
                                        key={sprint.id}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {sprint.name}
                                        {sprint.committed_points != null &&
                                            ` (${sprint.committed_points} pts)`}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {members.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {members.map((member) => {
                                const percent =
                                    member.total_tasks === 0
                                        ? 0
                                        : Math.round(
                                              (member.completed_tasks /
                                                  member.total_tasks) *
                                                  100,
                                          );

                                return (
                                    <Card key={member.id}>
                                        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarImage
                                                        src={
                                                            member.avatar ??
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {member.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-sm">
                                                        {member.name}
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.total_tasks}{' '}
                                                        tasks
                                                        {member.capacity_hours !=
                                                            null &&
                                                            ` · ${member.capacity_hours}h/week`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() =>
                                                    openCapacityDialog(member)
                                                }
                                            >
                                                Edit capacity
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="mb-3">
                                                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        {member.completed_tasks}
                                                        /{member.total_tasks}{' '}
                                                        completed
                                                    </span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{
                                                            width: `${percent}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {member.total_story_points > 0 && (
                                                <div className="mb-3 text-xs text-muted-foreground">
                                                    Story points:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {
                                                            member.completed_story_points
                                                        }
                                                        /
                                                        {
                                                            member.total_story_points
                                                        }
                                                    </span>
                                                </div>
                                            )}

                                            {member.by_sprint.length > 0 && (
                                                <div className="mb-3 flex flex-col gap-1.5">
                                                    {member.by_sprint.map(
                                                        (sprint) => (
                                                            <div
                                                                key={sprint.id}
                                                                className="flex items-center justify-between text-xs"
                                                            >
                                                                <span className="text-muted-foreground">
                                                                    {
                                                                        sprint.name
                                                                    }
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {
                                                                        sprint.completed
                                                                    }
                                                                    /
                                                                    {
                                                                        sprint.total
                                                                    }{' '}
                                                                    tasks
                                                                    {sprint.story_points >
                                                                        0 &&
                                                                        ` · ${sprint.story_points} pts`}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                            {member.unscheduled_count > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {member.unscheduled_count}{' '}
                                                    unscheduled tasks
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title={t('workload.empty_title')}
                            description={t('workload.empty_description')}
                        />
                    )}
                </div>
            </div>

            <Dialog
                open={!!editingMember}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingMember(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit capacity — {editingMember?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="capacity-hours">
                            Weekly capacity (hours)
                        </Label>
                        <Input
                            id="capacity-hours"
                            type="number"
                            min={0}
                            placeholder="e.g. 40"
                            value={capacityInput}
                            onChange={(e) => setCapacityInput(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty for no capacity limit.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingMember(null)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={saveCapacity}>
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
