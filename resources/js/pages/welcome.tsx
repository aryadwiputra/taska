import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

export default function Welcome() {
    const { t } = useTranslation();
    const { auth } = usePage().props;

    return (
        <>
            <Head title={t('welcome.title')} />

            <div className="min-h-svh bg-background text-foreground">
                <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
                    <Link
                        href={dashboard()}
                        className="flex items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    <nav className="flex items-center gap-2 text-sm">
                        <ThemeToggle />
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className={cn(buttonVariants({ size: 'sm' }))}
                            >
                                {t('sidebar.dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className={cn(
                                        buttonVariants({
                                            variant: 'ghost',
                                            size: 'sm',
                                        }),
                                    )}
                                >
                                    {t('auth.login')}
                                </Link>
                                <Link
                                    href={register()}
                                    className={cn(
                                        buttonVariants({ size: 'sm' }),
                                    )}
                                >
                                    {t('auth.register')}
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="px-4 pb-10 md:px-6">
                    <section className="relative mx-auto flex min-h-[calc(100svh-6.5rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-night px-6 py-12 text-white shadow-elevated md:px-12 md:py-16">
                        <div className="pointer-events-none absolute inset-0 opacity-60">
                            <div className="absolute top-12 right-[18%] size-3 rounded-full bg-sticker-pink" />
                            <div className="absolute top-24 right-[8%] size-5 rotate-12 rounded-sm bg-sticker-purple" />
                            <div className="absolute right-[28%] bottom-16 size-4 rounded-full bg-sticker-sky" />
                            <div className="absolute bottom-28 left-[8%] size-5 -rotate-12 rounded-sm bg-sticker-orange" />
                            <div className="absolute top-1/3 left-[42%] size-2 rounded-full bg-sticker-green" />
                        </div>

                        <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="flex max-w-3xl flex-col gap-6">
                                <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 shadow-soft backdrop-blur">
                                    <Sparkles className="size-4" />
                                    <span>{t('welcome.eyebrow')}</span>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h1 className="max-w-4xl text-5xl leading-[0.98] font-bold tracking-[-0.055em] text-balance md:text-6xl lg:text-[4rem]">
                                        {t('welcome.hero_title')}
                                    </h1>
                                    <p className="max-w-2xl text-base leading-7 text-white/76 md:text-lg">
                                        {t('welcome.hero_description')}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={
                                            auth.user ? dashboard() : register()
                                        }
                                        className={cn(
                                            buttonVariants({ size: 'lg' }),
                                            'w-full sm:w-auto',
                                        )}
                                    >
                                        {auth.user
                                            ? t('sidebar.dashboard')
                                            : t('welcome.primary_cta')}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    {!auth.user && (
                                        <Link
                                            href={login()}
                                            className={cn(
                                                buttonVariants({
                                                    variant: 'secondary',
                                                    size: 'lg',
                                                }),
                                                'w-full sm:w-auto',
                                            )}
                                        >
                                            {t('welcome.secondary_cta')}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="relative hidden lg:block">
                                <div className="absolute -top-8 right-10 size-20 rounded-2xl bg-sticker-purple/90 shadow-soft" />
                                <div className="absolute top-20 -right-3 size-14 rounded-full bg-sticker-pink shadow-soft" />
                                <div className="absolute -bottom-8 left-14 size-16 rotate-6 rounded-2xl bg-sticker-teal shadow-soft" />

                                <div className="relative rounded-2xl border border-white/15 bg-white p-4 text-foreground shadow-elevated">
                                    <div className="flex items-center justify-between border-b border-border pb-3">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {t('welcome.preview_title')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('welcome.preview_subtitle')}
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                                            {t('welcome.preview_badge')}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 pt-4">
                                        {[
                                            t('welcome.preview_item_1'),
                                            t('welcome.preview_item_2'),
                                            t('welcome.preview_item_3'),
                                        ].map((item) => (
                                            <div
                                                key={item}
                                                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3"
                                            >
                                                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                                                <span className="text-sm font-medium">
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
