import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { store as createEpic, update as updateEpic } from '@/routes/projects/epics';

interface EpicData {
    id: number;
    name: string;
    summary: string | null;
    color: string | null;
    status: string;
    start_date: string | null;
    due_date: string | null;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    epic?: EpicData | null;
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

export function EpicDialog({
    workspaceSlug,
    projectSlug,
    open,
    onOpenChange,
    epic,
}: Props) {
    const isEditing = !!epic;
    const [name, setName] = useState(epic?.name ?? '');
    const [summary, setSummary] = useState(epic?.summary ?? '');
    const [color, setColor] = useState(epic?.color ?? COLOR_OPTIONS[0].value);
    const [status, setStatus] = useState(epic?.status ?? 'active');
    const [startDate, setStartDate] = useState(epic?.start_date ?? '');
    const [dueDate, setDueDate] = useState(epic?.due_date ?? '');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) {
            return;
        }

        setProcessing(true);

        const data: Record<string, string | null> = {
            name: name.trim(),
            summary: summary.trim() || null,
            color,
            status,
            start_date: startDate || null,
            due_date: dueDate || null,
        };

        const options = {
            onSuccess: () => {
                setProcessing(false);
                onOpenChange(false);
            },
            onError: () => {
                setProcessing(false);
            },
        };

        if (isEditing && epic) {
            router.put(
                updateEpic.url({
                    workspace: workspaceSlug,
                    project: projectSlug,
                    epic: epic.id,
                }),
                data,
                options,
            );
        } else {
            router.post(
                createEpic.url({ workspace: workspaceSlug, project: projectSlug }),
                data,
                options,
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit epic' : 'Create epic'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the epic details.'
                            : 'Add a new epic to this project.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="epic-name">Name</Label>
                        <Input
                            id="epic-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Epic name"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="epic-summary">Summary</Label>
                        <Input
                            id="epic-summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>Color</Label>
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger>
                                    <SelectValue>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-3 rounded-full"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                            <span>
                                                {COLOR_OPTIONS.find(
                                                    (c) => c.value === color,
                                                )?.label ?? 'Custom'}
                                            </span>
                                        </div>
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
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="epic-start">Start date</Label>
                            <Input
                                id="epic-start"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="epic-due">Due date</Label>
                            <Input
                                id="epic-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim() || processing}
                    >
                        {processing
                            ? 'Saving...'
                            : isEditing
                              ? 'Save changes'
                              : 'Create epic'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
