import {
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    Sheet,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DocAttachment } from '@/lib/doc-attachments';
import {
    deleteAttachment,
    downloadAttachment,
    getFileTypeCategory,
} from '@/lib/doc-attachments';
import { cn } from '@/lib/utils';

interface FileListProps {
    workspaceSlug: string;
    projectSlug: string;
    docSlug: string;
    attachments: DocAttachment[];
    onAttachmentsChange: (attachments: DocAttachment[]) => void;
    onPreview: (attachment: DocAttachment) => void;
}

export function FileList({
    workspaceSlug,
    projectSlug,
    docSlug,
    attachments,
    onAttachmentsChange,
    onPreview,
}: FileListProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const selectedCount = selectedIds.size;

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedCount === attachments.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(attachments.map((a) => a.id)));
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (deleteConfirmId === null) {
            return;
        }

        setDeleting(true);
        try {
            await deleteAttachment(workspaceSlug, projectSlug, docSlug, deleteConfirmId);
            onAttachmentsChange(attachments.filter((a) => a.id !== deleteConfirmId));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(deleteConfirmId);
                return next;
            });
            toast.success('File deleted successfully');
        } catch {
            toast.error('Failed to delete file');
        } finally {
            setDeleting(false);
            setDeleteConfirmId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCount === 0) {
            return;
        }

        setDeleting(true);
        try {
            for (const id of selectedIds) {
                await deleteAttachment(workspaceSlug, projectSlug, docSlug, id);
            }
            onAttachmentsChange(attachments.filter((a) => !selectedIds.has(a.id)));
            setSelectedIds(new Set());
            toast.success(`${selectedCount} files deleted`);
        } catch {
            toast.error('Failed to delete some files');
        } finally {
            setDeleting(false);
        }
    };

    const handleDownload = (attachment: DocAttachment) => {
        downloadAttachment(workspaceSlug, projectSlug, docSlug, attachment.id);
    };

    if (attachments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {selectedCount > 0 && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                    <span className="text-sm">
                        {selectedCount} file{selectedCount > 1 ? 's' : ''} selected
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={deleting}
                    >
                        Delete selected
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        Clear selection
                    </Button>
                </div>
            )}

            <div className="rounded-lg border">
                <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2">
                    <Checkbox
                        checked={
                            selectedCount > 0 && selectedCount === attachments.length
                        }
                        onCheckedChange={toggleSelectAll}
                    />
                    <span className="flex-1 text-xs font-medium text-muted-foreground">
                        NAME
                    </span>
                    <span className="w-20 text-right text-xs font-medium text-muted-foreground">
                        SIZE
                    </span>
                    <span className="w-20 text-right text-xs font-medium text-muted-foreground">
                        MODIFIED
                    </span>
                    <span className="w-10" />
                </div>

                {attachments.map((attachment) => (
                    <div
                        key={attachment.id}
                        className="group flex items-center gap-3 border-b px-4 py-2 last:border-0 hover:bg-muted/30"
                    >
                        <Checkbox
                            checked={selectedIds.has(attachment.id)}
                            onCheckedChange={() => toggleSelect(attachment.id)}
                        />
                        <button
                            type="button"
                            onClick={() => onPreview(attachment)}
                            className="flex flex-1 items-center gap-3 text-left"
                            disabled={!attachment.is_previewable}
                        >
                            <FileTypeIcon
                                mimeType={attachment.mime_type}
                                className="size-5 shrink-0 text-muted-foreground"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium hover:underline">
                                    {attachment.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {attachment.uploaded_by?.name}
                                </p>
                            </div>
                        </button>
                        <span className="w-20 text-right text-xs text-muted-foreground">
                            {attachment.file_size_formatted}
                        </span>
                        <span className="w-20 text-right text-xs text-muted-foreground">
                            {formatDate(attachment.created_at)}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {attachment.is_previewable && (
                                    <DropdownMenuItem onClick={() => onPreview(attachment)}>
                                        Preview
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDownload(attachment)}>
                                    Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleDelete(attachment.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            <Dialog
                open={deleteConfirmId !== null}
                onOpenChange={() => setDeleteConfirmId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete file?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function FileTypeIcon({
    mimeType,
    className,
}: {
    mimeType: string | null;
    className?: string;
}) {
    const category = getFileTypeCategory(mimeType);

    switch (category) {
        case 'image':
            return <FileImage className={className} />;
        case 'pdf':
            return <FileText className={cn('text-red-500', className)} />;
        case 'spreadsheet':
            return <Sheet className={cn('text-green-600', className)} />;
        case 'presentation':
            return <FileSpreadsheet className={cn('text-orange-500', className)} />;
        case 'document':
            return <FileText className={className} />;
        default:
            return <File className={className} />;
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Today';
    }
    if (days === 1) {
        return 'Yesterday';
    }
    if (days < 7) {
        return `${days} days ago`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
