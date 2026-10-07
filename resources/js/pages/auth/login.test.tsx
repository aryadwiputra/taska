import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Login from '@/pages/auth/login';

describe('Login', () => {
    it('renders the email and password fields and the submit button', () => {
        render(<Login canResetPassword={true} />);

        expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'auth.log_in' }),
        ).toHaveAttribute('data-test', 'login-button');
    });

    it('offers a password reset link when resetting is available', () => {
        render(<Login canResetPassword={true} />);

        expect(
            screen.getByRole('link', { name: 'auth.forgot_password' }),
        ).toBeInTheDocument();
    });

    it('hides the password reset link when resetting is unavailable', () => {
        render(<Login canResetPassword={false} />);

        expect(
            screen.queryByRole('link', { name: 'auth.forgot_password' }),
        ).not.toBeInTheDocument();
    });

    it('links to a sign-up page', () => {
        render(<Login canResetPassword={true} />);

        expect(screen.getByRole('link', { name: 'auth.sign_up' })).toBeInTheDocument();
        expect(screen.getByText('auth.no_account')).toBeInTheDocument();
    });
});
