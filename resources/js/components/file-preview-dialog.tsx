import { Download, FileText, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DocAttachment } from '@/lib/doc-attachments';

interface FilePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachment: DocAttachment | null;
    previewUrl?: string;
}

export function FilePreviewDialog({
    open,
    onOpenChange,
    attachment,
    previewUrl,
}: FilePreviewDialogProps) {
    if (!attachment) {
        return null;
    }

    const isImage = attachment.is_image && attachment.preview_url;
    const isPdf = attachment.is_pdf && attachment.preview_url;

    const handleDownload = () => {
        if (attachment.download_url) {
            window.open(attachment.download_url, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl gap-0 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-medium">
                            {attachment.file_name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {attachment.file_size_formatted}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            title="Download"
                        >
                            <Download className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex max-h-[70vh] items-start justify-center overflow-auto bg-muted/30">
                    {isImage && (
                        <img
                            src={previewUrl || attachment.preview_url || ''}
                            alt={attachment.file_name}
                            className="max-h-[70vh] max-w-full object-contain"
                        />
                    )}
                    {isPdf && (
                        <iframe
                            src={previewUrl || attachment.preview_url || ''}
                            title={attachment.file_name}
                            className="h-[70vh] w-full"
                        />
                    )}
                    {!isImage && !isPdf && (
                        <div className="flex flex-col items-center gap-4 py-20">
                            <div className="rounded-full bg-muted p-6">
                                <FileText className="size-12 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">
                                    Preview not available
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Download the file to view its contents
                                </p>
                            </div>
                            <Button onClick={handleDownload}>
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
