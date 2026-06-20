import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Search, Trash2, ShieldCheck, Shield } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
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
import {
    index as adminUsersIndex,
    store as adminUsersStore,
    update as adminUsersUpdate,
    destroy as adminUsersDestroy,
} from '@/routes/admin/users';

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
    const { t } = useTranslation();
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        is_super_admin: user?.is_super_admin ?? false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();

        if (user) {
            patch(adminUsersUpdate(user.id).url, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post(adminUsersStore().url, {
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
                        {user ? t('admin.edit_user') : t('admin.create_user')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('admin.name')}</Label>
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
                        <Label htmlFor="email">{t('admin.email')}</Label>
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
                                ? t('admin.new_password_leave_blank')
                                : t('admin.password')}
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
                        <Label htmlFor="is_super_admin">
                            {t('admin.super_admin')}
                        </Label>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        {user ? t('common.update') : t('common.create')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersIndex({ users, filters }: Props) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(
            adminUsersIndex(),
            { search },
            { preserveState: true, replace: true },
        );
    }

    function handleDelete(user: UserData) {
        if (!confirm(`Delete user "${user.name}"?`)) {
            return;
        }

        router.delete(adminUsersDestroy(user.id), { preserveScroll: true });
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
            <Head title={t('admin.users')} />

            <PageHeader
                className="mb-6"
                title={t('admin.users')}
                description={t('admin.manage_all_users')}
                actions={
                    <Button
                        onClick={openCreate}
                        className="flex items-center gap-2"
                    >
                        <Plus className="size-4" />
                        {t('admin.create_user')}
                    </Button>
                }
            />

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
                                placeholder={t('admin.search_by_name_or_email')}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            {t('common.search')}
                        </Button>
                    </form>
                </CardHeader>
                <CardContent className="p-0">
                    {noResults ? (
                        <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
                            {filters.search
                                ? t('admin.no_users_matching')
                                : t('admin.no_users_found')}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.name')}</TableHead>
                                    <TableHead>{t('admin.email')}</TableHead>
                                    <TableHead>{t('admin.role')}</TableHead>
                                    <TableHead>
                                        {t('admin.workspaces')}
                                    </TableHead>
                                    <TableHead>{t('admin.status')}</TableHead>
                                    <TableHead>{t('admin.joined')}</TableHead>
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
                                                        {t('admin.super_admin')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Shield className="size-3" />
                                                        {t('admin.user')}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.workspaces_count}
                                            </TableCell>
                                            <TableCell>
                                                {user.deleted_at ? (
                                                    <span className="text-xs text-red-500">
                                                        {t('admin.deleted')}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                        {t('admin.active')}
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
                                                            {t('common.edit')}
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
