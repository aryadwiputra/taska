import { Head, Link } from '@inertiajs/react';
import { LayoutDashboard, Users, Building2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface Props {
    stats: {
        totalUsers: number;
        totalWorkspaces: number;
        totalProjects: number;
        recentUsers: RecentUser[];
    };
}

export default function AdminDashboard({ stats }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('admin.dashboard')} />

            <PageHeader
                title={t('admin.dashboard')}
                description={t('admin.system_overview')}
            />

            <div className="grid gap-6 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('admin.total_users')}
                        </CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                        <Link
                            href="/admin/users"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {t('admin.view_all')}{' '}
                            <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('admin.total_workspaces')}
                        </CardTitle>
                        <Building2 className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {stats.totalWorkspaces}
                        </p>
                        <Link
                            href="/admin/workspaces"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {t('admin.view_all')}{' '}
                            <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('admin.total_projects')}
                        </CardTitle>
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {stats.totalProjects}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t('admin.recent_registrations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('admin.no_recent_users')}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {user.created_at}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
