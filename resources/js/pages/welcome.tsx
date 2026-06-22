import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Blocks,
    CheckCircle2,
    GitBranch,
    Layers3,
    LockKeyhole,
    MessageSquareText,
    Radio,
    ShieldCheck,
    Sparkles,
    Workflow,
    Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

const navItems = [
    { key: 'features', href: '#features' },
    { key: 'workflow', href: '#workflow' },
    { key: 'security', href: '#security' },
] as const;

const proofLogos = [
    {
        name: 'Laravel',
        src: 'https://cdn.simpleicons.org/laravel/0075de',
    },
    {
        name: 'React',
        src: 'https://cdn.simpleicons.org/react/0075de',
    },
    {
        name: 'Tailwind CSS',
        src: 'https://cdn.simpleicons.org/tailwindcss/0075de',
    },
    {
        name: 'MySQL',
        src: 'https://cdn.simpleicons.org/mysql/0075de',
    },
] as const;

const workflowItems = [
    { key: 'backlog', icon: Layers3, className: 'md:col-span-5' },
    { key: 'board', icon: Blocks, className: 'md:col-span-7' },
    { key: 'sprints', icon: Workflow, className: 'md:col-span-4' },
    { key: 'automation', icon: Zap, className: 'md:col-span-4' },
    { key: 'releases', icon: GitBranch, className: 'md:col-span-4' },
] as const;

const collaborationItems = [
    { key: 'plan', icon: MessageSquareText },
    { key: 'move', icon: Radio },
    { key: 'ship', icon: CheckCircle2 },
] as const;

const trustItems = [
    { key: 'roles', icon: ShieldCheck },
    { key: 'approvals', icon: LockKeyhole },
    { key: 'activity', icon: Radio },
] as const;

