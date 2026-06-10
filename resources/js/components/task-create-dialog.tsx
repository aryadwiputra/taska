import { Plus } from 'lucide-react';
import { useState } from 'react';
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
}: Props) {
    const [open, setOpen] = useState(false);
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

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks`;

        const token = document.createElement('input');
        token.type = 'hidden';
        token.name = '_token';
        token.value =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content ?? '';
        form.appendChild(token);

        const titleInput = document.createElement('input');
        titleInput.type = 'hidden';
        titleInput.name = 'title';
        titleInput.value = title;
        form.appendChild(titleInput);

        const typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'task_type_id';
        typeInput.value = taskTypeId;
        form.appendChild(typeInput);

        if (priorityId !== NO_PRIORITY_VALUE) {
            const priorityInput = document.createElement('input');
            priorityInput.type = 'hidden';
            priorityInput.name = 'priority_id';
            priorityInput.value = priorityId;
            form.appendChild(priorityInput);
        }

        if (epicId !== NO_EPIC_VALUE) {
            const epicInput = document.createElement('input');
            epicInput.type = 'hidden';
            epicInput.name = 'epic_ids[]';
            epicInput.value = epicId;
            form.appendChild(epicInput);
        }

        if (sprintId !== NO_SPRINT_VALUE) {
            const sprintInput = document.createElement('input');
            sprintInput.type = 'hidden';
            sprintInput.name = 'sprint_ids[]';
            sprintInput.value = sprintId;
            form.appendChild(sprintInput);
        }

        document.body.appendChild(form);
        form.submit();

        setOpen(false);
        setTitle('');
        setEpicId(NO_EPIC_VALUE);
        setSprintId(NO_SPRINT_VALUE);
        onCreated?.();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="size-3.5" />
                    <span>New task</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create task</DialogTitle>
                    <DialogDescription>
                        Add a new task to the project board.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    create();
                                }
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Type</Label>
                        <Select
                            value={taskTypeId}
                            onValueChange={setTaskTypeId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {taskTypes.map((t) => (
                                    <SelectItem
                                        key={t.id}
                                        value={t.id.toString()}
                                    >
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Priority</Label>
                        <Select
                            value={priorityId}
                            onValueChange={setPriorityId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_PRIORITY_VALUE}>
                                    None
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
                            <Label>Epic</Label>
                            <Select value={epicId} onValueChange={setEpicId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="No epic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_EPIC_VALUE}>
                                        None
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
                            <Label>Sprint</Label>
                            <Select
                                value={sprintId}
                                onValueChange={setSprintId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No sprint" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_SPRINT_VALUE}>
                                        None
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
                            Cancel
                        </Button>
                        <Button
                            onClick={create}
                            disabled={!title.trim() || !taskTypeId}
                        >
                            Create task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
