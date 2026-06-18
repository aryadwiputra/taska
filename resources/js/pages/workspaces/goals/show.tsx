'use no memo';

import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Plus,
    Target,
    Calendar,
    Trash2,
    Check,
    Clock,
    Circle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface KeyResult {
    id: number;
    title: string;
    status: string;
    current_value: number;
    target_value: number;
    progress: number;
}

interface Epic {
    id: number;
    name: string;
    color: string | null;
    status: string;
    project: {
        id: number;
        name: string;
        key: string;
    };
}

interface Goal {
    id: number;
    title: string;
    description: string | null;
    status: string;
    target_date: string | null;
    progress: number;
    key_results: KeyResult[];
    epics: Epic[];
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
    goal: Goal;
}

export default function GoalShow({ workspace, goal: initialGoal }: Props) {
    const { t } = useTranslation();
    const [goal, setGoal] = useState<Goal>(initialGoal);
    const [showAddKeyResult, setShowAddKeyResult] = useState(false);
    const [newKeyResult, setNewKeyResult] = useState({
        title: '',
        target_value: '100',
    });
    const [editingKR, setEditingKR] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ current_value: string }>({
        current_value: '',
    });

    const handleAddKeyResult = (e: React.FormEvent) => {
        e.preventDefault();

        fetch(`/workspaces/${workspace.slug}/goals/${goal.id}/key-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({
                title: newKeyResult.title,
                target_value: Number(newKeyResult.target_value),
            }),
        })
            .then((r) => r.json())
            .then((kr) => {
                setGoal({
                    ...goal,
                    key_results: [...goal.key_results, kr],
                    progress: calculateProgress([...goal.key_results, kr]),
                });
                setShowAddKeyResult(false);
                setNewKeyResult({ title: '', target_value: '100' });
            });
    };

    const handleUpdateKeyResult = (kr: KeyResult) => {
        fetch(
            `/workspaces/${workspace.slug}/goals/${goal.id}/key-results/${kr.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    current_value: Number(editValues.current_value),
                }),
            },
        )
            .then((r) => r.json())
            .then((updatedKR) => {
                const updatedKRs = goal.key_results.map((k) =>
                    k.id === kr.id ? updatedKR : k,
                );
                setGoal({
                    ...goal,
                    key_results: updatedKRs,
                    progress: calculateProgress(updatedKRs),
                });
                setEditingKR(null);
            });
    };

    const handleDeleteKeyResult = (krId: number) => {
        if (!confirm(t('goal.delete_key_result'))) {
            return;
        }

        fetch(
            `/workspaces/${workspace.slug}/goals/${goal.id}/key-results/${krId}`,
            {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            },
        ).then(() => {
            const updatedKRs = goal.key_results.filter((k) => k.id !== krId);
            setGoal({
                ...goal,
                key_results: updatedKRs,
                progress: calculateProgress(updatedKRs),
            });
        });
    };

    const calculateProgress = (keyResults: KeyResult[]) => {
        const total = keyResults.reduce((sum, kr) => sum + kr.target_value, 0);
        const current = keyResults.reduce(
            (sum, kr) => sum + kr.current_value,
            0,
        );

        return total > 0 ? Math.round((current / total) * 100) : 0;
    };

    const statusColors: Record<string, string> = {
        active: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-gray-100 text-gray-700',
        not_started: 'bg-gray-100 text-gray-700',
        in_progress: 'bg-blue-100 text-blue-700',
        achieved: 'bg-green-100 text-green-700',
    };

    const statusIcons: Record<string, React.ReactNode> = {
        not_started: <Circle className="size-3" />,
        in_progress: <Clock className="size-3" />,
        achieved: <Check className="size-3" />,
    };

    return (
        <>
            <Head title={`${goal.title} — Goals`} />

            <div className="flex h-full flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/workspaces/${workspace.slug}/goals`}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{t('goal.title')}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">{goal.title}</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {goal.title}
                            </h1>
                            {goal.description && (
                                <p className="mt-2 text-muted-foreground">
                                    {goal.description}
                                </p>
                            )}
                            <div className="mt-3 flex items-center gap-3">
                                <Badge className={statusColors[goal.status]}>
                                    {goal.status}
                                </Badge>
                                {goal.target_date && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="size-4" />
                                        {t('goal.target')}{' '}
                                        {new Date(
                                            goal.target_date,
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{t('goal.overall_progress')}</span>
                            <span className="font-medium text-foreground">
                                {goal.progress}%
                            </span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${goal.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {t('goal.key_results')}
                            </h2>
                            <Dialog
                                open={showAddKeyResult}
                                onOpenChange={setShowAddKeyResult}
                            >
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-2 size-4" />
                                        Add Key Result
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add Key Result
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form
                                        onSubmit={handleAddKeyResult}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>{t('goal.title_label')}</Label>
                                            <Input
                                                value={newKeyResult.title}
                                                onChange={(e) =>
                                                    setNewKeyResult({
                                                        ...newKeyResult,
                                                        title: e.target.value,
                                                    })
                                                }
                                                placeholder={t('goal.placeholder_key_result')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>{t('goal.target_value')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={
                                                    newKeyResult.target_value
                                                }
                                                onChange={(e) =>
                                                    setNewKeyResult({
                                                        ...newKeyResult,
                                                        target_value:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setShowAddKeyResult(false)
                                                }
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    !newKeyResult.title.trim()
                                                }
                                            >
                                                {t('common.add')}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="mt-4 space-y-3">
                            {goal.key_results.map((kr) => (
                                <Card key={kr.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={
                                                            statusColors[
                                                                kr.status
                                                            ]
                                                        }
                                                    >
                                                        {statusIcons[kr.status]}
                                                        {kr.status.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </Badge>
                                                    <span className="font-medium">
                                                        {kr.title}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {kr.current_value} /{' '}
                                                            {kr.target_value}
                                                        </span>
                                                        <span>
                                                            {kr.progress}%
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 h-2 rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${kr.progress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingKR === kr.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={
                                                                kr.target_value
                                                            }
                                                            value={
                                                                editValues.current_value
                                                            }
                                                            onChange={(e) =>
                                                                setEditValues({
                                                                    current_value:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            className="w-24"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleUpdateKeyResult(
                                                                    kr,
                                                                )
                                                            }
                                                        >
                                                            {t('common.save')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setEditingKR(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            {t('common.cancel')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingKR(kr.id);
                                                            setEditValues({
                                                                current_value:
                                                                    String(
                                                                        kr.current_value,
                                                                    ),
                                                            });
                                                        }}
                                                    >
                                                        {t('common.update')}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        handleDeleteKeyResult(
                                                            kr.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {goal.key_results.length === 0 && (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    <Target className="mx-auto size-8 text-muted-foreground/50" />
                                    <p className="mt-2">
                                        {t('goal.no_key_results')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold">{t('goal.linked_epics')}</h2>
                        <div className="mt-4 space-y-2">
                            {goal.epics.map((epic) => (
                                <div
                                    key={epic.id}
                                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                                >
                                    <div
                                        className="size-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                epic.color ?? '#64748b',
                                        }}
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">
                                            {epic.name}
                                        </span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {epic.project.key}
                                        </span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {epic.status}
                                    </Badge>
                                </div>
                            ))}

                            {goal.epics.length === 0 && (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    <p>{t('goal.no_epics_linked')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
