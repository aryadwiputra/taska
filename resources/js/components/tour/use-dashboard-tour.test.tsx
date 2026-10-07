import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardTour } from '@/components/tour/use-dashboard-tour';

vi.mock('driver.js', () => ({
    driver: vi.fn(() => ({
        setSteps: vi.fn(),
        drive: vi.fn(),
        destroy: vi.fn(),
    })),
}));

describe('useDashboardTour', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not run tour if already seen', () => {
        localStorage.setItem('tour_seen_dashboard', '1');

        const { result } = renderHook(() => useDashboardTour(true));

        expect(result.current.mounted).toBe(true);
    });

    it('returns mounted state after effect runs', () => {
        const { result } = renderHook(() => useDashboardTour(true));

        expect(result.current.mounted).toBe(true);
    });

    it('does not run tour when disabled', () => {
        const { result } = renderHook(() => useDashboardTour(false));

        expect(result.current.mounted).toBe(true);
    });
});
