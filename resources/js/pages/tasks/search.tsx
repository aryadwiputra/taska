import { Head, router } from '@inertiajs/react';
import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { TaskSearchFilters } from '@/components/task-search-filters';
import type {
    TaskSearchFilters as TaskSearchFiltersState,
    TaskSearchOptions,
} from '@/components/task-search-filters';
import { TaskSearchResult } from '@/components/task-search-result';
import type { TaskSearchResultItem } from '@/components/task-search-result';
import { Button } from '@/components/ui/button';

interface Props {
    tasks: {
        data: TaskSearchResultItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: TaskSearchFiltersState;
    options: TaskSearchOptions;
}

export default function TaskSearch({ tasks, filters, options }: Props) {
    const { t } = useTranslation();
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerWorkspaceSlug, setDrawerWorkspaceSlug] = useState<string>('');
    const [drawerProjectSlug, setDrawerProjectSlug] = useState<string>('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <Head title={t('task_search.title')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('task_search.title')}
                    description={t('task_search.description')}
                    badge={
                        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {tasks.total}{' '}
                            {tasks.total === 1
                                ? t('task_search.result')
                                : t('task_search.results')}
                        </span>
                    }
                />

                <TaskSearchFilters filters={filters} options={options} />

                {tasks.data.length === 0 ? (
                    <EmptyState
                        icon={SearchX}
                        title={t('task_search.empty_title')}
                        description={t('task_search.empty_description')}
                        className="py-20"
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {tasks.data.map((task) => (
                            <TaskSearchResult
                                key={task.id}
                                task={task}
                                onOpen={(t) => {
                                    setDrawerTaskId(t.id);
                                    setDrawerWorkspaceSlug(t.workspace.slug);
                                    setDrawerProjectSlug(t.project.slug);
                                    setDrawerOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}

                {tasks.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 py-2">
                        {tasks.links
                            .filter(
                                (link) =>
                                    !link.label.includes('Previous') &&
                                    !link.label.includes('Next'),
                            )
                            .map((link, index) =>
                                link.url ? (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        className="h-8 min-w-8"
                                        onClick={() =>
                                            router.visit(link.url!, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            })
                                        }
                                    >
                                        {link.label
                                            .replace(/&laquo;|&raquo;/g, '')
                                            .trim()}
                                    </Button>
                                ) : (
                                    <span
                                        key={index}
                                        className="px-2 text-sm text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                    </div>
                )}
            </div>

            <TaskDetailDrawer
                workspaceSlug={drawerWorkspaceSlug}
                projectSlug={drawerProjectSlug}
                taskId={drawerTaskId}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onDelete={() => router.reload()}
            />
        </>
    );
}
