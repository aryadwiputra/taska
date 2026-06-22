'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Target,
    Calendar,
    MoreHorizontal,
    Trash2,
    Pencil,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { show as workspaceShow } from '@/routes/workspaces';

interface Goal {
    id: number;
    title: string;
    description: string | null;
    status: string;
    target_date: string | null;
    progress: number;
    key_results_count: number;
    epics_count: number;
    created_at: string;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
    goals: Goal[];
}

export default function GoalsIndex({ workspace, goals: initialGoals }: Props) {
    const { t } = useTranslation();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        target_date: '',
    });

    const handleCreateGoal = (e: React.FormEvent) => {
        e.preventDefault();

        router.post(
            `/workspaces/${workspace.slug}/goals`,
            {
                title: newGoal.title,
                description: newGoal.description || null,
                target_date: newGoal.target_date || null,
            },
            {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    setNewGoal({ title: '', description: '', target_date: '' });
                },
            },
        );
    };

    const handleDeleteGoal = (goalId: number) => {
        if (!confirm(t('goal.delete_goal'))) {
            return;
        }

        router.delete(`/workspaces/${workspace.slug}/goals/${goalId}`);
    };

    const statusColors: Record<string, string> = {
        active: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-gray-100 text-gray-700',
    };

    return (
        <>
            <Head title={`${t('goal.title')} — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('goal.title')}
                    description={t('goal.description')}
                    backHref={workspaceShow({ workspace: workspace.slug })}
                    backLabel={workspace.name}
                    actions={
                        <Dialog
                            open={showCreateDialog}
                            onOpenChange={setShowCreateDialog}
                        >
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    {t('goal.new_goal')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {t('goal.create_goal')}
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={handleCreateGoal}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label>{t('goal.title_label')}</Label>
                                        <Input
                                            value={newGoal.title}
                                            onChange={(e) =>
                                                setNewGoal({
                                                    ...newGoal,
                                                    title: e.target.value,
                                                })
                                            }
                                            placeholder={t(
                                                'goal.placeholder_title',
                                            )}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>{t('task.description')}</Label>
                                        <textarea
                                            value={newGoal.description}
                                            onChange={(e) =>
                                                setNewGoal({
                                                    ...newGoal,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder={t(
                                                'goal.placeholder_description',
                                            )}
                                            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>{t('task.due_date')}</Label>
                                        <Input
                                            type="date"
                                            value={newGoal.target_date}
                                            onChange={(e) =>
                                                setNewGoal({
                                                    ...newGoal,
                                                    target_date: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setShowCreateDialog(false)
                                            }
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={!newGoal.title.trim()}
                                        >
                                            {t('common.create')}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    }
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {initialGoals.map((goal) => (
                        <Card key={goal.id} className="relative">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <Link
                                        href={`/workspaces/${workspace.slug}/goals/${goal.id}`}
                                        className="flex-1"
                                    >
                                        <h3 className="font-medium hover:underline">
                                            {goal.title}
                                        </h3>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/workspaces/${workspace.slug}/goals/${goal.id}`}
                                                >
                                                    <Pencil className="mr-2 size-4" />
                                                    {t('common.edit')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() =>
                                                    handleDeleteGoal(goal.id)
                                                }
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                {t('common.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {goal.description && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {goal.description}
                                    </p>
                                )}

                                <div className="mt-3 flex items-center gap-2">
                                    <Badge
                                        className={statusColors[goal.status]}
                                    >
                                        {goal.status}
                                    </Badge>
                                    {goal.target_date && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="size-3" />
                                            {new Date(
                                                goal.target_date,
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{t('goal.progress')}</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{
                                                width: `${goal.progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Target className="size-3" />
                                        {goal.key_results_count}{' '}
                                        {t('goal.key_results_count')}
                                    </span>
                                    <span>
                                        {goal.epics_count}{' '}
                                        {t('goal.epics_count')}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {initialGoals.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <Target className="mx-auto size-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-medium">
                                {t('goal.no_goals')}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('goal.create_first')}
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() => setShowCreateDialog(true)}
                            >
                                <Plus className="mr-2 size-4" />
                                {t('goal.new_goal')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
