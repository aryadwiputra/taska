'use no memo';

import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
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
    show as docsShow,
    store as docsStore,
} from '@/routes/projects/docs';
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

    const DocTreeNode = ({
        node,
        depth,
    }: {
        node: DocTreeItem;
        depth: number;
    }) => {
        const hasChildren = node.children.length > 0;
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
                        onClick={() =>
                            router.visit(
                                docsShow.url({
                                    workspace: workspace.slug,
                                    project: project.slug,
                                    doc: node.slug,
                                }),
                            )
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
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

                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border">
                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                        <FileText className="size-12 text-muted-foreground/30" />
                        <p className="text-base font-medium text-muted-foreground">
                            {t('docs.empty_title')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t('docs.empty_description')}
                        </p>
                        <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => setCreating(true)}
                        >
                            <Plus className="size-4" />
                            <span>{t('docs.create_doc')}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
