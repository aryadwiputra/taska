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
    store as createSprint,
    update as updateSprint,
} from '@/routes/projects/sprints';

interface SprintData {
    id: number;
    name: string;
    goal: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sprint?: SprintData | null;
}

export function SprintDialog({
    workspaceSlug,
    projectSlug,
    open,
    onOpenChange,
    sprint,
}: Props) {
    const { t } = useTranslation();
    const isEditing = !!sprint;
    const [name, setName] = useState(sprint?.name ?? '');
    const [goal, setGoal] = useState(sprint?.goal ?? '');
    const [status, setStatus] = useState(sprint?.status ?? 'planned');
    const [startDate, setStartDate] = useState(sprint?.start_date ?? '');
    const [endDate, setEndDate] = useState(sprint?.end_date ?? '');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) {
            return;
        }

        setProcessing(true);

        const data: Record<string, string | null> = {
            name: name.trim(),
            goal: goal.trim() || null,
            status,
            start_date: startDate || null,
            end_date: endDate || null,
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

        if (isEditing && sprint) {
            router.put(
                updateSprint.url({
                    workspace: workspaceSlug,
                    project: projectSlug,
                    sprint: sprint.id,
                }),
                data,
                options,
            );
        } else {
            router.post(
                createSprint.url({
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
                            ? t('sprint.edit_sprint')
                            : t('sprint.create_sprint')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('sprint.edit_description')
                            : t('sprint.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="sprint-name">
                            {t('sprint.name')}
                        </Label>
                        <Input
                            id="sprint-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('sprint.sprint_name')}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="sprint-goal">
                            {t('sprint.goal')}
                        </Label>
                        <Input
                            id="sprint-goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t('sprint.sprint_goal')}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('sprint.status')}</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="planned">
                                    {t('sprint.planned')}
                                </SelectItem>
                                <SelectItem value="active">
                                    {t('sprint.active')}
                                </SelectItem>
                                <SelectItem value="completed">
                                    {t('sprint.completed')}
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    {t('sprint.cancelled')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="sprint-start">
                                {t('sprint.start_date')}
                            </Label>
                            <Input
                                id="sprint-start"
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="sprint-end">
                                {t('sprint.end_date')}
                            </Label>
                            <Input
                                id="sprint-end"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
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
                              : t('sprint.create_sprint')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
