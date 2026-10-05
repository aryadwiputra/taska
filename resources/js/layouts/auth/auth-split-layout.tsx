import AuthBrandPanel from '@/components/auth-brand-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import type { AuthLayoutProps } from '@/types';

/**
 * Split auth layout: brand panel on the left, form column on the right.
 *
 * Below `lg` the panel drops away and the form centers with the theme toggle
 * in the corner, so the mobile view is one column with a single focal point.
 */
export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
            <AuthBrandPanel />

            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
                <ThemeToggle className="absolute top-6 right-6" />

                <div className="mx-auto w-full max-w-sm">
                    {title && (
                        <div className="mb-8 flex flex-col gap-2">
                            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-balance text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
