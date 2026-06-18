import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
    icon?: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card px-6 py-16 text-center',
                className,
            )}
        >
            {Icon && <Icon className="size-10 text-muted-foreground/45" />}
            <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold tracking-[-0.01em]">
                    {title}
                </p>
                {description && (
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
