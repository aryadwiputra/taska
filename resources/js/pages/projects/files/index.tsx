'use no memo';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Paperclip, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { show as projectShow } from '@/routes/projects';

interface AttachmentRow {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string | null;
    created_at: string;
    task: {
        id: number;
        code: string;
        title: string;
    };
    uploader: {
        id: number;
        name: string;
        avatar: string | null;
    };
}

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
    attachments: AttachmentRow[];
}

export default function FilesIndex({ workspace, project, attachments }: Props) {
    return (
        <>
            <Head title={`Files — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">Files</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Files
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {attachments.length} file
                                {attachments.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {attachments.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {attachments.map((attachment) => (
                                <Card key={attachment.id}>
                                    <CardContent className="flex items-center gap-4 py-4">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                            <Paperclip className="size-5" />
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-medium">
                                                    {attachment.file_name}
                                                </span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatBytes(
                                                        attachment.file_size,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <Link
                                                    href={`/workspaces/${workspace.slug}/projects/${project.slug}/list`}
                                                    className="font-mono hover:underline"
                                                >
                                                    {attachment.task.code}
                                                </Link>
                                                <span>
                                                    by{' '}
                                                    {attachment.uploader.name}
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        attachment.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Upload className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        No files yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Attach files to tasks to see them here
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