export default function Welcome() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const isSignedIn = Boolean(auth.user);
    const primaryHref = isSignedIn ? dashboard() : register();

    return (
        <>
            <Head title={t('welcome.title')} />

            <div className="min-h-[100dvh] bg-background text-foreground">
                <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                        <Link
                            href={dashboard()}
                            className="flex min-w-0 items-center gap-2"
                            aria-label={t('welcome.title')}
                        >
                            <AppLogo />
                        </Link>

                        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
                            {navItems.map((item) => (
                                <a
                                    key={item.key}
                                    href={item.href}
                                    className="rounded-full px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    {t(`welcome.nav.${item.key}`)}
                                </a>
                            ))}
                        </nav>

                        <div className="flex shrink-0 items-center gap-2">
                            <ThemeToggle />
                            {isSignedIn ? (
                                <Link
                                    href={dashboard()}
                                    className={cn(
                                        buttonVariants({ size: 'sm' }),
                                    )}
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
                                            'hidden sm:inline-flex',
                                        )}
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className={cn(
                                            buttonVariants({ size: 'sm' }),
                                            'whitespace-nowrap',
                                        )}
                                    >
                                        {t('welcome.primary_cta')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    <section className="relative overflow-hidden px-4 py-8 md:px-6 md:py-12">
                        <div className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
                            <div className="flex max-w-3xl flex-col gap-7">
                                <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-soft">
                                    <Sparkles className="size-4 text-primary" />
                                    <span>{t('welcome.eyebrow')}</span>
                                </div>

                                <div className="flex flex-col gap-5">
                                    <h1 className="max-w-4xl text-4xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance md:text-6xl lg:text-[4.6rem]">
                                        {t('welcome.hero_title')}
                                    </h1>
                                    <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                                        {t('welcome.hero_description')}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={primaryHref}
                                        className={cn(
                                            buttonVariants({ size: 'lg' }),
                                            'w-full whitespace-nowrap sm:w-auto',
                                        )}
                                    >
                                        {isSignedIn
                                            ? t('sidebar.dashboard')
                                            : t('welcome.primary_cta')}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    {!isSignedIn && (
                                        <Link
                                            href={login()}
                                            className={cn(
                                                buttonVariants({
                                                    variant: 'outline',
                                                    size: 'lg',
                                                }),
                                                'w-full whitespace-nowrap sm:w-auto',
                                            )}
                                        >
                                            {t('welcome.secondary_cta')}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -top-8 -left-8 hidden h-36 w-36 rounded-full bg-primary/10 blur-3xl md:block" />
                                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
                                    <img
                                        src="https://picsum.photos/seed/qeerja-planning-room/1100/860"
                                        alt={t('welcome.hero_image_alt')}
                                        className="aspect-[1.18/1] w-full object-cover"
                                    />
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {t('welcome.hero_image_caption')}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-border/70 bg-card/55 px-4 py-8 md:px-6">
                        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                                {t('welcome.proof_description')}
                            </p>
                            <div className="grid grid-cols-4 items-center gap-5 md:flex md:gap-8">
                                {proofLogos.map((logo) => (
                                    <img
                                        key={logo.name}
                                        src={logo.src}
                                        alt={logo.name}
                                        className="mx-auto size-8 opacity-80 grayscale transition-opacity hover:opacity-100 dark:brightness-125"
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        id="features"
                        className="px-4 py-20 md:px-6 md:py-28"
                    >
                        <div className="mx-auto flex max-w-7xl flex-col gap-10">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
                                    {t('welcome.workflow_title')}
                                </h2>
                                <p className="mt-4 text-base leading-7 text-muted-foreground">
                                    {t('welcome.workflow_description')}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-12">
                                {workflowItems.map((item, index) => {
                                    const Icon = item.icon;

                                    return (
                                        <article
                                            key={item.key}
                                            className={cn(
                                                'group min-h-56 rounded-2xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40',
                                                item.className,
                                                index === 1 &&
                                                    'bg-primary text-primary-foreground',
                                                index === 3 &&
                                                    'bg-muted/70 dark:bg-muted/50',
                                            )}
                                        >
                                            <div className="flex h-full flex-col justify-between gap-8">
                                                <Icon
                                                    className={cn(
                                                        'size-6 text-primary transition-transform group-hover:-translate-y-1',
                                                        index === 1 &&
                                                            'text-primary-foreground',
                                                    )}
                                                />
                                                <div className="flex flex-col gap-3">
                                                    <h3 className="text-xl font-semibold tracking-[-0.025em]">
                                                        {t(
                                                            `welcome.workflow.${item.key}.title`,
                                                        )}
                                                    </h3>
                                                    <p
                                                        className={cn(
                                                            'max-w-lg text-sm leading-6 text-muted-foreground',
                                                            index === 1 &&
                                                                'text-primary-foreground/78',
                                                        )}
                                                    >
                                                        {t(
                                                            `welcome.workflow.${item.key}.description`,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section
                        id="workflow"
                        className="px-4 pb-20 md:px-6 md:pb-28"
                    >
                        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
                                <img
                                    src="https://picsum.photos/seed/qeerja-team-workflow/980/760"
                                    alt={t('welcome.collaboration_image_alt')}
                                    className="aspect-[1.28/1] w-full object-cover"
                                />
                            </div>

                            <div className="flex flex-col gap-8">
                                <div>
                                    <h2 className="text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
                                        {t('welcome.collaboration_title')}
                                    </h2>
                                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                                        {t('welcome.collaboration_description')}
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    {collaborationItems.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <article
                                                key={item.key}
                                                className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40 sm:grid-cols-[auto_1fr]"
                                            >
                                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <Icon className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold tracking-[-0.015em]">
                                                        {t(
                                                            `welcome.collaboration.${item.key}.title`,
                                                        )}
                                                    </h3>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {t(
                                                            `welcome.collaboration.${item.key}.description`,
                                                        )}
                                                    </p>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-border/70 bg-card/55 px-4 py-20 md:px-6 md:py-28">
                        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-start">
                            <div>
                                <h2 className="max-w-2xl text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
                                    {t('welcome.developer_title')}
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                                    {t('welcome.developer_description')}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {['laravel', 'inertia', 'react', 'mysql'].map(
                                    (item) => (
                                        <div
                                            key={item}
                                            className="rounded-2xl border border-border bg-background p-5"
                                        >
                                            <p className="text-sm font-semibold">
                                                {t(
                                                    `welcome.developer.${item}.title`,
                                                )}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                {t(
                                                    `welcome.developer.${item}.description`,
                                                )}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        id="security"
                        className="px-4 py-20 md:px-6 md:py-28"
                    >
                        <div className="mx-auto flex max-w-7xl flex-col gap-10">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
                                    {t('welcome.trust_title')}
                                </h2>
                                <p className="mt-4 text-base leading-7 text-muted-foreground">
                                    {t('welcome.trust_description')}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {trustItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <article
                                            key={item.key}
                                            className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                                        >
                                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <Icon className="size-5" />
                                            </div>
                                            <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em]">
                                                {t(
                                                    `welcome.trust.${item.key}.title`,
                                                )}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                {t(
                                                    `welcome.trust.${item.key}.description`,
                                                )}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="px-4 pb-12 md:px-6 md:pb-16">
                        <div className="mx-auto overflow-hidden rounded-2xl border border-border bg-night px-6 py-12 text-white shadow-elevated md:px-12 md:py-16">
                            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                                <div>
                                    <h2 className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
                                        {t('welcome.final_title')}
                                    </h2>
                                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                                        {t('welcome.final_description')}
                                    </p>
                                </div>
                                <Link
                                    href={primaryHref}
                                    className={cn(
                                        buttonVariants({ size: 'lg' }),
                                        'w-full bg-white whitespace-nowrap text-night hover:bg-white/90 sm:w-auto',
                                    )}
                                >
                                    {isSignedIn
                                        ? t('sidebar.dashboard')
                                        : t('welcome.primary_cta')}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
