import { createInertiaApp } from '@inertiajs/react';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { SocketProvider } from '@/hooks/socket-context';
import i18n from '@/i18n/config';
import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import OnboardingLayout from '@/layouts/onboarding-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('admin/'):
                return AdminLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('onboarding/'):
                return OnboardingLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app, { page }) {
        const locale =
            (page.props?.auth as { user?: { locale?: string } })?.user
                ?.locale ?? 'en';

        if (locale !== i18n.language) {
            i18n.changeLanguage(locale);
        }

        return (
            <I18nextProvider i18n={i18n}>
                <SocketProvider>
                    <TooltipProvider delayDuration={0}>
                        <ErrorBoundary>{app}</ErrorBoundary>
                        <Toaster />
                    </TooltipProvider>
                </SocketProvider>
            </I18nextProvider>
        );
    },
    progress: {
        color: '#0075de',
    },
});

// This will set light / dark mode on load...
initializeTheme();
