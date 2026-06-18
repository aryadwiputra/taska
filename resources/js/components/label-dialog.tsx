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
    store as createLabel,
    update as updateLabel,
} from '@/routes/projects/labels';

interface LabelData {
    id: number;
    name: string;
    slug: string;
    color: string | null;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label?: LabelData | null;
}

export function LabelDialog({
    workspaceSlug,
    projectSlug,
    open,
    onOpenChange,
    label,
}: Props) {
    const { t } = useTranslation();
    const isEditing = !!label;

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

    const [name, setName] = useState(label?.name ?? '');
    const [color, setColor] = useState(label?.color ?? COLOR_OPTIONS[0].value);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) {
            return;
        }

        setProcessing(true);

        const data = {
            name: name.trim(),
            color,
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

        if (isEditing && label) {
            router.put(
                updateLabel.url({
                    workspace: workspaceSlug,
                    project: projectSlug,
                    label: label.id,
                }),
                data,
                options,
            );
        } else {
            router.post(
                createLabel.url({
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
                            ? t('label.edit_label')
                            : t('label.create_label')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? t('label.edit_description')
                            : t('label.create_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="label-name">
                            {t('label.name')}
                        </Label>
                        <Input
                            id="label-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('label.label_name')}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('label.color')}</Label>
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
                              : t('label.create_label')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
