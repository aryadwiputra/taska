'use client';

import { driver } from 'driver.js';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';

export const TOUR_SEEN_KEY = 'tour_seen_dashboard';

let driverInstance: ReturnType<typeof driver> | null = null;

function createTourDriver(t: (key: string) => string) {
    if (driverInstance) {
        driverInstance.destroy();
    }

    const tourSteps = [
        {
            popover: {
                title: t('tour.welcome_title'),
                description: t('tour.welcome_description'),
                showButtons: ['close'],
                closeBtnLabel: t('tour.skip'),
            },
            onCloseClick: () => {
                localStorage.setItem(TOUR_SEEN_KEY, '1');
                driverInstance?.destroy();
                driverInstance = null;
            },
        },
        {
            element: '[data-tour="workspace-switcher"]',
            popover: {
                title: t('tour.switch_workspace_title'),
                description: t('tour.switch_workspace_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="sidebar-board"]',
            popover: {
                title: t('tour.board_title'),
                description: t('tour.board_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="new-task"]',
            popover: {
                title: t('tour.create_task_title'),
                description: t('tour.create_task_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="task-detail"]',
            popover: {
                title: t('tour.assign_members_title'),
                description: t('tour.assign_members_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="task-labels"]',
            popover: {
                title: t('tour.labels_title'),
                description: t('tour.labels_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="sidebar-sprints"]',
            popover: {
                title: t('tour.sprints_title'),
                description: t('tour.sprints_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            element: '[data-tour="sidebar-knowledge"]',
            popover: {
                title: t('tour.knowledge_title'),
                description: t('tour.knowledge_description'),
                showButtons: ['next', 'previous', 'close'],
            },
        },
        {
            popover: {
                title: t('tour.done_title'),
                description: t('tour.done_description'),
                showButtons: ['close'],
                closeBtnLabel: t('tour.close'),
            },
            onCloseClick: () => {
                localStorage.setItem(TOUR_SEEN_KEY, '1');
                driverInstance?.destroy();
                driverInstance = null;
            },
        },
    ];

    const tourDriver = driver({
        animate: true,
        allowClose: true,
        allowKeyboardControl: true,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 6,
        popoverClass: 'driverjs-theme',
        nextBtnText: t('tour.next'),
        prevBtnText: t('tour.previous'),
        doneBtnText: t('tour.finish'),
        closeBtnLabel: t('tour.close'),
        showProgress: true,
        progressText: t('tour.progress', { current: '{{current}}', total: '{{total}}' }),
        skipMissingElement: true,
        onDestroyed: () => {
            localStorage.setItem(TOUR_SEEN_KEY, '1');
            driverInstance = null;
        },
    });

    tourDriver.setSteps(tourSteps as Parameters<typeof tourDriver.setSteps>[0]);
    driverInstance = tourDriver;

    return tourDriver;
}

export function resetTourState() {
    localStorage.removeItem(TOUR_SEEN_KEY);
    if (driverInstance) {
        driverInstance.destroy();
        driverInstance = null;
    }
}

export function startTour() {
    if (typeof window === 'undefined') return;

    const t = (key: string) => i18n.t(key);
    const tourDriver = createTourDriver(t);
    tourDriver.drive();
}

export function useDashboardTour(isEnabled = true) {
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    const shouldRun = mounted && isEnabled && !localStorage.getItem(TOUR_SEEN_KEY);

    useEffect(() => {
        if (!shouldRun) return;

        const tourDriver = createTourDriver(t);
        tourDriver.drive();

        return () => {
            tourDriver.destroy();
            driverInstance = null;
        };
    }, [shouldRun, t]);

    return { mounted };
}
