import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./resources/js/tests/setup.tsx'],
        include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['resources/js/**/*.{ts,tsx}'],
            exclude: [
                'resources/js/actions/**',
                'resources/js/routes/**',
                'resources/js/wayfinder/**',
                'resources/js/tests/**',
                'resources/js/i18n/**',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
});
