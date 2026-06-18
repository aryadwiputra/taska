import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store as projectStore } from '@/routes/projects';

interface StepProjectProps {
    workspaceSlug: string;
    onSkip: () => void;
    onCreated: () => void;
}

export function StepProject({
    workspaceSlug,
    onSkip,
    onCreated,
}: StepProjectProps) {
    const { t } = useTranslation();
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch(
                projectStore.url({ workspace: workspaceSlug }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': decodeURIComponent(
                            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ??
                                '',
                        ),
                    },
                    body: formData,
                },
            );

            if (response.ok) {
                onCreated();
            } else if (response.status === 422) {
                const data = await response.json();
                setErrors(data.errors ?? {});
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('onboarding.project_title')}</CardTitle>
                <CardDescription>
                    {t('onboarding.project_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    encType="multipart/form-data"
                >
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="project-name">{t('onboarding.project_name')}</Label>
                        <Input
                            id="project-name"
                            name="name"
                            placeholder={t('onboarding.project_name_placeholder')}
                            required
                            onChange={(e) => {
                                if (!slugManuallyEdited) {
                                    const slugInput = document.getElementById(
                                        'project-slug',
                                    ) as HTMLInputElement;
                                    const keyInput = document.getElementById(
                                        'project-key',
                                    ) as HTMLInputElement;

                                    if (slugInput) {
                                        slugInput.value = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                    }

                                    if (keyInput) {
                                        keyInput.value = e.target.value
                                            .replace(/\s+/g, '')
                                            .replace(/[^a-zA-Z0-9]/g, '')
                                            .toUpperCase()
                                            .slice(0, 8);
                                    }
                                }
                            }}
                            data-invalid={!!errors.name}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="project-key">{t('onboarding.project_key')}</Label>
                            <Input
                                id="project-key"
                                name="key"
                                placeholder={t('onboarding.project_key_placeholder')}
                                required
                                maxLength={20}
                                onFocus={() => setSlugManuallyEdited(true)}
                                data-invalid={!!errors.key}
                                aria-invalid={!!errors.key}
                            />
                            {errors.key && (
                                <p className="text-sm text-destructive">
                                    {errors.key}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="project-slug">{t('onboarding.project_slug')}</Label>
                            <Input
                                id="project-slug"
                                name="slug"
                                placeholder={t('onboarding.project_slug_placeholder')}
                                required
                                onFocus={() => setSlugManuallyEdited(true)}
                                data-invalid={!!errors.slug}
                                aria-invalid={!!errors.slug}
                            />
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="project-color">
                            {t('onboarding.project_color')}{' '}
                            <span className="text-muted-foreground">
                                ({t('common.optional')})
                            </span>
                        </Label>
                        <Input
                            id="project-color"
                            name="color"
                            type="color"
                            className="h-10 w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="project-description">
                            {t('onboarding.project_description_label')}{' '}
                            <span className="text-muted-foreground">
                                ({t('common.optional')})
                            </span>
                        </Label>
                        <Input
                            id="project-description"
                            name="description"
                            placeholder={t('onboarding.project_desc_placeholder')}
                        />
                    </div>

                    <input type="hidden" name="visibility" value="workspace" />

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSkip}
                            className="flex-1"
                        >
                            {t('common.skip')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? t('workspace.creating') : t('onboarding.create_project')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
