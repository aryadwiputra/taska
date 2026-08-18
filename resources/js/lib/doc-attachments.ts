import { show as docShow } from '@/routes/projects/docs';

export interface DocAttachment {
    id: number;
    file_name: string;
    mime_type: string | null;
    file_size: number;
    file_size_formatted: string;
    is_image: boolean;
    is_pdf: boolean;
    is_previewable: boolean;
    url: string | null;
    preview_url: string | null;
    download_url: string | null;
    uploaded_by: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    created_at: string;
}

export interface ListAttachmentsResponse {
    attachments: DocAttachment[];
}

export async function listAttachments(
    workspaceSlug: string,
    projectSlug: string,
    docSlug: string,
): Promise<DocAttachment[]> {
    const docUrl = docShow.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug });
    const response = await fetch(`${docUrl}/attachments`, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch attachments');
    }

    const data: ListAttachmentsResponse = await response.json();
    return data.attachments;
}

export async function uploadAttachment(
    workspaceSlug: string,
    projectSlug: string,
    docSlug: string,
    file: File,
    onProgress?: (percent: number) => void,
): Promise<DocAttachment> {
    const docUrl = docShow.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug });

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.attachment);
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.message || errorData.errors?.file?.[0] || 'Upload failed'));
                } catch {
                    reject(new Error('Upload failed'));
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });

        const csrfToken = decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
        );

        xhr.open('POST', `${docUrl}/attachments`);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
        xhr.send(formData);
    });
}

export async function deleteAttachment(
    workspaceSlug: string,
    projectSlug: string,
    docSlug: string,
    attachmentId: number,
): Promise<void> {
    const docUrl = docShow.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug });
    const csrfToken = decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );

    const response = await fetch(`${docUrl}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to delete attachment');
    }
}

export function downloadAttachment(
    workspaceSlug: string,
    projectSlug: string,
    docSlug: string,
    attachmentId: number,
): void {
    const docUrl = docShow.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug });
    window.open(`${docUrl}/attachments/${attachmentId}/download`, '_blank');
}

export function previewAttachment(
    workspaceSlug: string,
    projectSlug: string,
    docSlug: string,
    attachmentId: number,
): string {
    const docUrl = docShow.url({ workspace: workspaceSlug, project: projectSlug, doc: docSlug });
    return `${docUrl}/attachments/${attachmentId}/preview`;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() ?? '' : '';
}

export function getFileTypeCategory(mimeType: string | null): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'other' {
    if (!mimeType) {
        return 'other';
    }

    if (mimeType.startsWith('image/')) {
        return 'image';
    }

    if (mimeType === 'application/pdf') {
        return 'pdf';
    }

    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
        return 'spreadsheet';
    }

    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return 'presentation';
    }

    if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) {
        return 'document';
    }

    return 'other';
}
