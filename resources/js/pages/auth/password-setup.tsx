'use client';

import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    email: string;
    workspaceName: string;
    inviterName: string;
    role: string;
};

export default function PasswordSetup({ email, workspaceName, inviterName, role }: Props) {
    const { t } = useTranslation();

    setLayoutProps({
        title: t('auth.setup_password'),
        description: t('auth.setup_password_description'),
    });

    return (
        <>
            <Head title={t('auth.setup_password')} />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">{t('auth.welcome_to_taska')}</h1>
                <p className="mt-2 text-muted-foreground">
                    {inviterName} invited you to join <span className="font-medium">{workspaceName}</span> as {role}
                </p>
            </div>

            <Form
                action={route('password.setup.store')}
                method="post"
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('auth.create_password')}</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoFocus
                                    autoComplete="new-password"
                                    placeholder={t('auth.min_8_chars')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">{t('auth.confirm_password')}</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    placeholder={t('auth.confirm_password')}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                {t('auth.join_workspace')}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}
