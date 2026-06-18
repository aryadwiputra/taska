import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    index as workspaceIndex,
    store as workspaceStore,
} from '@/routes/workspaces';

export default function WorkspacesCreate() {
    const { t } = useTranslation();
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    return (
        <>
            <Head title={t('workspace.create_workspace')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('workspace.create_workspace')}
                    backHref={workspaceIndex()}
                    backLabel={t('workspace.back_to_workspaces')}
                />

                <div className="mx-auto w-full max-w-lg">
                    <Card>
                        <CardContent>
                            <Form
                                action={workspaceStore()}
                                method="post"
                                className="flex flex-col gap-4"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="name">
                                                {t('workspace.workspace_name')}
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder={t(
                                                    'workspace.workspace_name_placeholder',
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
                                            <Label htmlFor="slug">
                                                {t('workspace.slug_label')}
                                            </Label>
                                            <Input
                                                id="slug"
                                                name="slug"
                                                placeholder={t(
                                                    'workspace.workspace_slug_placeholder',
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
                                            <Label htmlFor="description">
                                                {t(
                                                    'workspace.description_label',
                                                )}{' '}
                                                <span className="text-muted-foreground">
                                                    ({t('common.optional')})
                                                </span>
                                            </Label>
                                            <Input
                                                id="description"
                                                name="description"
                                                placeholder={t(
                                                    'workspace.workspace_desc_placeholder',
                                                )}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing
                                                ? t('common.creating')
                                                : t(
                                                      'workspace.create_workspace',
                                                  )}
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
