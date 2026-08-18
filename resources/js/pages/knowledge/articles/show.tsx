import { ArrowLeft, BookOpen, Edit, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { router, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Article } from '@/types/knowledge';

interface Props {
    article: Article;
    canEdit: boolean;
}

export default function ArticleShow({ article, canEdit }: Props) {
    const { t } = useTranslation();
    const { props } = usePage();
    const workspaceSlug = (props.currentWorkspace as { slug: string })?.slug;

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [editTitle, setEditTitle] = useState(article.title);
    const [editContent, setEditContent] = useState(article.content ?? '');
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleDelete = () => {
        router.delete(
            route('knowledge.articles.destroy', {
                workspace: workspaceSlug,
                article: article.slug,
            }),
            {
                onSuccess: () => {
                    router.get(route('knowledge.index', { workspace: workspaceSlug }));
                },
            },
        );
    };

    const handleEdit = () => {
        router.patch(
            route('knowledge.articles.update', {
                workspace: workspaceSlug,
                article: article.slug,
            }),
            {
                title: editTitle,
                content: editContent,
            },
            {
                onSuccess: () => {
                    setShowEditDialog(false);
                },
            },
        );
    };

    const handlePublish = () => {
        router.patch(
            route('knowledge.articles.update', {
                workspace: workspaceSlug,
                article: article.slug,
            }),
            {
                status: article.status === 'published' ? 'draft' : 'published',
            },
        );
    };

    const handleUpload = async () => {
        if (!uploadingFile) return;

        setUploadError(null);
        const formData = new FormData();
        formData.append('file', uploadingFile);

        try {
            const response = await fetch(
                route('knowledge.articles.attachments.store', {
                    workspace: workspaceSlug,
                    article: article.slug,
                }),
                {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': decodeURIComponent(
                            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                        ),
                    },
                    body: formData,
                },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.errors?.file?.[0] || data.message || 'Upload failed');
            }

            setShowUploadDialog(false);
            setUploadingFile(null);
            router.reload();
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        router.get(route('knowledge.index', { workspace: workspaceSlug }))
                    }
                >
                    <ArrowLeft className="size-4" />
                    Back to Knowledge Base
                </Button>

                {canEdit && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePublish}
                        >
                            {article.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditTitle(article.title);
                                setEditContent(article.content ?? '');
                                setShowEditDialog(true);
                            }}
                        >
                            <Edit className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUploadDialog(true)}
                        >
                            <Plus className="size-4" />
                            Attach File
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                )}
            </div>

            <article className="rounded-lg border bg-card p-6">
                <header className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                        {article.category && (
                            <span
                                className="rounded px-2 py-1 text-xs font-medium"
                                style={{
                                    backgroundColor: `${article.category.color}20`,
                                    color: article.category.color,
                                }}
                            >
                                {article.category.name}
                            </span>
                        )}
                        {article.status === 'draft' && (
                            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                Draft
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold">{article.title}</h1>

                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By {article.author?.name}</span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                            <Eye className="size-4" />
                            {article.views} views
                        </span>
                        <span>&middot;</span>
                        <span>
                            {new Date(article.published_at ?? article.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </header>

                <Separator className="my-6" />

                <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
                />
            </article>

            {article.attachments && article.attachments.length > 0 && (
                <section>
                    <h2 className="mb-4 text-lg font-semibold">Attachments</h2>
                    <div className="rounded-lg border">
                        {article.attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between border-b px-4 py-3 last:border-0"
                            >
                                <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 hover:text-primary"
                                >
                                    <FileText className="size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            {attachment.file_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {attachment.file_size_formatted}
                                        </p>
                                    </div>
                                </a>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            // Handle delete attachment
                                        }}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Article</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this article? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-content">Content</Label>
                            <textarea
                                id="edit-content"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Write your article content here..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Attachment</DialogTitle>
                        <DialogDescription>
                            Upload a file to attach to this article. Max size: 50MB.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="file"
                            onChange={(e) =>
                                setUploadingFile(e.target.files?.[0] ?? null)
                            }
                        />
                        {uploadError && (
                            <p className="text-sm text-destructive">{uploadError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowUploadDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={!uploadingFile}>
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
