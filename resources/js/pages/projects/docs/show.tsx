'use no memo';

import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    History,
    Pencil,
    Plus,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RichEditor } from '@/components/rich-editor';
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
import { VersionHistory } from '@/components/version-history';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as docsDestroy,
    index as docsIndex,
    show as docsShow,
    store as docsStore,
    update as docsUpdate,
} from '@/routes/projects/docs';
import type { DocDetail, DocTreeItem } from '@/types/docs';

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: { id: number; name: string; key: string; slug: string };
    doc: DocDetail;
    docsTree: DocTreeItem[];
}

export default function DocsShow({
    workspace,
    project,
    doc: initialDoc,
    docsTree,
}: Props) {
    const { t } = useTranslation();
    const [doc, setDoc] = useState(initialDoc);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(doc.title);
    const [editContent, setEditContent] = useState(doc.content || '');
    const [editParentId, setEditParentId] = useState<string>(
        String(doc.parent_id ?? 'none'),
    );
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [versionsOpen, setVersionsOpen] = useState(false);

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

    const handleSave = () => {
        router.patch(
            docsUpdate.url({
                workspace: workspace.slug,
                project: project.slug,
                doc: doc.slug,
            }),
            {
                title: editTitle,
                content: editContent,
                parent_id:
                    editParentId !== 'none' ? Number(editParentId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditing(false),
            },
        );
    };

    const handleDelete = () => {
        if (!confirm(t('docs.delete_confirm'))) {
            return;
        }

        router.delete(
            docsDestroy.url({
                workspace: workspace.slug,
                project: project.slug,
                doc: doc.slug,
            }),
        );
    };

    const handleCreateChild = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTitle.trim()) {
            return;
        }

        router.post(
            docsStore.url({ workspace: workspace.slug, project: project.slug }),
            { title: newTitle, parent_id: doc.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreating(false);
                    setNewTitle('');
                },
            },
        );
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
        const isActive = node.id === doc.id;

        return (
            <div>
                <button
                    type="button"
                    onClick={() =>
                        router.visit(
                            docsShow.url({
                                workspace: workspace.slug,
                                project: project.slug,
                                doc: node.slug,
                            }),
                        )
                    }
                    className={cn(
                        'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                        isActive &&
                            'bg-accent font-medium text-accent-foreground',
                    )}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                    {hasChildren ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse(node.id);
                            }}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="size-3.5" />
                            ) : (
                                <ChevronDown className="size-3.5" />
                            )}
                        </span>
                    ) : (
                        <span className="size-3.5 shrink-0" />
                    )}
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{node.title}</span>
                </button>
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

        return result.filter((item) => item.id !== doc.id);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
            <Head
                title={`${doc.title} - ${project.name} - ${t('docs.title')}`}
            />

            <div className="flex items-center gap-3">
                <a
                    href={docsIndex.url({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    {t('docs.title')}
                </a>
                {doc.breadcrumbs.map((crumb) => (
                    <span key={crumb.slug} className="flex items-center gap-3">
                        <span className="text-muted-foreground">/</span>
                        <a
                            href={docsShow.url({
                                workspace: workspace.slug,
                                project: project.slug,
                                doc: crumb.slug,
                            })}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            {crumb.title}
                        </a>
                    </span>
                ))}
            </div>

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
                            </div>
                        )}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    {editing ? (
                        <div className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="edit-title">
                                    {t('docs.doc_title')}
                                </Label>
                                <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) =>
                                        setEditTitle(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-parent">
                                    {t('docs.parent_doc')}
                                </Label>
                                <Select
                                    value={editParentId}
                                    onValueChange={setEditParentId}
                                >
                                    <SelectTrigger id="edit-parent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('docs.none')}
                                        </SelectItem>
                                        {flattenForSelect(docsTree).map(
                                            (item) => (
                                                <SelectItem
                                                    key={item.id}
                                                    value={String(item.id)}
                                                >
                                                    {'\u00A0\u00A0'.repeat(
                                                        item.depth,
                                                    )}
                                                    {item.title}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('docs.doc_content')}</Label>
                                <RichEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSave}>
                                    {t('docs.save_doc')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditing(false);
                                        setEditTitle(doc.title);
                                        setEditContent(doc.content || '');
                                        setEditParentId(
                                            String(doc.parent_id ?? 'none'),
                                        );
                                    }}
                                >
                                    {t('docs.cancel')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl font-bold">
                                        {doc.title}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        {doc.author && (
                                            <span className="flex items-center gap-1">
                                                <User className="size-3" />
                                                {t('docs.created_by', {
                                                    name: doc.author.name,
                                                })}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {t('docs.last_edited', {
                                                name: '',
                                            }).replace(' ', '')}
                                            {formatDate(doc.updated_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setVersionsOpen(true)}
                                    >
                                        <History className="size-3.5" />
                                        <span className="hidden sm:inline">{t('docs.version_history')}</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditing(true)}
                                    >
                                        <Pencil className="size-3.5" />
                                        <span>{t('docs.edit_doc')}</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div
                                className="prose prose-sm max-w-none rounded-lg border border-border bg-card px-6 py-4"
                                dangerouslySetInnerHTML={{
                                    __html: doc.content || '',
                                }}
                            />

                            {(doc.children ?? []).length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                                        Sub-pages
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        {doc.children.map((child) => (
                                            <a
                                                key={child.id}
                                                href={docsShow.url({
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                    doc: child.slug,
                                                })}
                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                            >
                                                <FileText className="size-3.5 text-muted-foreground" />
                                                <span>{child.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-border pt-4">
                                {creating ? (
                                    <form
                                        onSubmit={handleCreateChild}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={newTitle}
                                            onChange={(e) =>
                                                setNewTitle(e.target.value)
                                            }
                                            placeholder={t('docs.doc_title')}
                                            autoFocus
                                        />
                                        <Button type="submit" size="sm">
                                            {t('docs.create_doc')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCreating(false)}
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    </form>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCreating(true)}
                                    >
                                        <Plus className="size-3.5" />
                                        <span>{t('docs.new_doc')}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <VersionHistory
                workspaceSlug={workspace.slug}
                projectSlug={project.slug}
                docSlug={doc.slug}
                open={versionsOpen}
                onOpenChange={setVersionsOpen}
            />
        </div>
    );
}
