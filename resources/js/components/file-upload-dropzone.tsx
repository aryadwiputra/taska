import { Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    type DocAttachment,
    uploadAttachment,
} from '@/lib/doc-attachments';

interface UploadDropzoneProps {
    workspaceSlug: string;
    projectSlug: string;
    docSlug: string;
    onUploadComplete: (attachment: DocAttachment) => void;
    onUploadError?: (error: string) => void;
}

interface UploadingFile {
    file: File;
    progress: number;
    error?: string;
}

export function UploadDropzone({
    workspaceSlug,
    projectSlug,
    docSlug,
    onUploadComplete,
    onUploadError,
}: UploadDropzoneProps) {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                await uploadFiles(files);
            }
        },
        [workspaceSlug, projectSlug, docSlug],
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                await uploadFiles(files);
            }
            e.target.value = '';
        },
        [workspaceSlug, projectSlug, docSlug],
    );

    const uploadFiles = async (files: File[]) => {
        for (const file of files) {
            const uploadingFile: UploadingFile = { file, progress: 0 };
            setUploadingFiles((prev) => [...prev, uploadingFile]);

            try {
                const attachment = await uploadAttachment(
                    workspaceSlug,
                    projectSlug,
                    docSlug,
                    file,
                    (progress) => {
                        setUploadingFiles((prev) =>
                            prev.map((uf) =>
                                uf.file === file
                                    ? { ...uf, progress }
                                    : uf,
                            ),
                        );
                    },
                );

                setUploadingFiles((prev) =>
                    prev.filter((uf) => uf.file !== file),
                );
                onUploadComplete(attachment);
                toast.success(`${file.name} uploaded successfully`);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Upload failed';
                setUploadingFiles((prev) =>
                    prev.map((uf) =>
                        uf.file === file ? { ...uf, error: message } : uf,
                    ),
                );
                onUploadError?.(message);
                toast.error(`Failed to upload ${file.name}: ${message}`);
            }
        }
    };

    const removeUploadingFile = (file: File) => {
        setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
    };

    return (
        <div className="space-y-3">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                    isDragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
            >
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff"
                />
                <Upload
                    className={cn(
                        'mb-2 size-8',
                        isDragOver
                            ? 'text-primary'
                            : 'text-muted-foreground',
                    )}
                />
                <p className="mb-1 text-sm font-medium">
                    {isDragOver
                        ? 'Drop files here'
                        : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-muted-foreground">
                    or click to browse
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Documents, spreadsheets, presentations, images up to 50MB
                </p>
            </div>

            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((uf) => (
                        <div
                            key={uf.file.name}
                            className="flex items-center gap-3 rounded-md border bg-card p-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {uf.file.name}
                                </p>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{
                                            width: `${uf.progress}%`,
                                        }}
                                    />
                                </div>
                                {uf.error && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {uf.error}
                                    </p>
                                )}
                            </div>
                            {uf.progress === 0 && !uf.error && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => removeUploadingFile(uf.file)}
                                >
                                    <X className="size-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
