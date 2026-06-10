import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WorkspacesCreate() {
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    return (
        <>
            <Head title="Create workspace" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <Link
                    href="/workspaces"
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    <span>Back to workspaces</span>
                </Link>

                <div className="mx-auto w-full max-w-lg">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create workspace</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action="/workspaces"
                                method="post"
                                className="flex flex-col gap-4"
                                resetOnSuccess
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="name">
                                                Workspace name
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="My Team"
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
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                name="slug"
                                                placeholder="my-team"
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
                                                Description{' '}
                                                <span className="text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="description"
                                                name="description"
                                                placeholder="A short description of your workspace"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing
                                                ? 'Creating...'
                                                : 'Create workspace'}
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
