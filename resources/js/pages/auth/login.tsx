import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { t } = useTranslation();

    setLayoutProps({
        title: t('auth.login_title'),
        description: t('auth.login_description'),
    });

    return (
        <>
            <Head title={t('auth.login')} />

            {status && (
                <div className="mb-6 rounded-md border border-green-600/20 bg-green-600/10 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <PasskeyVerify />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-baseline justify-between gap-3">
                                <Label htmlFor="password">
                                    {t('auth.password')}
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-sm no-underline"
                                    >
                                        {t('auth.forgot_password')}
                                    </TextLink>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder={t('auth.password')}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox id="remember" name="remember" />
                            <Label
                                htmlFor="remember"
                                className="font-normal text-muted-foreground"
                            >
                                {t('auth.remember_me')}
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 w-full"
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            {processing
                                ? t('auth.signing_in')
                                : t('auth.log_in')}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}
