import { Head, Link } from '@inertiajs/react';
import { LayoutDashboard, Users, Building2, ArrowRight } from 'lucide-react';
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
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        System overview and management.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Users
                        </CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                        <Link
                            href="/admin/users"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            View all <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Workspaces
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
                            View all <ArrowRight className="size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Projects
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
                            Recent Registrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No recent users.
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
