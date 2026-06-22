import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store as taskStore } from '@/routes/projects/tasks';

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    taskTypes: Array<{
        id: number;
        name: string;
        key: string;
        color: string | null;
    }>;
    priorities: Array<{ id: number; name: string; key: string; level: number }>;
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
        start_date: string | null;
        end_date: string | null;
    }>;
    onCreated?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const NO_PRIORITY_VALUE = 'none';
const NO_EPIC_VALUE = 'none';
const NO_SPRINT_VALUE = 'none';

export function TaskCreateDialog({
    workspaceSlug,
    projectSlug,
    taskTypes,
    priorities,
    epics = [],
    sprints = [],
    onCreated,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: Props) {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;
    const [title, setTitle] = useState('');
    const [taskTypeId, setTaskTypeId] = useState<string>(
        taskTypes[0]?.id?.toString() ?? '',
    );
    const [priorityId, setPriorityId] = useState<string>(NO_PRIORITY_VALUE);
    const [epicId, setEpicId] = useState<string>(NO_EPIC_VALUE);
    const [sprintId, setSprintId] = useState<string>(NO_SPRINT_VALUE);

    const create = () => {
        if (!title.trim() || !taskTypeId) {
            return;
        }

        router.post(
            taskStore.url({ workspace: workspaceSlug, project: projectSlug }),
            {
                title: title.trim(),
                task_type_id: Number(taskTypeId),
                priority_id:
                    priorityId !== NO_PRIORITY_VALUE
                        ? Number(priorityId)
                        : undefined,
                epic_ids:
                    epicId !== NO_EPIC_VALUE ? [Number(epicId)] : undefined,
                sprint_ids:
                    sprintId !== NO_SPRINT_VALUE
                        ? [Number(sprintId)]
                        : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTitle('');
                    setEpicId(NO_EPIC_VALUE);
                    setSprintId(NO_SPRINT_VALUE);
                    onCreated?.();
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="size-3.5" />
                    <span>{t('task.new_task')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('task.create_task')}</DialogTitle>
                    <DialogDescription>
                        {t('task.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="task-title">{t('task.title')}</Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('task.task_title')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    create();
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('task.type')}</Label>
                        <Select
                            value={taskTypeId}
                            onValueChange={setTaskTypeId}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t(
                                        'task.select_type_placeholder',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {taskTypes.map((taskType) => (
                                    <SelectItem
                                        key={taskType.id}
                                        value={taskType.id.toString()}
                                    >
                                        {taskType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('task.priority')}</Label>
                        <Select
                            value={priorityId}
                            onValueChange={setPriorityId}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t('task.no_priority')}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_PRIORITY_VALUE}>
                                    {t('common.none')}
                                </SelectItem>
                                {priorities.map((p) => (
                                    <SelectItem
                                        key={p.id}
                                        value={p.id.toString()}
                                    >
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>{t('task.epic')}</Label>
                            <Select value={epicId} onValueChange={setEpicId}>
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('task.no_epic')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_EPIC_VALUE}>
                                        {t('common.none')}
                                    </SelectItem>
                                    {epics.map((epic) => (
                                        <SelectItem
                                            key={epic.id}
                                            value={epic.id.toString()}
                                        >
                                            {epic.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>{t('task.sprint')}</Label>
                            <Select
                                value={sprintId}
                                onValueChange={setSprintId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('task.no_sprint')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_SPRINT_VALUE}>
                                        {t('common.none')}
                                    </SelectItem>
                                    {sprints.map((sprint) => (
                                        <SelectItem
                                            key={sprint.id}
                                            value={sprint.id.toString()}
                                        >
                                            {sprint.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={create}
                            disabled={!title.trim() || !taskTypeId}
                        >
                            {t('task.create_task')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
