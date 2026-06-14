import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Search, Trash2, ShieldCheck, Shield } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface UserData {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    email_verified_at: string | null;
    workspaces_count: number;
    deleted_at: string | null;
    created_at: string;
}

interface Pagination {
    data: UserData[];
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
    users: Pagination;
    filters: { search: string | null };
}

function UserFormDialog({
    user,
    open,
    onOpenChange,
}: {
    user?: UserData | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        is_super_admin: user?.is_super_admin ?? false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();

        if (user) {
            patch(`/admin/users/${user.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/admin/users', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                onOpenChange(v);

                if (!v) {
                    reset();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {user ? 'Edit User' : 'Create User'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {user
                                ? 'New password (leave blank to keep)'
                                : 'Password'}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="is_super_admin"
                            checked={data.is_super_admin}
                            onCheckedChange={(v) =>
                                setData('is_super_admin', v)
                            }
                        />
                        <Label htmlFor="is_super_admin">Super Admin</Label>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        {user ? 'Update' : 'Create'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(
            '/admin/users',
            { search },
            { preserveState: true, replace: true },
        );
    }

    function handleDelete(user: UserData) {
        if (!confirm(`Delete user "${user.name}"?`)) {
            return;
        }

        router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
    }

    function openEdit(user: UserData) {
        setEditingUser(user);
        setFormOpen(true);
    }

    function openCreate() {
        setEditingUser(null);
        setFormOpen(true);
    }

    const noResults = users.meta.total === 0;

    return (
        <>
            <Head title="Admin Users" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Users
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage all registered users.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="flex items-center gap-2"
                >
                    <Plus className="size-4" />
                    Create User
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent className="p-0">
                    {noResults ? (
                        <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
                            {filters.search
                                ? 'No users matching your search.'
                                : 'No users found.'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Workspaces</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-24" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.meta.links &&
                                    users.data?.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                {user.is_super_admin ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                        <ShieldCheck className="size-3" />
                                                        Super Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Shield className="size-3" />
                                                        User
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.workspaces_count}
                                            </TableCell>
                                            <TableCell>
                                                {user.deleted_at ? (
                                                    <span className="text-xs text-red-500">
                                                        Deleted
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        Active
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {user.created_at}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() =>
                                                            openEdit(user)
                                                        }
                                                    >
                                                        <span className="sr-only">
                                                            Edit
                                                        </span>
                                                        <svg
                                                            className="size-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-red-500"
                                                        onClick={() =>
                                                            handleDelete(user)
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {users.meta?.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    {users.meta.links?.map((link, i) => (
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

            <UserFormDialog
                user={editingUser}
                open={formOpen}
                onOpenChange={setFormOpen}
            />
        </>
    );
}
