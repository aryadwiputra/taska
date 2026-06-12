import { router } from '@inertiajs/react';
import { useState } from 'react';
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
import { store as columnStore, update as columnUpdate, destroy as columnDestroy } from '@/routes/projects/boards/columns';

interface ColumnData {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    boardId: number;
    columns: ColumnData[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const COLOR_OPTIONS = [
    { value: '#EF4444', label: 'Red' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EAB308', label: 'Yellow' },
    { value: '#22C55E', label: 'Green' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#A855F7', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#78716C', label: 'Stone' },
];

function generateStatusKey(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 50) || 'column';
}

export function BoardColumnManager({
    workspaceSlug,
    projectSlug,
    boardId,
    columns,
    open,
    onOpenChange,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editIsDone, setEditIsDone] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);
    const [newIsDone, setNewIsDone] = useState('false');
    const [processing, setProcessing] = useState(false);

    const handleAdd = () => {
        if (!newName.trim()) {
            return;
        }

        setProcessing(true);

        router.post(
            columnStore({ workspace: workspaceSlug, project: projectSlug, board: boardId }),
            {
                name: newName.trim(),
                status_key: generateStatusKey(newName.trim()),
                color: newColor,
                is_done_column: newIsDone === 'true',
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
    };

    const saveEdit = () => {
        if (!editName.trim() || editingId === null) {
            return;
        }

        setProcessing(true);

        router.put(
            columnUpdate({ workspace: workspaceSlug, project: projectSlug, board: boardId, boardColumn: editingId }),
            {
                name: editName.trim(),
                color: editColor,
                is_done_column: editIsDone,
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
        if (!confirm(`Delete "${column.name}"?`)) {
            return;
        }

        router.delete(
            columnDestroy({ workspace: workspaceSlug, project: projectSlug, board: boardId, boardColumn: column.id }),
            { preserveScroll: true },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage columns</DialogTitle>
                    <DialogDescription>
                        Add, edit, or remove columns for this board.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
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
                                                    onValueChange={
                                                        setEditColor
                                                    }
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
                                                                e.target.checked,
                                                            )
                                                        }
                                                        className="size-3.5"
                                                    />
                                                    Done column
                                                </label>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setEditingId(null)
                                                        }
                                                        disabled={processing}
                                                    >
                                                        Cancel
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
                                                        Save
                                                    </Button>
                                                </div>
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
                                                        Done
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
                                                    title="Edit column"
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
                                                    title="Delete column"
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
                            No columns yet.
                        </p>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="mb-3 text-sm font-medium">
                            Add column
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Label
                                        htmlFor="new-col-name"
                                        className="sr-only"
                                    >
                                        Name
                                    </Label>
                                    <Input
                                        id="new-col-name"
                                        value={newName}
                                        onChange={(e) =>
                                            setNewName(e.target.value)
                                        }
                                        placeholder="Column name"
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
                                            Regular
                                        </SelectItem>
                                        <SelectItem value="true">
                                            Done
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAdd}
                                    disabled={!newName.trim() || processing}
                                >
                                    Add column
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
