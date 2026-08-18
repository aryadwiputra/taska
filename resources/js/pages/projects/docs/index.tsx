'use no memo';

import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    Plus,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as docsDestroy,
    search as searchRoute,
    show as docsShow,
    store as docsStore,
} from '@/routes/projects/docs';
import { FileList } from '@/components/file-list';
import { FilePreviewDialog } from '@/components/file-preview-dialog';
import { UploadDropzone } from '@/components/file-upload-dropzone';
import type { DocAttachment } from '@/lib/doc-attachments';
import {
    listAttachments,
    previewAttachment,
} from '@/lib/doc-attachments';
import type { DocTreeItem } from '@/types/docs';

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: { id: number; name: string; key: string; slug: string };
    docsTree: DocTreeItem[];
}

export default function DocsIndex({ workspace, project, docsTree }: Props) {
    const { t } = useTranslation();
    const { isCurrentUrl } = useCurrentUrl();
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newParentId, setNewParentId] = useState<string>('none');
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<DocTreeItem[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [selectedDoc, setSelectedDoc] = useState<DocTreeItem | null>(null);
    const [attachments, setAttachments] = useState<DocAttachment[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<DocAttachment | null>(null);
    const [showUpload, setShowUpload] = useState(false);

    const handleSearch = useCallback(
        (q: string) => {
            setSearchQuery(q);

            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }

            if (!q.trim()) {
                setSearchResults([]);
                setSearching(false);

                return;
            }

            searchTimerRef.current = setTimeout(() => {
                setSearching(true);

                fetch(
                    searchRoute.url({
                        workspace: workspace.slug,
                        project: project.slug,
                    }) +
                        '?q=' +
                        encodeURIComponent(q),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                )
                    .then((r) => r.json())
                    .then(setSearchResults)
                    .finally(() => setSearching(false));
            }, 300);
        },
        [workspace.slug, project.slug],
    );

    const toggleCollapse = (id: number) => {
        setCollapsed((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTitle.trim()) {
            return;
        }

        router.post(
            docsStore.url({ workspace: workspace.slug, project: project.slug }),
            {
                title: newTitle,
                parent_id: newParentId !== 'none' ? Number(newParentId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreating(false);
                    setNewTitle('');
                    setNewParentId('none');
                },
            },
        );
    };

    const handleDelete = (doc: DocTreeItem) => {
        if (!confirm(t('docs.delete_confirm'))) {
            return;
        }

        router.delete(
            docsDestroy.url({
                workspace: workspace.slug,
                project: project.slug,
                doc: doc.slug,
            }),
            { preserveScroll: true },
        );
    };

    const loadAttachments = async (doc: DocTreeItem) => {
        setAttachmentsLoading(true);
        try {
            const data = await listAttachments(workspace.slug, project.slug, doc.slug);
            setAttachments(data);
        } catch (error) {
            console.error('Failed to load attachments:', error);
        } finally {
            setAttachmentsLoading(false);
        }
    };

    const handleUploadComplete = (attachment: DocAttachment) => {
        setAttachments((prev) => [attachment, ...prev]);
    };

    const handleAttachmentsChange = (newAttachments: DocAttachment[]) => {
        setAttachments(newAttachments);
    };

    const DocTreeNode = ({
        node,
        depth,
    }: {
        node: DocTreeItem;
        depth: number;
    }) => {
        const hasChildren = (node.children ?? []).length > 0;
        const isCollapsed = collapsed.has(node.id);

        return (
            <div>
                <div
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleCollapse(node.id)}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="size-3.5" />
                            ) : (
                                <ChevronDown className="size-3.5" />
                            )}
                        </button>
                    ) : (
                        <span className="size-3.5 shrink-0" />
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            if (isCurrentUrl(docsShow.url({ workspace: workspace.slug, project: project.slug, doc: node.slug }))) {
                                setSelectedDoc(node);
                                loadAttachments(node);
                            } else {
                                router.visit(
                                    docsShow.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                        doc: node.slug,
                                    }),
                                );
                            }
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{node.title}</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(node);
                        }}
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                        <Trash2 className="size-3" />
                    </button>
                </div>
                {hasChildren && !isCollapsed && (
                    <div>
                        {node.children.map((child) => (
                            <DocTreeNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const flattenForSelect = (
        nodes: DocTreeItem[],
        depth = 0,
    ): Array<{ id: number; title: string; depth: number }> => {
        const result: Array<{ id: number; title: string; depth: number }> = [];

        for (const node of nodes) {
            result.push({ id: node.id, title: node.title, depth });
            result.push(...flattenForSelect(node.children, depth + 1));
        }

        return result;
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
            <Head title={`${project.name} - ${t('docs.title')}`} />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <a
                        href={projectShow.url({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        {project.name}
                    </a>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{t('docs.title')}</h1>
                </div>
                <Button size="sm" onClick={() => setCreating(!creating)}>
                    <Plus className="size-4" />
                    <span>{t('docs.new_doc')}</span>
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={t('docs.search_docs')}
                    className="pl-9"
                />
                {searchQuery && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-soft">
                        {searchResults.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() =>
                                    router.visit(
                                        docsShow.url({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                            doc: r.slug,
                                        }),
                                    )
                                }
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                            >
                                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{r.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {creating && (
                <form
                    onSubmit={handleCreate}
                    className="rounded-lg border border-border bg-card p-4"
                >
                    <div className="flex flex-col gap-3">
                        <div>
                            <Label htmlFor="new-title">
                                {t('docs.doc_title')}
                            </Label>
                            <Input
                                id="new-title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder={t('docs.doc_title')}
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label htmlFor="new-parent">
                                {t('docs.parent_doc')}
                            </Label>
                            <Select
                                value={newParentId}
                                onValueChange={setNewParentId}
                            >
                                <SelectTrigger id="new-parent">
                                    <SelectValue placeholder={t('docs.none')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        {t('docs.none')}
                                    </SelectItem>
                                    {flattenForSelect(docsTree).map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {'\u00A0\u00A0'.repeat(item.depth)}
                                            {item.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm">
                                {t('docs.create_doc')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCreating(false)}
                            >
                                {t('docs.cancel')}
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            <div className="flex flex-1 gap-6">
                <div className="w-72 shrink-0">
                    <div className="rounded-lg border border-border bg-card p-2">
                        {docsTree.length > 0 ? (
                            docsTree.map((node) => (
                                <DocTreeNode
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                <FileText className="size-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    {t('docs.empty_title')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('docs.empty_description')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Folder className="size-4 text-muted-foreground" />
                            <span className="font-medium">Files</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUpload(!showUpload)}
                        >
                            <Upload className="size-4" />
                            <span>Upload</span>
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {showUpload && (
                            <div className="mb-4">
                                <UploadDropzone
                                    workspaceSlug={workspace.slug}
                                    projectSlug={project.slug}
                                    docSlug={selectedDoc?.slug || ''}
                                    onUploadComplete={handleUploadComplete}
                                />
                            </div>
                        )}

                        <FileList
                            workspaceSlug={workspace.slug}
                            projectSlug={project.slug}
                            docSlug={selectedDoc?.slug || ''}
                            attachments={attachments}
                            onAttachmentsChange={handleAttachmentsChange}
                            onPreview={setPreviewAttachment}
                        />

                        {!showUpload && attachments.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <FileText className="size-12 text-muted-foreground/30" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    No files yet
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Upload files to this folder
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => setShowUpload(true)}
                                >
                                    <Upload className="size-4" />
                                    <span>Upload files</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FilePreviewDialog
                open={previewAttachment !== null}
                onOpenChange={(open) => !open && setPreviewAttachment(null)}
                attachment={previewAttachment}
            />
        </div>
    );
}
