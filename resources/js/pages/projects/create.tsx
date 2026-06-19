import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    index as projectsIndex,
    store as projectStore,
} from '@/routes/projects';

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
}

export default function ProjectsCreate({ workspace }: Props) {
    const { t } = useTranslation();
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    return (
        <>
            <Head
                title={`${workspace.name} — ${t('project.create_project')}`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('project.create_project')}
                    backHref={projectsIndex({ workspace: workspace.slug })}
                    backLabel={t('sidebar.projects')}
                />

                <div className="mx-auto w-full max-w-lg">
                    <Card>
                        <CardContent>
                            <Form
                                action={projectStore.url({
                                    workspace: workspace.slug,
                                })}
                                method="post"
                                className="flex flex-col gap-4"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="name">
                                                {t('onboarding.project_name')}
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder={t(
                                                    'onboarding.project_name_placeholder',
                                                )}
                                                onChange={(e) => {
                                                    if (!slugManuallyEdited) {
                                                        const slugInput =
                                                            document.getElementById(
                                                                'slug',
                                                            ) as HTMLInputElement;

                                                        if (slugInput) {
                                                            slugInput.value =
                                                                e.target.value
                                                                    .toLowerCase()
                                                                    .replace(
                                                                        /\s+/g,
                                                                        '-',
                                                                    )
                                                                    .replace(
                                                                        /[^a-z0-9-]/g,
                                                                        '',
                                                                    );
                                                        }
                                                    }

                                                    const keyInput =
                                                        document.getElementById(
                                                            'key',
                                                        ) as HTMLInputElement;

                                                    if (
                                                        keyInput &&
                                                        !keyInput.dataset.manual
                                                    ) {
                                                        keyInput.value =
                                                            e.target.value
                                                                .replace(
                                                                    /\s+/g,
                                                                    '',
                                                                )
                                                                .replace(
                                                                    /[^a-zA-Z]/g,
                                                                    '',
                                                                )
                                                                .substring(0, 4)
                                                                .toUpperCase();
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
                                            <Label htmlFor="key">
                                                {t('onboarding.project_key')}
                                            </Label>
                                            <Input
                                                id="key"
                                                name="key"
                                                placeholder={t(
                                                    'onboarding.project_key_placeholder',
                                                )}
                                                maxLength={6}
                                                className="font-mono uppercase"
                                                onFocus={(e) => {
                                                    e.currentTarget.dataset.manual =
                                                        'true';
                                                }}
                                                data-invalid={!!errors.key}
                                                aria-invalid={!!errors.key}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Short prefix for task codes
                                                (e.g. PROJ-1)
                                            </p>
                                            {errors.key && (
                                                <p className="text-sm text-destructive">
                                                    {errors.key}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="slug">
                                                {t('onboarding.project_slug')}
                                            </Label>
                                            <Input
                                                id="slug"
                                                name="slug"
                                                placeholder={t(
                                                    'onboarding.project_slug_placeholder',
                                                )}
                                                onFocus={() =>
                                                    setSlugManuallyEdited(true)
                                                }
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
                                            <input
                                                type="hidden"
                                                name="visibility"
                                                value="workspace"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing
                                                ? t('common.creating')
                                                : t('project.create_project')}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
