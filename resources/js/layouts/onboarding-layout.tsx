import { Head, Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { dashboard } from '@/routes';

export default function OnboardingLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('onboarding.get_started')} />
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6">
                <Link
                    href={dashboard()}
                    className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <AppLogo />
                </Link>
                <div className="w-full max-w-lg">{children}</div>
            </div>
        </>
    );
}
