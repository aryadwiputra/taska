'use no memo';

import { router } from '@inertiajs/react';
import { Clock, History, RotateCcw, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { restoreVersion } from '@/actions/App/Http/Controllers/DocController';
import { versions as versionsRoute } from '@/routes/projects/docs';

interface VersionItem {
    id: number;
    title: string;
    content: string;
    edited_by: number;
    editor: { id: number; name: string; avatar: string | null };
    created_at: string;
    updated_at: string;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    docSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VersionHistory({ workspaceSlug, projectSlug, docSlug, open, onOpenChange }: Props) {
    const { t } = useTranslation();
    const [versions, setVersions] = useState<VersionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setLoading(true);
        setError(false);

        fetch(
            versionsRoute.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug }),
            { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } },
        )
            .then((r) => {
                if (!r.ok) {
                    throw new Error('Failed to load versions');
                }

                return r.json();
            })
            .then(setVersions)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [open, workspaceSlug, projectSlug, docSlug]);

    const handleRestore = (version: VersionItem) => {
        router.post(
            restoreVersion.url({
                workspace: workspaceSlug,
                project: projectSlug,
                doc: docSlug,
                version: version.id,
            }),
            { preserveScroll: true },
        );
        onOpenChange(false);
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="size-4" />
                        {t('docs.version_history')}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                    {loading ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
                    ) : error ? (
                        <p className="py-4 text-center text-sm text-destructive">{t('docs.failed_load_versions')}</p>
                    ) : versions.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No versions yet.</p>
                    ) : (
                        versions.map((version, index) => (
                            <div
                                key={version.id}
                                className={cn(
                                    'flex items-start justify-between gap-4 rounded-md border border-border p-3',
                                    index === 0 && 'border-primary/30 bg-primary/5',
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{version.title}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <User className="size-3" />
                                            {version.editor.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {formatDate(version.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(version)}
                                >
                                    <RotateCcw className="size-3.5" />
                                    Restore
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
