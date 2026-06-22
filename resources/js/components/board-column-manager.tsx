import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { update as boardUpdate } from '@/routes/projects/boards';
import {
    store as columnStore,
    update as columnUpdate,
    destroy as columnDestroy,
} from '@/routes/projects/boards/columns';

interface ColumnData {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
    wip_limit: number | null;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    boardId: number;
    boardSwimlaneField: string;
    columns: ColumnData[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function generateStatusKey(name: string): string {
    return (
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .slice(0, 50) || 'column'
    );
}

export function BoardColumnManager({
    workspaceSlug,
    projectSlug,
    boardId,
    boardSwimlaneField,
    columns,
    open,
    onOpenChange,
}: Props) {
    const { t } = useTranslation();

    const COLOR_OPTIONS = [
        { value: '#EF4444', label: t('color.red') },
        { value: '#F97316', label: t('color.orange') },
        { value: '#EAB308', label: t('color.yellow') },
        { value: '#22C55E', label: t('color.green') },
        { value: '#06B6D4', label: t('color.cyan') },
        { value: '#3B82F6', label: t('color.blue') },
        { value: '#6366F1', label: t('color.indigo') },
        { value: '#A855F7', label: t('color.purple') },
        { value: '#EC4899', label: t('color.pink') },
        { value: '#78716C', label: t('color.stone') },
    ];

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editIsDone, setEditIsDone] = useState(false);
    const [editWipLimit, setEditWipLimit] = useState('');
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
    const [newIsDone, setNewIsDone] = useState('false');
    const [newWipLimit, setNewWipLimit] = useState('');
    const [swimlaneField, setSwimlaneField] = useState(boardSwimlaneField);
    const [processing, setProcessing] = useState(false);

    const handleAdd = () => {
        if (!newName.trim()) {
            return;
        }

        setProcessing(true);

        router.post(
            columnStore({
                workspace: workspaceSlug,
                project: projectSlug,
                board: boardId,
            }),
            {
                name: newName.trim(),
                status_key: generateStatusKey(newName.trim()),
                color: newColor,
                is_done_column: newIsDone === 'true',
                wip_limit: newWipLimit ? parseInt(newWipLimit, 10) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    setNewName('');
                    setNewColor(COLOR_OPTIONS[0].value);
                    setNewIsDone('false');
                    router.reload();
                },
                onError: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const startEditing = (column: ColumnData) => {
        setEditingId(column.id);
        setEditName(column.name);
        setEditColor(column.color ?? COLOR_OPTIONS[0].value);
        setEditIsDone(column.is_done_column);
        setEditWipLimit(column.wip_limit?.toString() ?? '');
    };

    const saveEdit = () => {
        if (!editName.trim() || editingId === null) {
            return;
        }

        setProcessing(true);

        router.put(
            columnUpdate({
                workspace: workspaceSlug,
                project: projectSlug,
                board: boardId,
                boardColumn: editingId,
            }),
            {
                name: editName.trim(),
                color: editColor,
                is_done_column: editIsDone,
                wip_limit: editWipLimit ? parseInt(editWipLimit, 10) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    setEditingId(null);
                    router.reload();
                },
                onError: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const deleteColumn = (column: ColumnData) => {
        if (!confirm(t('board_column.delete_confirm', { name: column.name }))) {
            return;
        }

        router.delete(
            columnDestroy({
                workspace: workspaceSlug,
                project: projectSlug,
                board: boardId,
                boardColumn: column.id,
            }),
            { preserveScroll: true },
        );
    };

    const handleSwimlaneChange = (value: string) => {
        setSwimlaneField(value);

        router.put(
            boardUpdate({
                workspace: workspaceSlug,
                project: projectSlug,
                board: boardId,
            }),
            {
                name: columns[0]?.name ?? 'Board',
                swimlane_field: value,
            },
            { preserveScroll: true },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('board.manage_columns')}</DialogTitle>
                    <DialogDescription>
                        {t('board.manage_columns_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                            <Label className="text-sm font-medium">
                                {t('board.swimlanes')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {t('board.swimlanes_description')}
                            </p>
                        </div>
                        <Select
                            value={swimlaneField}
                            onValueChange={handleSwimlaneChange}
                        >
                            <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    {t('board.none')}
                                </SelectItem>
                                <SelectItem value="assignee">
                                    {t('board.assignee')}
                                </SelectItem>
                                <SelectItem value="priority">
                                    {t('board.priority')}
                                </SelectItem>
                                <SelectItem value="epic">
                                    {t('board.epic')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {columns.length > 0 ? (
                        <div className="flex flex-col rounded-md border">
                            {columns.map((column) => (
                                <div
                                    key={column.id}
                                    className="flex items-center justify-between gap-3 border-b px-3 py-2.5 last:border-b-0"
                                >
                                    {editingId === column.id ? (
                                        <div className="flex flex-1 flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editName}
                                                    onChange={(e) =>
                                                        setEditName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 text-sm"
                                                />
                                                <Select
                                                    value={editColor}
                                                    onValueChange={setEditColor}
                                                >
                                                    <SelectTrigger className="h-8 w-20">
                                                        <SelectValue>
                                                            <div
                                                                className="size-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        editColor,
                                                                }}
                                                            />
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {COLOR_OPTIONS.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="size-3 rounded-full"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    option.value,
                                                                            }}
                                                                        />
                                                                        <span>
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={editIsDone}
                                                        onChange={(e) =>
                                                            setEditIsDone(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        className="size-3.5"
                                                    />
                                                    {t('board.done_column')}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {t('board.wip')}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={editWipLimit}
                                                        onChange={(e) =>
                                                            setEditWipLimit(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={t(
                                                            'board_column.wip_infinity',
                                                        )}
                                                        className="h-8 w-16 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingId(null)
                                                    }
                                                    disabled={processing}
                                                >
                                                    {t('common.cancel')}
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={saveEdit}
                                                    disabled={
                                                        !editName.trim() ||
                                                        processing
                                                    }
                                                >
                                                    {t('common.save')}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            column.color ??
                                                            '#64748b',
                                                    }}
                                                />
                                                <span className="truncate text-sm font-medium">
                                                    {column.name}
                                                </span>
                                                {column.is_done_column && (
                                                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                                                        {t('common.done')}
                                                    </span>
                                                )}
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    pos {column.position}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <button
                                                    type="button"
                                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                    title={t('common.edit')}
                                                    onClick={() =>
                                                        startEditing(column)
                                                    }
                                                >
                                                    <svg
                                                        className="size-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                    title={t('common.delete')}
                                                    onClick={() =>
                                                        deleteColumn(column)
                                                    }
                                                >
                                                    <svg
                                                        className="size-3.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t('board_column.no_columns_yet')}
                        </p>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="mb-3 text-sm font-medium">
                            {t('board.add_column')}
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Label
                                        htmlFor="new-col-name"
                                        className="sr-only"
                                    >
                                        {t('board.column_name')}
                                    </Label>
                                    <Input
                                        id="new-col-name"
                                        value={newName}
                                        onChange={(e) =>
                                            setNewName(e.target.value)
                                        }
                                        placeholder={t('board.column_name')}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <Select
                                    value={newColor}
                                    onValueChange={setNewColor}
                                >
                                    <SelectTrigger className="h-8 w-20">
                                        <SelectValue>
                                            <div
                                                className="size-3 rounded-full"
                                                style={{
                                                    backgroundColor: newColor,
                                                }}
                                            />
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLOR_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="size-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                option.value,
                                                        }}
                                                    />
                                                    <span>{option.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={newIsDone}
                                    onValueChange={setNewIsDone}
                                >
                                    <SelectTrigger className="h-8 w-24 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">
                                            {t('board.regular')}
                                        </SelectItem>
                                        <SelectItem value="true">
                                            {t('common.done')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newWipLimit}
                                    onChange={(e) =>
                                        setNewWipLimit(e.target.value)
                                    }
                                    placeholder={t(
                                        'board_column.wip_placeholder',
                                    )}
                                    className="h-8 w-20 text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAdd}
                                    disabled={!newName.trim() || processing}
                                >
                                    {t('board.add_column')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
