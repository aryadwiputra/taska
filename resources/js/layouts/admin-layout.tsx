import { Link, usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { index as adminWorkspacesIndex } from '@/routes/admin/workspaces';

const navItems = [
    { href: adminDashboard().url, label: 'Dashboard' },
    { href: adminUsersIndex().url, label: 'Users' },
    { href: adminWorkspacesIndex().url, label: 'Workspaces' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const url = usePage().url;

    return (
        <AppShell variant="header">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
                <SidebarTrigger className="lg:hidden" />
                    <Link
                        href={adminDashboard()}
                        className="text-sm font-semibold tracking-tight"
                >
                    Admin
                </Link>
                <nav className="ml-8 flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm transition-colors hover:text-foreground ${
                                url === item.href ||
                                (item.href !== '/admin' &&
                                    url.startsWith(item.href))
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="ml-auto">
                    <Link
                        href={dashboard()}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Back to app
                    </Link>
                </div>
            </header>
            <AppContent variant="header">
                <main className="mx-auto w-full max-w-7xl px-6 py-8">
                    {children}
                </main>
            </AppContent>
        </AppShell>
    );
}
