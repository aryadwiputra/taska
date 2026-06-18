import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
    store as createEpic,
    update as updateEpic,
} from '@/routes/projects/epics';

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

export function EpicDialog({
    workspaceSlug,
    projectSlug,
    open,
    onOpenChange,
    epic,
}: Props) {
    const { t } = useTranslation();
    const isEditing = !!epic;

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
                createEpic.url({
                    workspace: workspaceSlug,
                    project: projectSlug,
                }),
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
                        {isEditing
                            ? t('epic.edit_epic')
                            : t('epic.create_epic')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('epic.edit_description')
                            : t('epic.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="epic-name">{t('epic.name')}</Label>
                        <Input
                            id="epic-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('epic.epic_name')}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="epic-summary">
                            {t('epic.summary')}
                        </Label>
                        <Input
                            id="epic-summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder={t('epic.brief_description')}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label>{t('epic.color')}</Label>
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
                            <Label>{t('epic.status')}</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        {t('task_search.active')}
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        {t('task_search.completed')}
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        {t('task_search.archived')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="epic-start">
                                {t('epic.start_date')}
                            </Label>
                            <Input
                                id="epic-start"
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="epic-due">
                                {t('epic.due_date')}
                            </Label>
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
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim() || processing}
                    >
                        {processing
                            ? t('common.saving')
                            : isEditing
                              ? t('common.save')
                              : t('epic.create_epic')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
