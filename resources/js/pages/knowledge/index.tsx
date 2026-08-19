import { BookOpen, ChevronRight, Folder, Plus, Search } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/empty-state';
import knowledgeArticles from '@/routes/knowledge/articles';
import knowledgeRoutes from '@/routes/knowledge';
import type { Category, ArticleListItem } from '@/types/knowledge';

interface Props {
    categories: Category[];
    recentArticles: ArticleListItem[];
}

export default function KnowledgeIndex({ categories, recentArticles }: Props) {
    const { t } = useTranslation();
    const { props } = usePage();
    const workspaceSlug = (props.currentWorkspace as { slug: string })?.slug;

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createType, setCreateType] = useState<'category' | 'article'>('article');
    const [newName, setNewName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            const url = new URL(knowledgeArticles.search.url({ workspace: workspaceSlug }, { query: { q: searchQuery } }, window.location.origin));
            router.get(url.pathname + url.search, { q: searchQuery });
        }
    };

    const handleCreateArticle = () => {
        if (!newName.trim()) return;

        router.post(
            knowledgeArticles.store.url({ workspace: workspaceSlug }),
            {
                title: newName,
                status: 'draft',
                category_id: selectedCategory?.id,
            },
            {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    setNewName('');
                    setSelectedCategory(null);
                },
            },
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                        <BookOpen className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Knowledge Base</h1>
                        <p className="text-sm text-muted-foreground">
                            Articles and documentation for your team
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="size-4" />
                    Create
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
            </div>

            {categories.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Categories</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() =>
                                    router.get(
                                        `/workspaces/${workspaceSlug}/knowledge/categories/${category.slug}`,
                                    )
                                }
                                className="group flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
                            >
                                <div
                                    className="rounded-lg p-2"
                                    style={{ backgroundColor: `${category.color}20` }}
                                >
                                    <Folder
                                        className="size-5"
                                        style={{ color: category.color }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium group-hover:text-primary">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {category.articles_count} article
                                        {category.articles_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h2 className="mb-4 text-lg font-semibold">Recent Articles</h2>
                {recentArticles.length > 0 ? (
                    <div className="space-y-2">
                        {recentArticles.map((article) => (
                            <button
                                key={article.id}
                                onClick={() =>
                                    router.get(
                                        knowledgeRoutes.article.url({ workspace: workspaceSlug, article: article.slug }),
                                    )
                                }
                                className="group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium group-hover:text-primary">
                                            {article.title}
                                        </h3>
                                        {article.status === 'draft' && (
                                            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {article.author?.name} &middot; {article.views} views
                                    </p>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={BookOpen}
                        title="No articles yet"
                        description="Create your first article to get started"
                    />
                )}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {createType === 'category'
                                ? t('knowledge.create_category')
                                : t('knowledge.create_article')}
                        </DialogTitle>
                        <DialogDescription>
                            {createType === 'category'
                                ? 'Create a new category to organize your articles'
                                : 'Create a new article in the knowledge base'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-2">
                        <Button
                            variant={createType === 'article' ? 'default' : 'outline'}
                            onClick={() => setCreateType('article')}
                            size="sm"
                        >
                            Article
                        </Button>
                        <Button
                            variant={createType === 'category' ? 'default' : 'outline'}
                            onClick={() => setCreateType('category')}
                            size="sm"
                        >
                            Category
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {createType === 'category' ? 'Category Name' : 'Article Title'}
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={
                                    createType === 'category'
                                        ? 'Getting Started'
                                        : 'How to use Taska'
                                }
                            />
                        </div>

                        {createType === 'article' && categories.length > 0 && (
                            <div className="space-y-2">
                                <Label>Category (optional)</Label>
                                <select
                                    value={selectedCategory?.id ?? ''}
                                    onChange={(e) => {
                                        const cat = categories.find(
                                            (c) => c.id === Number(e.target.value),
                                        );
                                        setSelectedCategory(cat ?? null);
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="">No category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateArticle} disabled={!newName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
