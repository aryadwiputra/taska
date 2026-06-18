import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    backHref?: ComponentProps<typeof Link>['href'];
    backLabel?: ReactNode;
    leading?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    backHref,
    backLabel,
    leading,
    badge,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {backHref && backLabel && (
                <Link
                    href={backHref}
                    className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    <span>{backLabel}</span>
                </Link>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    {leading}
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-[-0.03em] text-balance">
                                {title}
                            </h1>
                            {badge}
                        </div>
                        {description && (
                            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
