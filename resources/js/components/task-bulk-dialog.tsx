import type { RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BulkOperation } from '@/components/task-bulk-toolbar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { bulk as bulkTasks } from '@/routes/projects/tasks';

interface MemberOption {
    user_id: number;
    name: string;
}

interface BoardColumnOption {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    board: {
        id: number;
        name: string;
        is_default: boolean;
    };
}

interface PriorityOption {
    id: number;
    name: string;
    key: string;
    color: string | null;
}

interface LabelOption {
    id: number;
    name: string;
    color: string | null;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    operation: BulkOperation | null;
    selectedTaskIds: number[];
    workspaceSlug: string;
    projectSlug: string;
    members: MemberOption[];
    boardColumns: BoardColumnOption[];
    priorities: PriorityOption[];
    labels: LabelOption[];
    onSuccess: () => void;
}

const operationTitles: Record<BulkOperation, string> = {
    move_column: 'Move tasks',
    assignees: 'Change assignees',
    priority: 'Change priority',
    labels: 'Change labels',
    archive: 'Archive tasks',
    delete: 'Delete tasks',
};

const CLEAR_PRIORITY = 'clear';

export function TaskBulkDialog({
    open,
    onOpenChange,
    operation,
    selectedTaskIds,
    workspaceSlug,
    projectSlug,
    members,
    boardColumns,
    priorities,
    labels,
    onSuccess,
}: Props) {
    const { t } = useTranslation();
    const [boardColumnId, setBoardColumnId] = useState('');
    const [assigneeMode, setAssigneeMode] = useState('add');
    const [assigneeId, setAssigneeId] = useState('');
    const [priorityId, setPriorityId] = useState(CLEAR_PRIORITY);
    const [labelMode, setLabelMode] = useState('add');
    const [labelId, setLabelId] = useState('');
    const [processing, setProcessing] = useState(false);

    const resetFields = () => {
        setBoardColumnId('');
        setAssigneeMode('add');
        setAssigneeId('');
        setPriorityId(CLEAR_PRIORITY);
        setLabelMode('add');
        setLabelId('');
        setProcessing(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetFields();
        }

        onOpenChange(nextOpen);
    };

    if (!operation) {
        return null;
    }

    const submit = () => {
        const payload: RequestPayload = {
            task_ids: selectedTaskIds,
            operation,
        };

        if (operation === 'move_column') {
            payload.board_column_id = Number(boardColumnId);
        }

        if (operation === 'assignees') {
            payload.assignee_mode = assigneeMode;
            payload.assignee_ids = assigneeId ? [Number(assigneeId)] : [];
        }

        if (operation === 'priority') {
            payload.priority_id =
                priorityId === CLEAR_PRIORITY ? null : Number(priorityId);
        }

        if (operation === 'labels') {
            payload.label_mode = labelMode;
            payload.label_ids = labelId ? [Number(labelId)] : [];
        }

        router.post(
            bulkTasks.url({ workspace: workspaceSlug, project: projectSlug }),
            payload,
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    resetFields();
                    onOpenChange(false);
                    onSuccess();
                },
            },
        );
    };

    const canSubmit =
        selectedTaskIds.length > 0 &&
        (operation === 'archive' ||
            operation === 'delete' ||
            (operation === 'move_column' && boardColumnId !== '') ||
            (operation === 'assignees' && assigneeId !== '') ||
            operation === 'priority' ||
            (operation === 'labels' && labelId !== ''));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{operationTitles[operation]}</DialogTitle>
                    <DialogDescription>
                        This action will affect {selectedTaskIds.length}{' '}
                        {selectedTaskIds.length === 1 ? 'task' : 'tasks'}.
                    </DialogDescription>
                </DialogHeader>

                {operation === 'move_column' && (
                    <div className="flex flex-col gap-2">
                        <Label>{t('task_bulk.target_column')}</Label>
                        <Select
                            value={boardColumnId}
                            onValueChange={setBoardColumnId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('task_bulk.select_column')} />
                            </SelectTrigger>
                            <SelectContent>
                                {boardColumns.map((column) => (
                                    <SelectItem
                                        key={column.id}
                                        value={String(column.id)}
                                    >
                                        {column.board.name} / {column.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {operation === 'assignees' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>{t('task_bulk.mode')}</Label>
                            <Select
                                value={assigneeMode}
                                onValueChange={setAssigneeMode}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">{t('task_bulk.add')}</SelectItem>
                                    <SelectItem value="remove">
                                        {t('task_bulk.remove')}
                                    </SelectItem>
                                    <SelectItem value="replace">
                                        {t('task_bulk.replace')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>{t('task_bulk.assignee')}</Label>
                            <Select
                                value={assigneeId}
                                onValueChange={setAssigneeId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('task_bulk.select_member')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((member) => (
                                        <SelectItem
                                            key={member.user_id}
                                            value={String(member.user_id)}
                                        >
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {operation === 'priority' && (
                    <div className="flex flex-col gap-2">
                        <Label>{t('task.priority')}</Label>
                        <Select
                            value={priorityId}
                            onValueChange={setPriorityId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CLEAR_PRIORITY}>
                                    {t('task_bulk.no_priority')}
                                </SelectItem>
                                {priorities.map((priority) => (
                                    <SelectItem
                                        key={priority.id}
                                        value={String(priority.id)}
                                    >
                                        {priority.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {operation === 'labels' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>{t('task_bulk.mode')}</Label>
                            <Select
                                value={labelMode}
                                onValueChange={setLabelMode}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">{t('task_bulk.add')}</SelectItem>
                                    <SelectItem value="remove">
                                        {t('task_bulk.remove')}
                                    </SelectItem>
                                    <SelectItem value="replace">
                                        {t('task_bulk.replace')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>{t('task.labels')}</Label>
                            <Select value={labelId} onValueChange={setLabelId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('task_bulk.select_label')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {labels.map((label) => (
                                        <SelectItem
                                            key={label.id}
                                            value={String(label.id)}
                                        >
                                            {label.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {(operation === 'archive' || operation === 'delete') && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {operation === 'delete'
                            ? 'Selected tasks will be soft deleted.'
                            : 'Selected tasks will be archived and hidden from active workflows where archive filters are applied.'}
                    </p>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant={
                            operation === 'delete' ? 'destructive' : 'default'
                        }
                        disabled={!canSubmit || processing}
                        onClick={submit}
                    >
                        {processing ? t('common.applying') : 'Apply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
