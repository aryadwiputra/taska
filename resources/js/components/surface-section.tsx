import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type SurfaceSectionProps = ComponentProps<'section'> & {
    elevated?: boolean;
};

export function SurfaceSection({
    className,
    elevated = false,
    ...props
}: SurfaceSectionProps) {
    return (
        <section
            className={cn(
                'rounded-lg border border-border bg-card',
                elevated && 'shadow-soft',
                className,
            )}
            {...props}
        />
    );
}
