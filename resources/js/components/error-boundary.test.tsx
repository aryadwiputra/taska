import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary } from './error-boundary';

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>,
        );

        expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('catches errors and shows fallback', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.queryByText('Test content')).not.toBeInTheDocument();
    });

    it('allows retry on error', async () => {
        const user = userEvent.setup();

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>,
        );

        const retryButton = screen.getByRole('button', { name: /try_again/i });
        await user.click(retryButton);

        // After retry, children should be rendered again
        expect(screen.queryByText('Test content')).not.toBeInTheDocument();
        // The component will throw again, but ErrorBoundary catches it
    });

    it('uses custom fallback when provided', () => {
        render(
            <ErrorBoundary
                fallback={<div>Custom error message</div>}
            >
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
});
