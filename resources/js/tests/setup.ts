import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    router: {
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        visit: vi.fn(),
    },
    usePage: vi.fn(() => ({
        props: {
            auth: { user: { id: 1, name: 'Test User' } },
        },
    })),
    useForm: vi.fn(() => ({
        data: {},
        setData: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    })),
    Form: vi.fn(({ children }) => children({ processing: false, errors: {} })),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: { type: '3rdParty' },
}));

vi.mock('i18next', () => ({
    default: {
        use: vi.fn().mockReturnThis(),
        init: vi.fn(),
        changeLanguage: vi.fn(),
        t: vi.fn((key: string) => key),
        language: 'en',
    },
}));

window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = vi.fn();
