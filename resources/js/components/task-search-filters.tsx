import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { search as taskSearch } from '@/routes/tasks';

export interface TaskSearchFilters {
    q: string | null;
    workspace_id: number | string | null;
    project_id: number | string | null;
    status: string | null;
    assignee_id: number | string | null;
    reporter_id: number | string | null;
    priority_id: number | string | null;
    label_id: number | string | null;
    due_from: string | null;
    due_to: string | null;
    created_from: string | null;
    created_to: string | null;
    state: string | null;
}

export interface TaskSearchOptions {
    workspaces: Array<{ id: number; name: string; slug: string }>;
    projects: Array<{
        id: number;
        workspace_id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    }>;
    priorities: Array<{
        id: number;
        workspace_id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    }>;
    labels: Array<{
        id: number;
        project_id: number;
        name: string;
        color: string | null;
    }>;
    users: Array<{ id: number; name: string; avatar: string | null }>;
}

interface Props {
    filters: TaskSearchFilters;
    options: TaskSearchOptions;
}

const ALL_FILTERS_VALUE = 'all';

const statusOptions = [
    { value: ALL_FILTERS_VALUE, label: 'All statuses' },
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
];

const stateOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
    { value: 'all', label: 'All states' },
];

export function TaskSearchFilters({ filters, options }: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(filters.q ?? '');
    const selectedWorkspaceId = filters.workspace_id?.toString() ?? null;
    const selectedProjectId = filters.project_id?.toString() ?? null;
    const visibleProjects = selectedWorkspaceId
        ? options.projects.filter(
              (project) =>
                  project.workspace_id.toString() === selectedWorkspaceId,
          )
        : options.projects;
    const visiblePriorities = selectedWorkspaceId
        ? options.priorities.filter(
              (priority) =>
                  priority.workspace_id.toString() === selectedWorkspaceId,
          )
        : options.priorities;
    const visibleLabels = selectedProjectId
        ? options.labels.filter(
              (label) => label.project_id.toString() === selectedProjectId,
          )
        : options.labels;

    const updateFilter = (key: keyof TaskSearchFilters, value: string) => {
        const params = new URLSearchParams(window.location.search);
        const normalizedValue = value === ALL_FILTERS_VALUE ? '' : value;

        if (normalizedValue) {
            params.set(key, normalizedValue);
        } else {
            params.delete(key);
        }

        params.delete('page');

        if (key === 'workspace_id') {
            params.delete('project_id');
            params.delete('priority_id');
            params.delete('label_id');
        }

        if (key === 'project_id') {
            params.delete('label_id');
        }

        router.visit(taskSearch({ query: Object.fromEntries(params) }), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateFilter('q', query.trim());
    };

    const clearFilters = () => {
        setQuery('');
        router.visit(taskSearch(), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <form onSubmit={submitSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('task.search_code_title_desc')}
                        className="pl-9"
                    />
                </div>
                <Button type="submit">{t('common.search')}</Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                    <X className="size-4" />
                    Clear
                </Button>
            </form>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <Select
                    value={filters.state ?? 'active'}
                    onValueChange={(value) => updateFilter('state', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                        {stateOptions.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.value === 'all'
                                    ? t('task_search.all_states')
                                    : t(`task_search.${option.value}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedWorkspaceId ?? ALL_FILTERS_VALUE}
                    onValueChange={(value) =>
                        updateFilter('workspace_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.all_workspaces')}
                        </SelectItem>
                        {options.workspaces.map((workspace) => (
                            <SelectItem
                                key={workspace.id}
                                value={workspace.id.toString()}
                            >
                                {workspace.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedProjectId ?? ALL_FILTERS_VALUE}
                    onValueChange={(value) =>
                        updateFilter('project_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.all_projects')}
                        </SelectItem>
                        {visibleProjects.map((project) => (
                            <SelectItem
                                key={project.id}
                                value={project.id.toString()}
                            >
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status ?? ALL_FILTERS_VALUE}
                    onValueChange={(value) => updateFilter('status', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.value === ALL_FILTERS_VALUE
                                    ? t('task_search.all_statuses')
                                    : t(`task_search.${option.value}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={
                        filters.priority_id?.toString() ?? ALL_FILTERS_VALUE
                    }
                    onValueChange={(value) =>
                        updateFilter('priority_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.all_priorities')}
                        </SelectItem>
                        {visiblePriorities.map((priority) => (
                            <SelectItem
                                key={priority.id}
                                value={priority.id.toString()}
                            >
                                {priority.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={
                        filters.label_id?.toString() ?? ALL_FILTERS_VALUE
                    }
                    onValueChange={(value) =>
                        updateFilter('label_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Label" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.all_labels')}
                        </SelectItem>
                        {visibleLabels.map((label) => (
                            <SelectItem
                                key={label.id}
                                value={label.id.toString()}
                            >
                                {label.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={
                        filters.assignee_id?.toString() ?? ALL_FILTERS_VALUE
                    }
                    onValueChange={(value) =>
                        updateFilter('assignee_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.any_assignee')}
                        </SelectItem>
                        {options.users.map((user) => (
                            <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                            >
                                {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={
                        filters.reporter_id?.toString() ?? ALL_FILTERS_VALUE
                    }
                    onValueChange={(value) =>
                        updateFilter('reporter_id', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Reporter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTERS_VALUE}>
                            {t('task_search.any_reporter')}
                        </SelectItem>
                        {options.users.map((user) => (
                            <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                            >
                                {user.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input
                    type="date"
                    value={filters.due_from ?? ''}
                    onChange={(event) =>
                        updateFilter('due_from', event.target.value)
                    }
                    aria-label="Due from"
                />
                <Input
                    type="date"
                    value={filters.due_to ?? ''}
                    onChange={(event) =>
                        updateFilter('due_to', event.target.value)
                    }
                    aria-label="Due to"
                />
                <Input
                    type="date"
                    value={filters.created_from ?? ''}
                    onChange={(event) =>
                        updateFilter('created_from', event.target.value)
                    }
                    aria-label="Created from"
                />
                <Input
                    type="date"
                    value={filters.created_to ?? ''}
                    onChange={(event) =>
                        updateFilter('created_to', event.target.value)
                    }
                    aria-label="Created to"
                />
            </div>
        </div>
    );
}
