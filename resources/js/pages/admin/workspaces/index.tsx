import { Head, Link, router } from '@inertiajs/react';
import { Archive, Search, Users } from 'lucide-react';
import { useState  } from 'react';
import type {FormEvent} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface WorkspaceData {
    id: number;
    name: string;
    slug: string;
    status: string;
    members_count: number;
    projects_count: number;
    deleted_at: string | null;
    created_at: string;
}

interface Pagination {
    data: WorkspaceData[];
    meta: {
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

interface Props {
    workspaces: Pagination;
    filters: { search: string | null; archived: boolean };
}

export default function AdminWorkspacesIndex({ workspaces, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(
            '/admin/workspaces',
            { search, archived: filters.archived },
            { preserveState: true, replace: true },
        );
    }

    function toggleArchived() {
        router.get(
            '/admin/workspaces',
            { search: filters.search, archived: !filters.archived },
            { preserveState: true, replace: true },
        );
    }

    const noResults = workspaces.meta.total === 0;

    return (
        <>
            <Head title="Admin Workspaces" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Workspaces
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        All workspaces across the system.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1"
                        >
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search workspaces..."
                                className="pl-9"
                            />
                        </form>
                        <Button
                            type="submit"
                            variant="secondary"
                            onClick={toggleArchived}
                        >
                            <Archive className="mr-1 size-4" />
                            {filters.archived ? 'Active' : 'Archived'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {noResults ? (
                        <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
                            {filters.search
                                ? 'No workspaces matching your search.'
                                : 'No workspaces found.'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Projects</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workspaces.data?.map((ws) => (
                                    <TableRow key={ws.id}>
                                        <TableCell className="font-medium">
                                            {ws.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {ws.slug}
                                        </TableCell>
                                        <TableCell>
                                            {ws.deleted_at ? (
                                                <span className="text-xs text-red-500">
                                                    Archived
                                                </span>
                                            ) : (
                                                <span className="text-xs text-green-600 dark:text-green-400">
                                                    Active
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <Users className="size-3 text-muted-foreground" />
                                                {ws.members_count}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {ws.projects_count}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {ws.created_at}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/admin/workspaces/${ws.id}`}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {workspaces.meta?.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    {workspaces.meta.links?.map((link, i) => (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.get(
                                    link.url,
                                    {},
                                    { preserveState: true, replace: true },
                                )
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
