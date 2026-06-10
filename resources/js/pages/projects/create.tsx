import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
}

export default function ProjectsCreate({ workspace }: Props) {
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    return (
        <>
            <Head title={`${workspace.name} — Create project`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <Link
                    href={`/workspaces/${workspace.slug}/projects`}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to projects</span>
                </Link>

                <div className="mx-auto w-full max-w-lg">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create project</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={`/workspaces/${workspace.slug}/projects`}
                                method="post"
                                className="flex flex-col gap-4"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="name">
                                                Project name
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="My Project"
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
                                            <Label htmlFor="key">Key</Label>
                                            <Input
                                                id="key"
                                                name="key"
                                                placeholder="PROJ"
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
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                name="slug"
                                                placeholder="my-project"
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
                                                ? 'Creating...'
                                                : 'Create project'}
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
