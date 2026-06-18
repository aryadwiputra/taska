import { Form } from '@inertiajs/react';
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
import { store as workspaceStore } from '@/routes/workspaces';

interface StepWorkspaceProps {
    onCreated: (workspace: { id: number; name: string; slug: string }) => void;
}

export function StepWorkspace({ onCreated }: StepWorkspaceProps) {
    const { t } = useTranslation();
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('onboarding.workspace_title')}</CardTitle>
                <CardDescription>
                    {t('onboarding.workspace_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    action={workspaceStore()}
                    method="post"
                    className="flex flex-col gap-4"
                    onSuccess={(page) => {
                        const wp = (page.props as Record<string, unknown>)
                            .currentWorkspace as
                            | { id: number; name: string; slug: string }
                            | undefined;

                        if (wp) {
                            onCreated(wp);
                        } else {
                            window.location.reload();
                        }
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">{t('onboarding.workspace_name')}</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder={t('onboarding.workspace_name_placeholder')}
                                    required
                                    onChange={(e) => {
                                        if (!slugManuallyEdited) {
                                            const slugInput =
                                                document.getElementById(
                                                    'slug',
                                                ) as HTMLInputElement;

                                            if (slugInput) {
                                                slugInput.value = e.target.value
                                                    .toLowerCase()
                                                    .replace(/\s+/g, '-')
                                                    .replace(/[^a-z0-9-]/g, '');
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

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="slug">{t('onboarding.workspace_slug')}</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder={t('onboarding.workspace_slug_placeholder')}
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

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="description">
                                    {t('onboarding.workspace_description_label')}{' '}
                                    <span className="text-muted-foreground">
                                        ({t('common.optional')})
                                    </span>
                                </Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder={t('onboarding.workspace_desc_placeholder')}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                            >
                                {processing
                                    ? t('workspace.creating')
                                    : t('onboarding.create_workspace')}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}
